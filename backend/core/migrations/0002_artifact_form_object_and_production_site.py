from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="artifact",
            name="form_object",
            field=models.CharField(blank=True, max_length=120, null=True, verbose_name="Form/Obje"),
        ),
        migrations.AddField(
            model_name="artifact",
            name="production_site",
            field=models.CharField(blank=True, max_length=120, null=True, verbose_name="Üretim Yeri"),
        ),
        migrations.AddField(
            model_name="artifact",
            name="other_place_info",
            field=models.CharField(blank=True, max_length=255, null=True, verbose_name="B. Yeri Diğer"),
        ),
    ]
