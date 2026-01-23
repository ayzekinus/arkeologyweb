from collections import OrderedDict

from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils.text import slugify

from .models import ArtifactForm, ArtifactFormField, MaterialAlias, MaterialGroup
from .serializers_formbuilder import ArtifactFormSerializer


def _default_unit_options(unit_group: str):
    # Provide sensible defaults when unit choices are not explicitly defined in FormBuilder.
    if unit_group == "length":
        return [
            {"value": "mm", "label": "mm"},
            {"value": "cm", "label": "cm"},
            {"value": "m", "label": "m"},
        ]
    if unit_group == "weight":
        return [
            {"value": "gr", "label": "gr"},
            {"value": "kg", "label": "kg"},
        ]
    if unit_group == "volume":
        return [
            {"value": "ml", "label": "ml"},
            {"value": "l", "label": "l"},
        ]
    return []


class ArtifactFormViewSet(viewsets.ReadOnlyModelViewSet):
    """Read-only endpoints for Form Builder.

    - GET /api/forms/
    - GET /api/forms/<key>/
    - GET /api/forms/<key>/schema/
    """

    serializer_class = ArtifactFormSerializer
    queryset = ArtifactForm.objects.all().order_by("order", "id")
    lookup_field = "key"

    def get_queryset(self):
        qs = super().get_queryset()
        include_all = self.request.query_params.get("all")
        if include_all not in ("1", "true", "True"):
            qs = qs.filter(is_active=True)
        return qs

    @action(detail=True, methods=["get"], url_path="schema")
    def schema(self, request, key=None):
        """Return renderer-friendly schema: sections + fields.

        Each field includes bucket/data_type/unit_group/list_type so frontend can render dynamically.
        """
        form = self.get_object()

        form_fields = (
            ArtifactFormField.objects.filter(form=form, field__is_active=True)
            .select_related("field")
            .order_by("order", "id")
        )

        sections = OrderedDict()
        for ff in form_fields:
            fd = ff.field
            section_title = (fd.section or "").strip() or "Genel"
            sections.setdefault(section_title, [])
            sections[section_title].append(
                {
                    "key": fd.key,
                    "label": fd.label,
                    "data_type": fd.data_type,
                    "bucket": fd.bucket,
                    "required": ff.required,
                    "readonly": ff.readonly,
                    "order": ff.order,
                    "help_text": fd.help_text,
                    "list_type": fd.list_type,
                    "unit_group": fd.unit_group,
                    "unit_options": (fd.choices or _default_unit_options(fd.unit_group)) if fd.unit_group else [],
                    "choices": [] if fd.unit_group else (fd.choices or []),
                }
            )

        payload = {
            "form": ArtifactFormSerializer(form).data,
            "sections": [{"title": title, "fields": fields} for title, fields in sections.items()],
        }
        return Response(payload)

    @action(detail=False, methods=["get"], url_path="by-material")
    def by_material(self, request):
        material = (request.query_params.get("material") or "").strip()
        if not material:
            return Response({"detail": "material parametresi gerekli."}, status=400)

        alias = (
            MaterialAlias.objects.select_related("group")
            .filter(name__iexact=material)
            .first()
        )
        group = alias.group if alias else None
        if not group:
            slug = slugify(material).upper()
            group = (
                MaterialGroup.objects.filter(key__iexact=slug).first()
                or MaterialGroup.objects.filter(title__iexact=material).first()
            )
        if not group:
            return Response({"group": None, "forms": []})

        forms = (
            ArtifactForm.objects.filter(materialformmap__group=group, is_active=True)
            .order_by("materialformmap__order", "order", "id")
        )
        return Response(
            {
                "group": {"key": group.key, "title": group.title},
                "forms": ArtifactFormSerializer(forms, many=True).data,
            }
        )
