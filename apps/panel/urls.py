from django.urls import path
from django.views.generic.base import RedirectView

from .views import panel

urlpatterns = [
    path("", RedirectView.as_view(url="panel")),
    path("panel/", panel, name="panel"),
]
