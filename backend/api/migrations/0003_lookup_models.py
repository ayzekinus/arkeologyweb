from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0002_artifactformfield_is_active"),
    ]

    operations = [
        migrations.CreateModel(
            name="LookupList",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("key", models.SlugField(help_text="e.g. COLOR, PERIOD", max_length=60, unique=True)),
                ("title", models.CharField(max_length=127)),
                ("description", models.TextField(blank=True, default="")),
                ("order", models.PositiveIntegerField(default=99)),
                ("is_active", models.BooleanField(default=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "ordering": ["order", "title"],
            },
        ),
        migrations.CreateModel(
            name="LookupItem",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("value", models.CharField(max_length=120)),
                ("label", models.CharField(max_length=255)),
                ("order", models.PositiveIntegerField(default=99)),
                ("is_active", models.BooleanField(default=True)),
                ("lookup", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="items", to="api.lookuplist")),
            ],
            options={
                "ordering": ["order", "label"],
                "unique_together": {("lookup", "value")},
            },
        ),
    ]
