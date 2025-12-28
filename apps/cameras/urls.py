from django.urls import path
from .views import (
    home_page,
    lista_cameras,
    criar_camera,
    eliminar_camera,
    ver_camera
)

urlpatterns = [
    path("", home_page, name="home_page"),
    path("nova/", criar_camera, name="criar_camera"),
    path("eliminar/<int:id>/", eliminar_camera, name="eliminar_camera"),
    path("ver/<int:id>/", ver_camera, name="ver_camera"),
]
