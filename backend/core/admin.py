from django.contrib import admin
from .models import MainCode, Artifact, MainCodeSequence

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
