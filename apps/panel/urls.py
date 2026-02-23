from django.urls import path
from django.views.generic.base import RedirectView

from .views import panel, save_settings

app_name = "panel"

urlpatterns = [
    path("", RedirectView.as_view(pattern_name="panel:home")),
    path("panel/", panel, name="home"),
    path("settings/save/", save_settings, name="save-settings"),
]
