from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import health, lookups
from .viewsets import ArtifactViewSet, MainCodeViewSet, ReportViewSet, ConservationViewSet
from .viewsets_formbuilder import ArtifactFormViewSet

router = DefaultRouter()
router.register(r"main-codes", MainCodeViewSet, basename="maincode")
router.register(r"artifacts", ArtifactViewSet, basename="artifact")
router.register(r"forms", ArtifactFormViewSet, basename="form")
router.register(r"reports", ReportViewSet, basename="report")
router.register(r"conservations", ConservationViewSet, basename="conservation")

urlpatterns = [
    path("health/", health, name="health"),
    path("lookups/", lookups, name="lookups"),
    path("", include(router.urls)),
]
