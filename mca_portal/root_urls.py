
from django.urls import include, path

urlpatterns = [
    path("", include(("mca_portal.urls", "portal"), namespace="portal")),
]
