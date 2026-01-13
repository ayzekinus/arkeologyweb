from rest_framework import serializers

from .models import ArtifactForm


class ArtifactFormSerializer(serializers.ModelSerializer):
    class Meta:
        model = ArtifactForm
        fields = ("key", "title", "description", "order", "is_active")
