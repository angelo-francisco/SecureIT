from django.contrib import admin
from .models import Camera


@admin.register(Camera)
class CameraAdmin(admin.ModelAdmin):
    list_display = ("nome", "localizacao", "ativa", "criada_em")
