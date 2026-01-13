from django.db import models


class FieldDefinition(models.Model):
    """Reusable field catalog item used by form builder.

    This model defines *what* a field is (type, label, list source, unit group, etc.).
    Then `ArtifactFormField` decides *where* it appears (which form, required/order, etc.).
    """

    class DataType(models.TextChoices):
        STRING = "string", "String"
        TEXT = "text", "Text"
        INT = "int", "Integer"
        DECIMAL = "decimal", "Decimal"
        DATE = "date", "Date"
        BOOL = "bool", "Boolean"
        SELECT = "select", "Select (List-backed)"
        MULTISELECT = "multiselect", "Multi-select (List-backed)"
        CHOICE = "choice", "Choice (static)"
        FILE = "file", "File"

    class Bucket(models.TextChoices):
        DETAILS = "details", "Details"
        MEASUREMENTS = "measurements", "Measurements"
        ADDITIVES = "additives", "Additives"

    key = models.SlugField(
        max_length=120,
        unique=True,
        help_text="Stable key used in JSON storage, e.g. 'coin.emperor' or 'measure.height'.",
    )
    label = models.CharField(max_length=255)
    data_type = models.CharField(max_length=20, choices=DataType.choices)
    bucket = models.CharField(
        max_length=20, choices=Bucket.choices, default=Bucket.DETAILS
    )

    section = models.CharField(
        max_length=120, blank=True, default="", help_text="UI section title"
    )
    help_text = models.CharField(max_length=255, blank=True, default="")

    # For SELECT/MULTISELECT fields
    list_type = models.CharField(
        max_length=60,
        blank=True,
        default="",
        help_text="List source key (to be mapped later), e.g. COLOR, PERIOD, PRODUCTION_SITE.",
    )

    # For unit-aware fields (length/weight etc.)
    unit_group = models.CharField(
        max_length=30,
        blank=True,
        default="",
        help_text="Unit group, e.g. 'length' or 'weight'. Renderer can show unit selector.",
    )

    # For CHOICE fields with static values
    choices = models.JSONField(
        blank=True,
        null=True,
        help_text="For data_type='choice': [{'value':'0','label':'Az'}, ...].",
    )

    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["key"]

    def __str__(self) -> str:
        return f"{self.label} ({self.key})"


class ArtifactForm(models.Model):
    """Form definition (Sikke, Seramik, Mezar, ...).

    New forms can be added from Django admin without code changes.
    """

    key = models.SlugField(
        max_length=60,
        unique=True,
        help_text="Stable key, e.g. SIKKE, SERAMIK, MEZAR, FIGURIN, TERRACOTTA.",
    )
    title = models.CharField(max_length=127)
    description = models.TextField(blank=True, default="")
    order = models.PositiveIntegerField(default=99)

    is_active = models.BooleanField(default=True)
    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["order", "title"]

    def __str__(self) -> str:
        return self.title


class ArtifactFormField(models.Model):
    """Which field appears in which form (and how)."""

    form = models.ForeignKey(ArtifactForm, models.CASCADE, related_name="fields")
    field = models.ForeignKey(FieldDefinition, models.PROTECT, related_name="+")
    required = models.BooleanField(default=False)
    readonly = models.BooleanField(default=False)
    order = models.PositiveIntegerField(default=99)

    # Optional conditional visibility rules (future-proof)
    visible_if = models.JSONField(
        blank=True,
        null=True,
        help_text="Optional rule object for conditional display. Leave null for always visible.",
    )

    class Meta:
        unique_together = ("form", "field")
        ordering = ["order", "id"]

    def __str__(self) -> str:
        return f"{self.form.title}: {self.field.label}"


class MaterialGroup(models.Model):
    """Groups production materials (e.g. Altın/Gümüş -> METAL)."""

    key = models.SlugField(max_length=60, unique=True, help_text="e.g. METAL, CERAMIC")
    title = models.CharField(max_length=127)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["title"]

    def __str__(self) -> str:
        return self.title


class MaterialAlias(models.Model):
    """Maps a material label/value used in Artifact.production_material to a group."""

    name = models.CharField(max_length=127, unique=True, help_text="e.g. Altın, Bronz")
    group = models.ForeignKey(MaterialGroup, models.CASCADE, related_name="aliases")

    class Meta:
        ordering = ["name"]

    def __str__(self) -> str:
        return f"{self.name} -> {self.group.key}"


class MaterialFormMap(models.Model):
    """Which forms are allowed for a material group."""

    group = models.ForeignKey(MaterialGroup, models.CASCADE, related_name="form_maps")
    form = models.ForeignKey(ArtifactForm, models.CASCADE, related_name="+")
    order = models.PositiveIntegerField(default=99)

    class Meta:
        unique_together = ("group", "form")
        ordering = ["order", "id"]

    def __str__(self) -> str:
        return f"{self.group.key} -> {self.form.key}"
