from django.contrib import admin

from .models import Camera, LocalCamera, WifiCamera


@admin.register(Camera)
class CameraAdmin(admin.ModelAdmin):
    list_display = ["get_name", "user", "status", "connection_type", "location"]


@admin.register(WifiCamera)
class WifiCameraAdmin(admin.ModelAdmin):
    list_display = ["stream_url", "username", "password"]


admin.site.register(LocalCamera)
