from django.db import migrations, models
from django.utils import timezone
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="Conservation",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("material", models.CharField(blank=True, max_length=120, null=True, verbose_name="Yapım Malzemesi")),
                ("form_keys", models.JSONField(blank=True, default=list, verbose_name="Form Anahtarları")),
                ("data", models.JSONField(blank=True, default=dict, verbose_name="Konservasyon Verisi")),
                ("images", models.JSONField(blank=True, default=list, verbose_name="Görseller")),
                ("conservator", models.CharField(blank=True, default="", max_length=120, verbose_name="Konservatör")),
                ("created_at", models.DateTimeField(default=timezone.now)),
                ("updated_at", models.DateTimeField(default=timezone.now)),
                (
                    "artifact",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="conservations", to="core.artifact"),
                ),
            ],
            options={"ordering": ["-created_at"]},
        ),
    ]
