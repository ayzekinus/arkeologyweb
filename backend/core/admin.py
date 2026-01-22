from django.contrib import admin
from api.models import LookupItem, LookupList
from .models import MainCode, Artifact, MainCodeSequence, Report

@admin.register(MainCode)
class MainCodeAdmin(admin.ModelAdmin):
    list_display = ("code", "finding_place", "plan_square", "layer", "level", "grave_no", "created_at")
    search_fields = ("code", "finding_place__label", "plan_square", "gis")
    list_filter = ("layer", "level")
    ordering = ("-created_at",)

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == "finding_place":
            lookup = LookupList.objects.filter(key="FINDING_PLACE").first()
            kwargs["queryset"] = LookupItem.objects.filter(lookup=lookup, is_active=True) if lookup else LookupItem.objects.none()
        return super().formfield_for_foreignkey(db_field, request, **kwargs)

@admin.register(Artifact)
class ArtifactAdmin(admin.ModelAdmin):
    list_display = ("full_artifact_no", "main_code", "artifact_no", "artifact_date", "form_type", "production_material", "period", "is_inventory", "is_active")
    search_fields = ("main_code__code", "artifact_no", "production_material", "period", "finding_shape")
    list_filter = ("form_type", "production_material", "period", "is_inventory", "is_active")
    autocomplete_fields = ("main_code",)
    ordering = ("-created_at",)

admin.site.register(MainCodeSequence)

@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "report_type",
        "prepared_by",
        "finding_place",
        "study_year",
        "writing_date",
        "created_at",
    )
    search_fields = ("title", "prepared_by", "finding_place__label")
    list_filter = ("report_type", "study_year")
    filter_horizontal = ("artifacts",)
    ordering = ("-created_at",)
