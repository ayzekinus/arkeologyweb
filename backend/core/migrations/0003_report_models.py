from django.db import migrations, models
import django.db.models.deletion
import django.core.validators
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0002_artifact_form_object_and_production_site"),
    ]

    operations = [
        migrations.CreateModel(
            name="ReportType",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=120, unique=True, verbose_name="Rapor Tipi")),
                ("description", models.TextField(blank=True, null=True, verbose_name="Açıklama")),
                ("order", models.PositiveIntegerField(default=0, verbose_name="Sıra")),
                ("is_active", models.BooleanField(default=True, verbose_name="Aktif")),
                ("created_at", models.DateTimeField(default=django.utils.timezone.now)),
                ("updated_at", models.DateTimeField(default=django.utils.timezone.now)),
            ],
            options={
                "ordering": ("order", "name"),
            },
        ),
        migrations.CreateModel(
            name="Report",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("report_author", models.CharField(max_length=160, verbose_name="Raporu Hazırlayan")),
                ("finding_place", models.CharField(max_length=120, verbose_name="Buluntu Yeri")),
                ("writing_date", models.DateField(verbose_name="Yazım Tarihi")),
                ("work_year", models.CharField(max_length=4, validators=[django.core.validators.RegexValidator(message="Çalışma yılı 4 haneli olmalıdır.", regex="^\\d{4}$")], verbose_name="Çalışma Yılı")),
                ("report_title", models.CharField(blank=True, max_length=255, null=True, verbose_name="Rapor Başlık")),
                ("report_description", models.TextField(blank=True, null=True, verbose_name="Rapor Açıklama")),
                ("created_at", models.DateTimeField(default=django.utils.timezone.now)),
                ("updated_at", models.DateTimeField(default=django.utils.timezone.now)),
                ("artifacts", models.ManyToManyField(blank=True, related_name="reports", to="core.artifact", verbose_name="Buluntular")),
                ("report_type", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="reports", to="core.reporttype", verbose_name="Rapor Tipi")),
            ],
            options={
                "ordering": ("-created_at",),
            },
        ),
    ]
