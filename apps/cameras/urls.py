from django.urls import path

from .views import (
    cameras,
    delete_camera,
    new_camera,
    view_camera,
    get_cameras,
)

app_name = "cameras"

urlpatterns = [
    path("", cameras, name="home"),
    path("new/", new_camera, name="new"),
    path("<int:id>/", view_camera, name="view"),
    path("<int:id>/del/", delete_camera, name="delete"),
    path("get-cameras/", get_cameras, name="get-cameras"),
]
