from django.urls import path
from django.views.generic.base import RedirectView

from .views import panel

app_name = "panel"

urlpatterns = [
    path("", RedirectView.as_view(url="panel:home")),
    path("panel/", panel, name="home"),
]
