from __future__ import annotations

import csv
import io
import json
from typing import Any, Dict, List, Tuple

from django.db.models import Q
from django.http import HttpResponse
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from core.models import Artifact, MainCode
from .serializers import ArtifactSerializer, MainCodeSerializer


def _flatten(prefix: str, obj: Any, out: Dict[str, str]) -> None:
    if isinstance(obj, dict):
        for k, v in obj.items():
            _flatten(f"{prefix}{k}.", v, out)
        return

    if isinstance(obj, list):
        # keep as JSON to preserve structure
        out[prefix[:-1]] = json.dumps(obj, ensure_ascii=False)
        return

    out[prefix[:-1]] = "" if obj is None else str(obj)


def _artifact_kv(artifact: Artifact) -> List[Tuple[str, str]]:
    s = ArtifactSerializer(artifact).data

    # Add some convenient denormalized fields explicitly on top
    base: Dict[str, Any] = {
        "full_artifact_no": s.get("full_artifact_no"),
        "main_code": s.get("main_code_code"),
        "main_code_finding_place": s.get("main_code_finding_place"),
        "artifact_no": s.get("artifact_no"),
        "artifact_date": s.get("artifact_date"),
        "form_type": s.get("form_type"),
        "production_material": s.get("production_material"),
        "period": s.get("period"),
        "piece_date": s.get("piece_date"),
        "notes": s.get("notes"),
        "source_and_reference": s.get("source_and_reference"),
        "is_active": s.get("is_active"),
        "is_inventory": s.get("is_inventory"),
    }

    # Include the rest (details / measurements / media etc.)
    remainder = {
        "details": s.get("details") or {},
        "measurements": s.get("measurements") or {},
        "images": s.get("images") or [],
        "drawings": s.get("drawings") or [],
        "created_at": s.get("created_at"),
        "updated_at": s.get("updated_at"),
    }

    flat: Dict[str, str] = {}
    for k, v in base.items():
        flat[k] = "" if v is None else str(v)

    for k, v in remainder.items():
        _flatten(f"{k}.", v, flat)

    # stable ordering: base first, then the rest alphabetically
    ordered: List[Tuple[str, str]] = []
    for k in base.keys():
        ordered.append((k, flat.get(k, "")))

    rest_keys = [k for k in flat.keys() if k not in base.keys()]
    for k in sorted(rest_keys):
        ordered.append((k, flat[k]))

    return ordered


class MainCodeViewSet(viewsets.ModelViewSet):
    queryset = MainCode.objects.all().order_by("-created_at")
    serializer_class = MainCodeSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        qp = self.request.query_params

        code = qp.get("code")
        if code:
            qs = qs.filter(code__icontains=code)

        finding_place = qp.get("finding_place")
        if finding_place:
            qs = qs.filter(finding_place__icontains=finding_place)

        q = qp.get("q")
        if q:
            qs = qs.filter(
                Q(code__icontains=q)
                | Q(finding_place__icontains=q)
                | Q(plan_square__icontains=q)
                | Q(description__icontains=q)
                | Q(layer__icontains=q)
                | Q(level__icontains=q)
                | Q(grave_no__icontains=q)
                | Q(gis__icontains=q)
            )

        ordering = qp.get("ordering")
        allowed = {"created_at", "-created_at", "code", "-code"}
        if ordering in allowed:
            qs = qs.order_by(ordering)

        return qs

    def perform_create(self, serializer):
        # code is assigned automatically
        code = MainCode.allocate_next_code()
        serializer.save(code=code)


