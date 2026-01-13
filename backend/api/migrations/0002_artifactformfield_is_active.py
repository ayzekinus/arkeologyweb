from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0001_formbuilder_models"),
    ]

    operations = [
        migrations.AddField(
            model_name="artifactformfield",
            name="is_active",
            field=models.BooleanField(default=True),
        ),
    ]
