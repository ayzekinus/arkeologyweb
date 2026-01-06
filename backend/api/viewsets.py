from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action

from core.models import MainCode, Artifact
from .serializers import MainCodeSerializer, ArtifactSerializer


class MainCodeViewSet(viewsets.ModelViewSet):
    queryset = MainCode.objects.all().order_by("-created_at")
    serializer_class = MainCodeSerializer

    def create(self, request, *args, **kwargs):
        # Auto allocate code sequentially AAA..ZZZ
        allocated = MainCode.allocate_next_code()
        data = dict(request.data)
        data["code"] = allocated  # serializer read-only, set in instance below

        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        obj = MainCode.objects.create(
            code=allocated,
            finding_place=serializer.validated_data["finding_place"],
            plan_square=serializer.validated_data.get("plan_square"),
            description=serializer.validated_data.get("description"),
            layer=serializer.validated_data.get("layer"),
            level=serializer.validated_data.get("level"),
            grave_no=serializer.validated_data.get("grave_no"),
            gis=serializer.validated_data.get("gis"),
        )
        out = MainCodeSerializer(obj, context=self.get_serializer_context()).data
        headers = self.get_success_headers(out)
        return Response(out, status=status.HTTP_201_CREATED, headers=headers)


class ArtifactViewSet(viewsets.ModelViewSet):
    queryset = Artifact.objects.select_related("main_code").all().order_by("-created_at")
    serializer_class = ArtifactSerializer