class ArtifactViewSet(viewsets.ModelViewSet):
    queryset = Artifact.objects.select_related("main_code").all().order_by("-created_at")
    serializer_class = ArtifactSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        qp = self.request.query_params

        # Exact filters
        main_code = qp.get("main_code")
        if main_code:
            qs = qs.filter(main_code_id=main_code)

        form_type = qp.get("form_type")
        if form_type:
            qs = qs.filter(form_type=form_type)

        # Text-ish filters
        main_code_code = qp.get("main_code_code")
        if main_code_code:
            qs = qs.filter(main_code__code__icontains=main_code_code)

        finding_place = qp.get("finding_place")
        if finding_place:
            qs = qs.filter(main_code__finding_place__icontains=finding_place)

        artifact_no = qp.get("artifact_no")
        if artifact_no:
            try:
                qs = qs.filter(artifact_no=int(artifact_no))
            except ValueError:
                pass

        production_material = qp.get("production_material")
        if production_material:
            qs = qs.filter(production_material__icontains=production_material)

        period = qp.get("period")
        if period:
            qs = qs.filter(period__icontains=period)

        # Date range
        date_from = qp.get("date_from")
        if date_from:
            qs = qs.filter(artifact_date__gte=date_from)

        date_to = qp.get("date_to")
        if date_to:
            qs = qs.filter(artifact_date__lte=date_to)

        # General q
        q = qp.get("q")
        if q:
            qs = qs.filter(
                Q(main_code__code__icontains=q)
                | Q(main_code__finding_place__icontains=q)
                | Q(production_material__icontains=q)
                | Q(period__icontains=q)
                | Q(notes__icontains=q)
                | Q(piece_date__icontains=q)
                | Q(source_and_reference__icontains=q)
            )

        # Ordering (whitelist)
        ordering = qp.get("ordering")
        allowed = {
            "created_at",
            "-created_at",
            "artifact_date",
            "-artifact_date",
            "artifact_no",
            "-artifact_no",
            "main_code__code",
            "-main_code__code",
        }
        if ordering in allowed:
            qs = qs.order_by(ordering)

        return qs

    @action(detail=False, methods=["get"], url_path="check-unique")
    def check_unique(self, request):
        main_code = request.query_params.get("main_code")
        artifact_no = request.query_params.get("artifact_no")
        exclude_id = request.query_params.get("exclude_id")

        if not main_code or not artifact_no:
            return Response({"detail": "main_code ve artifact_no gerekli.", "exists": False}, status=status.HTTP_400_BAD_REQUEST)

        try:
            no_int = int(artifact_no)
        except ValueError:
            return Response({"detail": "artifact_no sayı olmalıdır.", "exists": False}, status=status.HTTP_400_BAD_REQUEST)

        qs = Artifact.objects.filter(main_code_id=main_code, artifact_no=no_int)
        if exclude_id:
            qs = qs.exclude(pk=exclude_id)

        return Response({"exists": qs.exists()})

    @action(detail=True, methods=["get"], url_path="export")
    def export(self, request, pk=None):
        artifact = self.get_object()
        fmt = (request.query_params.get("format") or "csv").lower().strip()

        kv = _artifact_kv(artifact)
        filename_base = artifact.full_artifact_no

        if fmt == "csv":
            sio = io.StringIO()
            w = csv.writer(sio)
            w.writerow(["field", "value"])
            for k, v in kv:
                w.writerow([k, v])
            data = sio.getvalue().encode("utf-8-sig")  # excel-friendly BOM
            resp = HttpResponse(data, content_type="text/csv; charset=utf-8")
            resp["Content-Disposition"] = f'attachment; filename="{filename_base}.csv"'
            return resp

        if fmt in {"xlsx", "excel"}:
            try:
                from openpyxl import Workbook
            except Exception:
                return Response({"detail": "openpyxl yüklü değil."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            wb = Workbook()
            ws = wb.active
            ws.title = "Artifact"
            ws.append(["field", "value"])
            for k, v in kv:
                ws.append([k, v])

            bio = io.BytesIO()
            wb.save(bio)
            bio.seek(0)
            resp = HttpResponse(
                bio.read(),
                content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            )
            resp["Content-Disposition"] = f'attachment; filename="{filename_base}.xlsx"'
            return resp

        if fmt == "pdf":
            try:
                from reportlab.lib.pagesizes import A4
                from reportlab.pdfgen import canvas
            except Exception:
                return Response({"detail": "reportlab yüklü değil."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            bio = io.BytesIO()
            c = canvas.Canvas(bio, pagesize=A4)
            width, height = A4

            x = 40
            y = height - 50
            c.setFont("Helvetica-Bold", 14)
            c.drawString(x, y, f"Buluntu Export: {filename_base}")
            y -= 24

            c.setFont("Helvetica", 9)

            def draw_wrapped(label: str, value: str):
                nonlocal y
                line = f"{label}: {value}"
                # naive wrap
                max_chars = 110
                parts = [line[i : i + max_chars] for i in range(0, len(line), max_chars)] or [""]
                for p in parts:
                    if y < 60:
                        c.showPage()
                        c.setFont("Helvetica", 9)
                        y = height - 50
                    c.drawString(x, y, p)
                    y -= 12

            for k, v in kv:
                draw_wrapped(k, v)

            c.showPage()
            c.save()

            bio.seek(0)
            resp = HttpResponse(bio.read(), content_type="application/pdf")
            resp["Content-Disposition"] = f'attachment; filename="{filename_base}.pdf"'
            return resp

        return Response({"detail": "format desteklenmiyor. csv | xlsx | pdf"}, status=status.HTTP_400_BAD_REQUEST)
