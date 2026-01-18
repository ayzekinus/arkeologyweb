from django.db.models import Prefetch
from rest_framework.decorators import api_view
from rest_framework.response import Response

@api_view(["GET"])
def health(request):
    return Response({"status": "ok"})

from .models import LookupItem, LookupList
from .viewsets import ArtifactViewSet

@api_view(["GET"])
def routes(request):
    # Minimal debug endpoint: confirms that check-unique action is registered
    return Response({
        "artifact_extra_actions": [a.url_path for a in ArtifactViewSet.get_extra_actions()],
    })


@api_view(["GET"])
def lookups(request):
    keys_param = request.query_params.get("keys", "")
    keys = [k.strip() for k in keys_param.split(",") if k.strip()]

    lists = LookupList.objects.filter(is_active=True)
    if keys:
        lists = lists.filter(key__in=keys)

    lists = lists.prefetch_related(
        Prefetch(
            "items",
            queryset=LookupItem.objects.filter(is_active=True).order_by("order", "label"),
        )
    ).order_by("order", "title")

    payload = {
        lookup.key: [{"value": item.value, "label": item.label} for item in lookup.items.all()]
        for lookup in lists
    }
    return Response(payload)
