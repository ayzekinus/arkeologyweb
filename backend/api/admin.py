from django.contrib import admin

from .models import (
    ArtifactForm,
    ArtifactFormField,
    FieldDefinition,
    MaterialAlias,
    MaterialFormMap,
    MaterialGroup,
)


@admin.register(FieldDefinition)
class FieldDefinitionAdmin(admin.ModelAdmin):
    list_display = ("key", "label", "data_type", "bucket", "section", "list_type", "unit_group", "is_active")
    list_filter = ("data_type", "bucket", "is_active")
    search_fields = ("key", "label", "section", "list_type")


class ArtifactFormFieldInline(admin.TabularInline):
    model = ArtifactFormField
    extra = 0
    autocomplete_fields = ("field",)
    fields = ("field", "required", "readonly", "order", "visible_if")
    ordering = ("order", "id")


@admin.register(ArtifactForm)
class ArtifactFormAdmin(admin.ModelAdmin):
    list_display = ("key", "title", "order", "is_active")
    list_filter = ("is_active",)
    search_fields = ("key", "title")
    ordering = ("order", "title")
    inlines = [ArtifactFormFieldInline]


class MaterialAliasInline(admin.TabularInline):
    model = MaterialAlias
    extra = 0
    fields = ("name",)
    ordering = ("name",)


class MaterialFormMapInline(admin.TabularInline):
    model = MaterialFormMap
    extra = 0
    autocomplete_fields = ("form",)
    fields = ("form", "order")
    ordering = ("order", "id")


@admin.register(MaterialGroup)
class MaterialGroupAdmin(admin.ModelAdmin):
    list_display = ("key", "title", "is_active")
    list_filter = ("is_active",)
    search_fields = ("key", "title")
    inlines = [MaterialAliasInline, MaterialFormMapInline]
