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

        # NOTE:
        # DRF uses `?format=` for renderer negotiation by default. We disable URL_FORMAT_OVERRIDE in settings,
        # but we still prefer `?export=` on the client to avoid any future conflicts.
        fmt = (request.query_params.get("export") or request.query_params.get("format") or "csv").lower().strip()

        kv = _artifact_kv(artifact)
        filename_base = artifact.full_artifact_no

        # ---- CSV / XLSX (field/value) ----
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

        # ---- HTML -> PDF (UI-like) ----
        s = ArtifactSerializer(artifact).data
        details = s.get("details") or {}
        measurements = s.get("measurements") or {}
        images = s.get("images") or []
        drawings = s.get("drawings") or []

        def yesno(v):
            return "Evet" if v else "Hayır"

        def humanize_key(k: str) -> str:
            return str(k).replace(".", " / ").replace("_", " ").strip().title()

        def build_sections():
            general = [
                ("Tam No", s.get("full_artifact_no") or ""),
                ("Anakod", s.get("main_code_code") or ""),
                ("Buluntu Yeri", s.get("main_code_finding_place") or ""),
                ("Buluntu No", str(s.get("artifact_no") or "")),
                ("Buluntu Tarihi", s.get("artifact_date") or ""),
                ("Form", s.get("form_type") or ""),
                ("Yapım Malzemesi", s.get("production_material") or ""),
                ("Dönem", s.get("period") or ""),
                ("Eser Tarihi", s.get("piece_date") or ""),
                ("Envanterlik", yesno(s.get("is_inventory"))),
                ("Aktif", yesno(s.get("is_active"))),
            ]
            reference = s.get("source_and_reference") or ""
            notes = s.get("notes") or ""
            form_rows = [(humanize_key(k), v) for k, v in sorted(details.items(), key=lambda x: str(x[0]))] if isinstance(details, dict) else []
            meas_rows = [(humanize_key(k), v) for k, v in sorted(measurements.items(), key=lambda x: str(x[0]))] if isinstance(measurements, dict) else []
            media = [
                ("Fotoğraf Sayısı", str(len(images))),
                ("Çizim Sayısı", str(len(drawings))),
            ]
            if images:
                media.append(("Fotoğraflar", "\n".join(map(str, images[:30])) + ("" if len(images) <= 30 else f"\n(+{len(images)-30} adet)")))
            if drawings:
                media.append(("Çizimler", "\n".join(map(str, drawings[:30])) + ("" if len(drawings) <= 30 else f"\n(+{len(drawings)-30} adet)")))
            return general, reference, notes, form_rows, meas_rows, media

        def artifact_html():
            general, reference, notes, form_rows, meas_rows, media = build_sections()

            def esc(x):
                if x is None:
                    return ""
                return str(x).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")

            def rows_html(rows):
                out = []
                for k, v in rows:
                    out.append(
                        f"""<div class="row"><div class="k">{esc(k)}</div><div class="v">{esc(v).replace("\n","<br/>")}</div></div>"""
                    )
                return "\n".join(out)

            style = """
            <style>
              @page { size: A4; margin: 16mm 16mm; }
              body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; color:#0f172a; }
              .wrap { background:#f8fafc; padding: 12px; border-radius: 16px; }
              .title { font-size:18px; font-weight:800; margin: 0 0 4px 0; }
              .subtitle { font-size:12px; color:#475569; margin: 0 0 12px 0; }
              .grid { display: grid; grid-template-columns: 1fr; gap: 12px; }
              .card { background:#fff; border:1px solid #e2e8f0; border-radius: 16px; padding: 12px; }
              .card h2 { font-size: 13px; margin: 0 0 10px 0; font-weight: 800; }
              .row { display: grid; grid-template-columns: 140px 1fr; gap: 10px; padding: 7px 0; border-bottom:1px solid #f1f5f9; }
              .row:last-child { border-bottom: none; }
              .k { font-size: 11px; font-weight: 800; color:#334155; text-transform: uppercase; letter-spacing: .04em; }
              .v { font-size: 12px; color:#0f172a; }
              .two { display:grid; grid-template-columns: 1fr 1fr; gap: 12px; }
              .muted { color:#64748b; font-size: 12px; }
            </style>
            """

            html = f"""<!doctype html>
            <html><head><meta charset="utf-8"/>{style}</head>
            <body>
              <div class="wrap">
                <div class="title">Buluntu Detay Export</div>
                <div class="subtitle">Buluntu: <b>{esc(s.get("full_artifact_no") or "")}</b></div>

                <div class="grid">
                  <div class="card">
                    <h2>Genel Bilgiler</h2>
                    {rows_html(general)}
                  </div>

                  {f'<div class="card"><h2>Kaynak / Referans</h2>{rows_html([("Metin", reference)])}</div>' if str(reference).strip() else ''}

                  {f'<div class="card"><h2>Notlar / Açıklama</h2>{rows_html([("Metin", notes)])}</div>' if str(notes).strip() else ''}

                  {f'<div class="card"><h2>Form Detayları</h2>{rows_html(form_rows)}</div>' if form_rows else ''}

                  {f'<div class="card"><h2>Ölçü ve Renk Bilgileri</h2>{rows_html(meas_rows)}</div>' if meas_rows else ''}

                  {f'<div class="card"><h2>Medya</h2>{rows_html(media)}</div>' if media else ''}
                </div>
              </div>
            </body></html>"""
            return html

        def artifact_pdf_reportlab():
            # ReportLab fallback and "pdf_simple/pdf_reportlab" mode: sectioned, card-like
            try:
                from reportlab.lib import colors
                from reportlab.lib.pagesizes import A4
                from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
                from reportlab.lib.units import mm
                from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
            except Exception:
                return None

            general, reference, notes, form_rows, meas_rows, media = build_sections()

            styles = getSampleStyleSheet()
            title_style = ParagraphStyle(
                "title",
                parent=styles["Title"],
                fontName="Helvetica-Bold",
                fontSize=16,
                textColor=colors.HexColor("#0f172a"),
                spaceAfter=8,
            )
            sub_style = ParagraphStyle(
                "sub",
                parent=styles["BodyText"],
                fontName="Helvetica",
                fontSize=9,
                textColor=colors.HexColor("#475569"),
                spaceAfter=10,
            )
            h_style = ParagraphStyle(
                "h",
                parent=styles["Heading3"],
                fontName="Helvetica-Bold",
                fontSize=12,
                textColor=colors.HexColor("#0f172a"),
                spaceBefore=10,
                spaceAfter=8,
            )
            normal = ParagraphStyle(
                "n",
                parent=styles["BodyText"],
                fontName="Helvetica",
                fontSize=9,
                leading=12,
                textColor=colors.HexColor("#0f172a"),
            )
            key_style = ParagraphStyle(
                "k",
                parent=normal,
                fontName="Helvetica-Bold",
                textColor=colors.HexColor("#334155"),
            )

            def rows_table(rows):
                data = []
                for k, v in rows:
                    v = "" if v is None else str(v)
                    data.append([Paragraph(str(k), key_style), Paragraph(v.replace("\n", "<br/>"), normal)])
                t = Table(data, colWidths=[55 * mm, 125 * mm])
                t.setStyle(
                    TableStyle(
                        [
                            ("VALIGN", (0, 0), (-1, -1), "TOP"),
                            ("INNERGRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#e2e8f0")),
                            ("BOX", (0, 0), (-1, -1), 0.6, colors.HexColor("#e2e8f0")),
                            ("ROWBACKGROUNDS", (0, 0), (-1, -1), [colors.white, colors.HexColor("#fbfdff")]),
                            ("LEFTPADDING", (0, 0), (-1, -1), 6),
                            ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                            ("TOPPADDING", (0, 0), (-1, -1), 4),
                            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                        ]
                    )
                )
                return t

            story = []
            story.append(Paragraph("Buluntu Detay Export", title_style))
            story.append(Paragraph(f"Buluntu: <b>{s.get('full_artifact_no') or ''}</b>", sub_style))

            story.append(Paragraph("Genel Bilgiler", h_style))
            story.append(rows_table(general))

            if str(reference).strip():
                story.append(Spacer(1, 8))
                story.append(Paragraph("Kaynak / Referans", h_style))
                story.append(rows_table([("Metin", reference)]))

            if str(notes).strip():
                story.append(Spacer(1, 8))
                story.append(Paragraph("Notlar / Açıklama", h_style))
                story.append(rows_table([("Metin", notes)]))

            if form_rows:
                story.append(Spacer(1, 8))
                story.append(Paragraph("Form Detayları", h_style))
                story.append(rows_table(form_rows))

            if meas_rows:
                story.append(Spacer(1, 8))
                story.append(Paragraph("Ölçü ve Renk Bilgileri", h_style))
                story.append(rows_table(meas_rows))

            if media:
                story.append(Spacer(1, 8))
                story.append(Paragraph("Medya", h_style))
                story.append(rows_table(media))

            bio = io.BytesIO()
            doc = SimpleDocTemplate(
                bio,
                pagesize=A4,
                leftMargin=16 * mm,
                rightMargin=16 * mm,
                topMargin=16 * mm,
                bottomMargin=16 * mm,
                title=f"Buluntu {filename_base}",
            )
            doc.build(story)
            bio.seek(0)
            return bio.read()

        if fmt == "html":
            html = artifact_html()
            return HttpResponse(html, content_type="text/html; charset=utf-8")

        if fmt in {"pdf", "pdf_html"}:
            html = artifact_html()

            try:
                from weasyprint import HTML
                pdf_bytes = HTML(string=html, base_url=request.build_absolute_uri("/")).write_pdf()
                resp = HttpResponse(pdf_bytes, content_type="application/pdf")
                resp["Content-Disposition"] = f'attachment; filename="{filename_base}.pdf"'
                return resp
            except Exception:
                # Fallback to ReportLab (still sectioned)
                pdf_bytes = artifact_pdf_reportlab()
                if pdf_bytes:
                    resp = HttpResponse(pdf_bytes, content_type="application/pdf")
                    resp["Content-Disposition"] = f'attachment; filename="{filename_base}.pdf"'
                    return resp
                return Response({"detail": "PDF üretimi başarısız (weasyprint/reportlab)."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        if fmt in {"pdf_simple", "pdf_reportlab"}:
            pdf_bytes = artifact_pdf_reportlab()
            if not pdf_bytes:
                return Response({"detail": "reportlab yüklü değil."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            resp = HttpResponse(pdf_bytes, content_type="application/pdf")
            resp["Content-Disposition"] = f'attachment; filename="{filename_base}.pdf"'
            return resp

        return Response({"detail": "format desteklenmiyor. csv | xlsx | pdf | html"}, status=status.HTTP_400_BAD_REQUEST)
