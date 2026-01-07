from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import health, routes
from .viewsets import MainCodeViewSet, ArtifactViewSet

router = DefaultRouter()
router.register(r"main-codes", MainCodeViewSet, basename="maincode")
router.register(r"artifacts", ArtifactViewSet, basename="artifact")

urlpatterns = [
    path("health/", health, name="health"),
    path("routes/", routes, name="routes"),
    path("", include(router.urls)),
]
