from django.db import migrations, models
from django.utils import timezone
import django.db.models.deletion


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        ("api", "__first__"),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            state_operations=[
                migrations.CreateModel(
                    name="MainCodeSequence",
                    fields=[
                        ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                        ("last_code", models.CharField(blank=True, max_length=3, null=True)),
                        ("updated_at", models.DateTimeField(default=timezone.now)),
                    ],
                ),
                migrations.CreateModel(
                    name="MainCode",
                    fields=[
                        ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                        ("code", models.CharField(db_index=True, max_length=3, unique=True, verbose_name="Anakod")),
                        ("plan_square", models.CharField(blank=True, max_length=60, null=True, verbose_name="PlanKare")),
                        ("description", models.TextField(blank=True, null=True, verbose_name="Açıklama")),
                        ("layer", models.CharField(blank=True, max_length=60, null=True, verbose_name="Tabaka")),
                        ("level", models.CharField(blank=True, max_length=60, null=True, verbose_name="Seviye")),
                        ("grave_no", models.CharField(blank=True, max_length=60, null=True, verbose_name="Mezar No")),
                        ("gis", models.CharField(blank=True, max_length=255, null=True, verbose_name="GIS")),
                        ("created_at", models.DateTimeField(default=timezone.now)),
                        ("updated_at", models.DateTimeField(default=timezone.now)),
                        (
                            "finding_place",
                            models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="main_codes", to="api.lookupitem", verbose_name="Buluntu Yeri"),
                        ),
                    ],
                ),
                migrations.CreateModel(
                    name="Artifact",
                    fields=[
                        ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                        ("artifact_no", models.PositiveIntegerField(verbose_name="Buluntu No")),
                        ("artifact_date", models.DateField(verbose_name="Buluntu Tarihi")),
                        (
                            "form_type",
                            models.CharField(
                                choices=[
                                    ("GENEL", "Genel"),
                                    ("SIKKE", "Sikke"),
                                    ("SERAMIK", "Seramik"),
                                    ("TERRACOTTA", "Terracotta"),
                                    ("FIGURIN", "Figürin"),
                                    ("MEZAR", "Mezar"),
                                    ("CAM_METAL", "Cam / Metal"),
                                ],
                                default="GENEL",
                                max_length=20,
                            ),
                        ),
                        ("production_material", models.CharField(blank=True, max_length=120, null=True, verbose_name="Yapım Malzemesi")),
                        ("period", models.CharField(blank=True, max_length=120, null=True, verbose_name="Dönem")),
                        ("form_object", models.CharField(blank=True, max_length=120, null=True, verbose_name="Form/Obje")),
                        ("production_site", models.CharField(blank=True, max_length=120, null=True, verbose_name="Üretim Yeri")),
                        ("other_place_info", models.CharField(blank=True, max_length=255, null=True, verbose_name="B. Yeri Diğer")),
                        ("finding_shape", models.CharField(blank=True, max_length=120, null=True, verbose_name="Buluntu Şekli")),
                        ("level", models.CharField(blank=True, max_length=60, null=True, verbose_name="Buluntu Seviyesi")),
                        ("excavation_inv_no", models.CharField(blank=True, max_length=60, null=True, verbose_name="Kazı Env. No")),
                        ("museum_inv_no", models.CharField(blank=True, max_length=60, null=True, verbose_name="Müze Env. No")),
                        ("piece_date", models.CharField(blank=True, max_length=60, null=True, verbose_name="Eser Tarihi")),
                        ("notes", models.TextField(blank=True, null=True, verbose_name="Notlar/Açıklama")),
                        ("source_and_reference", models.TextField(blank=True, null=True, verbose_name="Kaynak/Referans")),
                        ("is_active", models.BooleanField(default=True, verbose_name="Aktif")),
                        ("is_inventory", models.BooleanField(default=False, verbose_name="Envanterlik")),
                        ("details", models.JSONField(blank=True, default=dict)),
                        ("measurements", models.JSONField(blank=True, default=dict)),
                        ("images", models.JSONField(blank=True, default=list)),
                        ("drawings", models.JSONField(blank=True, default=list)),
                        ("created_at", models.DateTimeField(default=timezone.now)),
                        ("updated_at", models.DateTimeField(default=timezone.now)),
                        (
                            "main_code",
                            models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="artifacts", to="core.maincode", verbose_name="Anakod"),
                        ),
                    ],
                    options={
                        "unique_together": {("main_code", "artifact_no")},
                    },
                ),
                migrations.CreateModel(
                    name="Report",
                    fields=[
                        ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                        (
                            "report_type",
                            models.CharField(
                                choices=[
                                    ("GENEL", "Genel"),
                                    ("KAZI", "Kazı"),
                                    ("LAB", "Laboratuvar"),
                                    ("KONSERVASYON", "Konservasyon"),
                                    ("DIGER", "Diğer"),
                                ],
                                max_length=30,
                                verbose_name="Rapor Tipi",
                            ),
                        ),
                        ("prepared_by", models.CharField(max_length=120, verbose_name="Raporu Hazırlayan")),
                        ("writing_date", models.DateField(verbose_name="Yazım Tarihi")),
                        ("study_year", models.PositiveIntegerField(verbose_name="Çalışma Yılı")),
                        ("title", models.CharField(max_length=255, verbose_name="Rapor Başlığı")),
                        ("description", models.TextField(blank=True, default="", verbose_name="Rapor Açıklama")),
                        ("images", models.JSONField(blank=True, default=list, verbose_name="Fotoğraflar")),
                        ("created_at", models.DateTimeField(default=timezone.now)),
                        ("updated_at", models.DateTimeField(default=timezone.now)),
                        (
                            "artifacts",
                            models.ManyToManyField(blank=True, related_name="reports", to="core.artifact", verbose_name="Buluntular"),
                        ),
                        (
                            "finding_place",
                            models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="reports", to="api.lookupitem", verbose_name="Buluntu Yeri"),
                        ),
                    ],
                    options={"ordering": ["-created_at"]},
                ),
            ],
            database_operations=[],
        ),
    ]
