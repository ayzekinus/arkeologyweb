from rest_framework import serializers
from core.models import MainCode, Artifact


class MainCodeSerializer(serializers.ModelSerializer):
    class Meta:
        model = MainCode
        fields = [
            "id", "code", "finding_place", "plan_square", "description",
            "layer", "level", "grave_no", "gis",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "code", "created_at", "updated_at"]


class ArtifactSerializer(serializers.ModelSerializer):
    main_code_code = serializers.CharField(source="main_code.code", read_only=True)
    main_code_finding_place = serializers.CharField(source="main_code.finding_place", read_only=True)
    full_artifact_no = serializers.CharField(read_only=True)

    class Meta:
        model = Artifact
        fields = [
            "id",
            "main_code",
            "main_code_code",
            "main_code_finding_place",
            "artifact_no",
            "full_artifact_no",
            "artifact_date",
            "form_type",
            "production_material",
            "period",
            "finding_shape",
            "level",
            "excavation_inv_no",
            "museum_inv_no",
            "piece_date",
            "notes",
            "source_and_reference",
            "is_active",
            "is_inventory",
            "details",
            "measurements",
            "images",
            "drawings",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "full_artifact_no", "created_at", "updated_at"]

    def validate(self, attrs):
        # Enforce unique_together with nice message
        main_code = attrs.get("main_code") or getattr(self.instance, "main_code", None)
        artifact_no = attrs.get("artifact_no") or getattr(self.instance, "artifact_no", None)
        if main_code and artifact_no:
            qs = Artifact.objects.filter(main_code=main_code, artifact_no=artifact_no)
            if self.instance:
                qs = qs.exclude(pk=self.instance.pk)
            if qs.exists():
                raise serializers.ValidationError({"artifact_no": "Bu Anakod için bu Buluntu No zaten mevcut."})
        return attrs
