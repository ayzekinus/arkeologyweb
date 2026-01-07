from rest_framework.decorators import api_view
from rest_framework.response import Response

@api_view(["GET"])
def health(request):
    return Response({"status": "ok"})

from .viewsets import ArtifactViewSet

@api_view(["GET"])
def routes(request):
    # Minimal debug endpoint: confirms that check-unique action is registered
    return Response({
        "artifact_extra_actions": [a.url_path for a in ArtifactViewSet.get_extra_actions()],
    })
