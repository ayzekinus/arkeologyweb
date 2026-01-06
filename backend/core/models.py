from __future__ import annotations

from dataclasses import dataclass
from django.db import models, transaction
from django.utils import timezone
from django.core.exceptions import ValidationError

ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
BASE = 26
MAX_CODE_INT = BASE**3 - 1  # ZZZ


def code_to_int(code: str) -> int:
    code = (code or "").strip().upper()
    if len(code) != 3 or any(c not in ALPHABET for c in code):
        raise ValueError("Invalid main code format (expected 3 letters A-Z).")
    n = 0
    for c in code:
        n = n * BASE + ALPHABET.index(c)
    return n


def int_to_code(n: int) -> str:
    if n < 0 or n > MAX_CODE_INT:
        raise ValueError("Out of range for 3-letter code.")
    chars = []
    for _ in range(3):
        n, rem = divmod(n, BASE)
        chars.append(ALPHABET[rem])
    return "".join(reversed(chars))


class MainCodeSequence(models.Model):
    """Keeps last assigned main code to guarantee sequential assignment."""
    last_code = models.CharField(max_length=3, null=True, blank=True)
    updated_at = models.DateTimeField(default=timezone.now)

    def __str__(self) -> str:
        return self.last_code or "EMPTY"


class MainCode(models.Model):
    code = models.CharField(max_length=3, unique=True, db_index=True, verbose_name="Anakod")

    finding_place = models.CharField(max_length=120, verbose_name="Buluntu Yeri")
    plan_square = models.CharField(max_length=60, blank=True, null=True, verbose_name="PlanKare")
    description = models.TextField(blank=True, null=True, verbose_name="Açıklama")

    layer = models.CharField(max_length=60, blank=True, null=True, verbose_name="Tabaka")
    level = models.CharField(max_length=60, blank=True, null=True, verbose_name="Seviye")
    grave_no = models.CharField(max_length=60, blank=True, null=True, verbose_name="Mezar No")
    gis = models.CharField(max_length=255, blank=True, null=True, verbose_name="GIS")

    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(default=timezone.now)

    def __str__(self) -> str:
        return self.code

    def save(self, *args, **kwargs):
        self.updated_at = timezone.now()
        self.code = (self.code or "").strip().upper()
        if len(self.code) != 3:
            raise ValidationError("Anakod 3 harf olmalıdır (AAA ... ZZZ).")
        super().save(*args, **kwargs)

    @classmethod
    def allocate_next_code(cls) -> str:
        """Allocates next available code in a transaction-safe way."""
        with transaction.atomic():
            seq, _ = MainCodeSequence.objects.select_for_update().get_or_create(pk=1)
            if not seq.last_code:
                next_code = "AAA"
            else:
                cur = code_to_int(seq.last_code)
                if cur >= MAX_CODE_INT:
                    raise ValidationError("Anakod havuzu doldu (ZZZ).")
                next_code = int_to_code(cur + 1)

            # Ensure uniqueness even if manual codes exist
            while cls.objects.filter(code=next_code).exists():
                cur = code_to_int(next_code)
                if cur >= MAX_CODE_INT:
                    raise ValidationError("Anakod havuzu doldu (ZZZ).")
                next_code = int_to_code(cur + 1)

            seq.last_code = next_code
            seq.updated_at = timezone.now()
            seq.save(update_fields=["last_code", "updated_at"])
            return next_code


class Artifact(models.Model):
    FORM_TYPES = (
        ("GENEL", "Genel"),
        ("SIKKE", "Sikke"),
        ("SERAMIK", "Seramik"),
        ("MEZAR", "Mezar"),
    )

    main_code = models.ForeignKey(MainCode, on_delete=models.CASCADE, related_name="artifacts", verbose_name="Anakod")
    artifact_no = models.PositiveIntegerField(verbose_name="Buluntu No")  # 1..n (UI pads as 0001)
    artifact_date = models.DateField(verbose_name="Buluntu Tarihi")

    form_type = models.CharField(max_length=20, choices=FORM_TYPES, default="GENEL")

    production_material = models.CharField(max_length=120, blank=True, null=True, verbose_name="Yapım Malzemesi")
    period = models.CharField(max_length=120, blank=True, null=True, verbose_name="Dönem")

    finding_shape = models.CharField(max_length=120, blank=True, null=True, verbose_name="Buluntu Şekli")
    level = models.CharField(max_length=60, blank=True, null=True, verbose_name="Buluntu Seviyesi")
    excavation_inv_no = models.CharField(max_length=60, blank=True, null=True, verbose_name="Kazı Env. No")
    museum_inv_no = models.CharField(max_length=60, blank=True, null=True, verbose_name="Müze Env. No")
    piece_date = models.CharField(max_length=60, blank=True, null=True, verbose_name="Eser Tarihi")
    notes = models.TextField(blank=True, null=True, verbose_name="Notlar/Açıklama")
    source_and_reference = models.TextField(blank=True, null=True, verbose_name="Kaynak/Referans")

    is_active = models.BooleanField(default=True, verbose_name="Aktif")
    is_inventory = models.BooleanField(default=False, verbose_name="Envanterlik")

    # Form-specific fields (flexible for now)
    details = models.JSONField(default=dict, blank=True)
    measurements = models.JSONField(default=dict, blank=True)

    # Media (prototype: store meta + data urls)
    images = models.JSONField(default=list, blank=True)
    drawings = models.JSONField(default=list, blank=True)

    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(default=timezone.now)

    class Meta:
        unique_together = ("main_code", "artifact_no")
        indexes = [
            models.Index(fields=["main_code", "artifact_no"]),
            models.Index(fields=["artifact_date"]),
            models.Index(fields=["form_type"]),
        ]

    def __str__(self) -> str:
        return self.full_artifact_no

    @property
    def full_artifact_no(self) -> str:
        return f"{self.main_code.code}{self.artifact_no:04d}"

    def save(self, *args, **kwargs):
        self.updated_at = timezone.now()
        super().save(*args, **kwargs)
