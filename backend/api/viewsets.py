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


def _artifact_sections(artifact: Artifact) -> Dict[str, Any]:
    """Return serializer data split into UI-like sections."""
    s = ArtifactSerializer(artifact).data
    return {
        "general": {
            "Tam Buluntu No": s.get("full_artifact_no") or "",
            "Anakod": s.get("main_code_code") or "",
            "Buluntu Yeri": s.get("main_code_finding_place") or "",
            "Buluntu No": s.get("artifact_no") or "",
            "Buluntu Tarihi": s.get("artifact_date") or "",
            "Form": s.get("form_type") or "",
            "Yapım Malzemesi": s.get("production_material") or "",
            "Dönem": s.get("period") or "",
            "Eser Tarihi": s.get("piece_date") or "",
            "Envanterlik": "Evet" if s.get("is_inventory") else "Hayır",
            "Aktif": "Evet" if s.get("is_active") else "Hayır",
        },
        "reference": s.get("source_and_reference") or "",
        "notes": s.get("notes") or "",
        "details": s.get("details") or {},
        "measurements": s.get("measurements") or {},
        "images": s.get("images") or [],
        "drawings": s.get("drawings") or [],
    }


def _artifact_html(artifact: Artifact) -> str:
    sec = _artifact_sections(artifact)

    def esc(x: Any) -> str:
        return (
            str(x)
            .replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;")
            .replace('"', "&quot;")
        )

    def nl2br(s: Any) -> str:
        return esc(s).replace(chr(10), "<br/>")

    def kv_table(d: Dict[str, Any]) -> str:
        rows = []
        for k, v in d.items():
            if v is None or v == "":
                continue
            rows.append(f"<tr><td class='k'>{esc(k)}</td><td class='v'>{nl2br(v)}</td></tr>")
        if not rows:
            return "<div class='muted'>Veri yok.</div>"
        return "<table class='kv'><tbody>" + "".join(rows) + "</tbody></table>"

    def dict_table(d: Dict[str, Any]) -> str:
        if not isinstance(d, dict) or not d:
            return "<div class='muted'>Veri yok.</div>"
        rows = []
        for k in sorted(d.keys(), key=lambda x: str(x)):
            v = d.get(k)
            if v is None or v == "":
                continue
            label = str(k).replace("_", " ").title()
            rows.append(f"<tr><td class='k'>{esc(label)}</td><td class='v'>{nl2br(v)}</td></tr>")
        if not rows:
            return "<div class='muted'>Veri yok.</div>"
        return "<table class='kv'><tbody>" + "".join(rows) + "</tbody></table>"

    def list_block(items: List[str]) -> str:
        if not items:
            return "<div class='muted'>Veri yok.</div>"
        li = "".join([f"<li>{esc(x)}</li>" for x in items[:50]])
        extra = f"<div class='muted'>+{len(items) - 50} adet daha</div>" if len(items) > 50 else ""
        return "<ul class='list'>" + li + "</ul>" + extra

    title = esc(sec["general"].get("Tam Buluntu No") or "Buluntu")

    css = """
:root{--bg:#f8fafc;--card:#fff;--border:#e2e8f0;--text:#0f172a;--muted:#64748b}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial; background:var(--bg); color:var(--text); margin:0; padding:24px}
.wrap{max-width:900px;margin:0 auto}
.h1{font-size:20px;font-weight:800;margin:0 0 4px 0}
.sub{color:var(--muted);font-size:12px;margin-bottom:16px}
.grid{display:grid;grid-template-columns:1fr;gap:12px}
.card{background:var(--card);border:1px solid var(--border);border-radius:16px;padding:14px}
.card h2{margin:0 0 10px 0;font-size:14px;font-weight:800}
table.kv{width:100%;border-collapse:collapse}
table.kv td{border-top:1px solid var(--border);padding:8px 10px;vertical-align:top}
table.kv tr:first-child td{border-top:none}
td.k{width:220px;font-weight:700;color:#1e293b}
td.v{color:#0f172a}
.muted{color:var(--muted);font-size:12px}
.list{margin:0;padding-left:18px}
@page{size:A4;margin:14mm}
"""  # noqa: W605

    html = f"""<!doctype html>
<html>
<head>
<meta charset="utf-8"/>
<style>{css}</style>
</head>
<body>
  <div class="wrap">
    <div class="h1">Buluntu Detay Export</div>
    <div class="sub">Buluntu: <b>{title}</b></div>

    <div class="grid">
      <div class="card">
        <h2>Genel Bilgiler</h2>
        {kv_table(sec["general"])}
      </div>

      <div class="card">
        <h2>Form Detayları</h2>
        {dict_table(sec["details"])}
      </div>

      <div class="card">
        <h2>Ölçü ve Renk Bilgileri</h2>
        {dict_table(sec["measurements"])}
      </div>

      <div class="card">
        <h2>Kaynak / Referans</h2>
        {("<div class='muted'>Veri yok.</div>" if not sec["reference"] else "<div>"+nl2br(sec["reference"])+"</div>")}
      </div>

      <div class="card">
        <h2>Notlar / Açıklama</h2>
        {("<div class='muted'>Veri yok.</div>" if not sec["notes"] else "<div>"+nl2br(sec["notes"])+"</div>")}
      </div>

      <div class="card">
        <h2>Medya</h2>
        <div class="muted">Fotoğraf: {len(sec["images"])} | Çizim: {len(sec["drawings"])}</div>
        <div style="margin-top:8px">
          <div style="font-weight:700;margin-bottom:6px">Fotoğraflar</div>
          {list_block(sec["images"])}
        </div>
        <div style="margin-top:8px">
          <div style="font-weight:700;margin-bottom:6px">Çizimler</div>
          {list_block(sec["drawings"])}
        </div>
      </div>
    </div>
  </div>
</body>
</html>"""
    return html




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
        fmt = (request.query_params.get("export") or request.query_params.get("format") or "csv").lower().strip()

        kv = _artifact_kv(artifact)
        filename_base = artifact.full_artifact_no or f"artifact-{artifact.pk}"
        # HTML preview (UI-like) and HTML→PDF (WeasyPrint).
        # Client should prefer `?export=`. We also accept `?format=` if URL_FORMAT_OVERRIDE is disabled.
        if fmt == "html":
            html = _artifact_html(artifact)
            return HttpResponse(html, content_type="text/html; charset=utf-8")

        if fmt == "pdf_reportlab":
            html = _artifact_html(artifact)
            try:
                from weasyprint import HTML  # lazy import to avoid startup crash
                pdf_bytes = HTML(string=html, base_url=request.build_absolute_uri("/")).write_pdf()
                resp = HttpResponse(pdf_bytes, content_type="application/pdf")
                resp["Content-Disposition"] = f'attachment; filename="{filename_base}.pdf"'
                return resp
            except Exception:
                # Fallback to ReportLab PDF if WeasyPrint is not available or system libs are missing
                fmt = "pdf_reportlab"


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

        if fmt in ("xlsx", "excel"):
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
                from reportlab.lib import colors
                from reportlab.lib.pagesizes import A4
                from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
                from reportlab.lib.units import mm
                from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
            except Exception:
                return Response({"detail": "reportlab yüklü değil."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            s = ArtifactSerializer(artifact).data
            details = s.get("details") or {}
            measurements = s.get("measurements") or {}
            images = s.get("images") or []
            drawings = s.get("drawings") or []

            def yesno(v):
                return "Evet" if v else "Hayır"

            general_rows = [
                ("Buluntu No (Tam)", s.get("full_artifact_no") or ""),
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

            notes = s.get("notes") or ""
            ref = s.get("source_and_reference") or ""

            def humanize_key(k: str) -> str:
                return str(k).replace(".", " / ").replace("_", " ").strip().title()

            def table_for_rows(rows):
                styles = getSampleStyleSheet()
                normal = styles["BodyText"]
                normal.fontName = "Helvetica"
                normal.fontSize = 9
                normal.leading = 12

                key_style = ParagraphStyle(
                    "key",
                    parent=normal,
                    fontName="Helvetica-Bold",
                    textColor=colors.HexColor("#0f172a"),
                )

                data = []
                for k, v in rows:
                    v = "" if v is None else str(v)
                    v = v.replace("\r\n", "\n").replace("\r", "\n").replace("\n", "<br/>")
                    data.append([Paragraph(str(k), key_style), Paragraph(v, normal)])

                t = Table(data, colWidths=[55 * mm, 130 * mm])
                t.setStyle(
                    TableStyle(
                        [
                            ("VALIGN", (0, 0), (-1, -1), "TOP"),
                            ("INNERGRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#e2e8f0")),
                            ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
                            ("ROWBACKGROUNDS", (0, 0), (-1, -1), [colors.white, colors.HexColor("#fbfdff")]),
                            ("LEFTPADDING", (0, 0), (-1, -1), 6),
                            ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                            ("TOPPADDING", (0, 0), (-1, -1), 4),
                            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                        ]
                    )
                )
                return t

            def section_title(txt_: str):
                styles = getSampleStyleSheet()
                h = ParagraphStyle(
                    "h",
                    parent=styles["Heading3"],
                    fontName="Helvetica-Bold",
                    fontSize=12,
                    textColor=colors.HexColor("#0f172a"),
                    spaceAfter=8,
                    spaceBefore=10,
                )
                return Paragraph(txt_, h)

            story = []
            styles = getSampleStyleSheet()
            title_style = ParagraphStyle(
                "title",
                parent=styles["Title"],
                fontName="Helvetica-Bold",
                fontSize=16,
                textColor=colors.HexColor("#0f172a"),
                spaceAfter=10,
            )
            subtitle_style = ParagraphStyle(
                "sub",
                parent=styles["BodyText"],
                fontName="Helvetica",
                fontSize=9,
                textColor=colors.HexColor("#475569"),
                spaceAfter=12,
            )

            story.append(Paragraph("Buluntu Detay Export", title_style))
            story.append(Paragraph(f"Buluntu: <b>{s.get('full_artifact_no') or ''}</b>", subtitle_style))

            story.append(section_title("Genel Bilgiler"))
            story.append(table_for_rows(general_rows))

            if ref.strip():
                story.append(Spacer(1, 8))
                story.append(section_title("Kaynak / Referans"))
                story.append(table_for_rows([("Metin", ref)]))

            if notes.strip():
                story.append(Spacer(1, 8))
                story.append(section_title("Notlar / Açıklama"))
                story.append(table_for_rows([("Metin", notes)]))

            if isinstance(details, dict) and details:
                story.append(Spacer(1, 10))
                story.append(section_title("Form Detayları"))
                rows = [(humanize_key(k), v) for k, v in sorted(details.items(), key=lambda x: str(x[0]))]
                story.append(table_for_rows(rows))

            if isinstance(measurements, dict) and measurements:
                story.append(Spacer(1, 10))
                story.append(section_title("Ölçü ve Renk Bilgileri"))
                rows = [(humanize_key(k), v) for k, v in sorted(measurements.items(), key=lambda x: str(x[0]))]
                story.append(table_for_rows(rows))

            if images or drawings:
                story.append(Spacer(1, 10))
                story.append(section_title("Medya"))
                media_rows = [
                    ("Fotoğraf Sayısı", str(len(images))),
                    ("Çizim Sayısı", str(len(drawings))),
                ]
                if images:
                    media_rows.append(("Fotoğraflar", "\n".join(map(str, images[:20])) + ("" if len(images) <= 20 else f"\n(+{len(images)-20} adet)")))
                if drawings:
                    media_rows.append(("Çizimler", "\n".join(map(str, drawings[:20])) + ("" if len(drawings) <= 20 else f"\n(+{len(drawings)-20} adet)")))
                story.append(table_for_rows(media_rows))

            bio = io.BytesIO()
            doc = SimpleDocTemplate(
                bio,
                pagesize=A4,
                leftMargin=18 * mm,
                rightMargin=18 * mm,
                topMargin=16 * mm,
                bottomMargin=16 * mm,
                title=f"Buluntu {filename_base}",
            )
            doc.build(story)

            bio.seek(0)
            resp = HttpResponse(bio.read(), content_type="application/pdf")
            resp["Content-Disposition"] = f'attachment; filename="{filename_base}.pdf"'
            return resp

        return Response(
            {"detail": "format desteklenmiyor. csv | xlsx | pdf"},
            status=status.HTTP_400_BAD_REQUEST,
        )

