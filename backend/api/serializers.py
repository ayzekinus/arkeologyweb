from rest_framework import serializers
from core.models import MainCode, Artifact, Report, Conservation
from .models import LookupItem


class MainCodeSerializer(serializers.ModelSerializer):
    finding_place_label = serializers.CharField(source="finding_place.label", read_only=True)

    class Meta:
        model = MainCode
        fields = [
            "id", "code", "finding_place", "finding_place_label", "plan_square", "description",
            "layer", "level", "grave_no", "gis",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "code", "created_at", "updated_at"]


class ArtifactSerializer(serializers.ModelSerializer):
    main_code_code = serializers.CharField(source="main_code.code", read_only=True)
    main_code_finding_place = serializers.CharField(source="main_code.finding_place.label", read_only=True)
    main_code_plan_square = serializers.CharField(source="main_code.plan_square", read_only=True)
    main_code_description = serializers.CharField(source="main_code.description", read_only=True)
    main_code_layer = serializers.CharField(source="main_code.layer", read_only=True)
    main_code_level = serializers.CharField(source="main_code.level", read_only=True)
    main_code_grave_no = serializers.CharField(source="main_code.grave_no", read_only=True)
    main_code_gis = serializers.CharField(source="main_code.gis", read_only=True)
    full_artifact_no = serializers.CharField(read_only=True)

    class Meta:
        model = Artifact
        fields = [
            "id",
            "main_code",
            "main_code_code",
            "main_code_finding_place",
            "main_code_plan_square",
            "main_code_description",
            "main_code_layer",
            "main_code_level",
            "main_code_grave_no",
            "main_code_gis",
            "artifact_no",
            "full_artifact_no",
            "artifact_date",
            "form_type",
            "production_material",
            "period",
            "form_object",
            "production_site",
            "other_place_info",
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


class ReportSerializer(serializers.ModelSerializer):
    artifact_count = serializers.IntegerField(source="artifacts.count", read_only=True)
    finding_place_label = serializers.CharField(source="finding_place.label", read_only=True)
    finding_place = serializers.PrimaryKeyRelatedField(
        queryset=LookupItem.objects.filter(lookup__key="FINDING_PLACE", is_active=True),
    )
    artifacts = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Artifact.objects.all(),
        required=False,
    )

    class Meta:
        model = Report
        fields = [
            "id",
            "report_type",
            "prepared_by",
            "finding_place",
            "finding_place_label",
            "writing_date",
            "study_year",
            "title",
            "description",
            "artifacts",
            "artifact_count",
            "images",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "artifact_count", "created_at", "updated_at"]

    def validate_study_year(self, value):
        if value < 1000 or value > 9999:
            raise serializers.ValidationError("Çalışma Yılı 4 haneli olmalıdır.")
        return value


class ConservationSerializer(serializers.ModelSerializer):
    artifact_full_no = serializers.CharField(source="artifact.full_artifact_no", read_only=True)

    class Meta:
        model = Conservation
        fields = [
            "id",
            "artifact",
            "artifact_full_no",
            "material",
            "form_keys",
            "data",
            "images",
            "conservator",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "artifact_full_no", "created_at", "updated_at"]
