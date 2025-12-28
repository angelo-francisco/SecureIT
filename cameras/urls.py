from django.urls import path
from . import views

urlpatterns = [
    path('', views.lista_cameras, name='lista_cameras'),
    path('nova/', views.criar_camera, name='criar_camera'),
    path('eliminar/<int:id>/', views.eliminar_camera, name='eliminar_camera'),
    path('ver/<int:id>/', views.ver_camera, name='ver_camera'),
]
