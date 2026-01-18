from django.db import migrations, models
import django.core.validators


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0003_report_models"),
    ]

    operations = [
        migrations.AlterField(
            model_name="report",
            name="work_year",
            field=models.CharField(
                max_length=4,
                validators=[django.core.validators.RegexValidator(message="Çalışma yılı 4 haneli olmalıdır.", regex=r"^\d{4}$")],
                verbose_name="Çalışma Yılı",
            ),
        ),
    ]
