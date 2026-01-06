# Generated manually for initial scaffold
from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name="MainCodeSequence",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("last_code", models.CharField(blank=True, max_length=3, null=True)),
                ("updated_at", models.DateTimeField(default=django.utils.timezone.now)),
            ],
        ),
        migrations.CreateModel(
            name="MainCode",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("code", models.CharField(db_index=True, max_length=3, unique=True, verbose_name="Anakod")),
                ("finding_place", models.CharField(max_length=120, verbose_name="Buluntu Yeri")),
                ("plan_square", models.CharField(blank=True, max_length=60, null=True, verbose_name="PlanKare")),
                ("description", models.TextField(blank=True, null=True, verbose_name="Açıklama")),
                ("layer", models.CharField(blank=True, max_length=60, null=True, verbose_name="Tabaka")),
                ("level", models.CharField(blank=True, max_length=60, null=True, verbose_name="Seviye")),
                ("grave_no", models.CharField(blank=True, max_length=60, null=True, verbose_name="Mezar No")),
                ("gis", models.CharField(blank=True, max_length=255, null=True, verbose_name="GIS")),
                ("created_at", models.DateTimeField(default=django.utils.timezone.now)),
                ("updated_at", models.DateTimeField(default=django.utils.timezone.now)),
            ],
        ),
        migrations.CreateModel(
            name="Artifact",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("artifact_no", models.PositiveIntegerField(verbose_name="Buluntu No")),
                ("artifact_date", models.DateField(verbose_name="Buluntu Tarihi")),
                ("form_type", models.CharField(choices=[("GENEL", "Genel"), ("SIKKE", "Sikke"), ("SERAMIK", "Seramik"), ("MEZAR", "Mezar")], default="GENEL", max_length=20)),
                ("production_material", models.CharField(blank=True, max_length=120, null=True, verbose_name="Yapım Malzemesi")),
                ("period", models.CharField(blank=True, max_length=120, null=True, verbose_name="Dönem")),
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
                ("created_at", models.DateTimeField(default=django.utils.timezone.now)),
                ("updated_at", models.DateTimeField(default=django.utils.timezone.now)),
                ("main_code", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="artifacts", to="core.maincode", verbose_name="Anakod")),
            ],
            options={
                "unique_together": {("main_code", "artifact_no")},
            },
        ),
        migrations.AddIndex(
            model_name="artifact",
            index=models.Index(fields=["main_code", "artifact_no"], name="core_artifa_main_co_4d1a6a_idx"),
        ),
        migrations.AddIndex(
            model_name="artifact",
            index=models.Index(fields=["artifact_date"], name="core_artifa_artifac_2d5d4f_idx"),
        ),
        migrations.AddIndex(
            model_name="artifact",
            index=models.Index(fields=["form_type"], name="core_artifa_form_ty_2b25fb_idx"),
        ),
    ]
