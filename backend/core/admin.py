from django.contrib import admin
from .models import MainCode, Artifact, MainCodeSequence, Report, ReportType

@admin.register(MainCode)
class MainCodeAdmin(admin.ModelAdmin):
    list_display = ("code", "finding_place", "plan_square", "layer", "level", "grave_no", "created_at")
    search_fields = ("code", "finding_place", "plan_square", "gis")
    list_filter = ("layer", "level")
    ordering = ("-created_at",)

@admin.register(Artifact)
class ArtifactAdmin(admin.ModelAdmin):
    list_display = ("full_artifact_no", "main_code", "artifact_no", "artifact_date", "form_type", "production_material", "period", "is_inventory", "is_active")
    search_fields = ("main_code__code", "artifact_no", "production_material", "period", "finding_shape")
    list_filter = ("form_type", "production_material", "period", "is_inventory", "is_active")
    autocomplete_fields = ("main_code",)
    ordering = ("-created_at",)

admin.site.register(MainCodeSequence)


@admin.register(ReportType)
class ReportTypeAdmin(admin.ModelAdmin):
    list_display = ("name", "order", "is_active", "updated_at")
    list_filter = ("is_active",)
    search_fields = ("name",)
    ordering = ("order", "name")


@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = ("report_title", "report_type", "report_author", "finding_place", "work_year", "writing_date", "created_at")
    list_filter = ("report_type", "work_year", "finding_place")
    search_fields = ("report_title", "report_author", "finding_place")
    autocomplete_fields = ("report_type", "artifacts")
    ordering = ("-created_at",)
