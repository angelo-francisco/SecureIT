from django.contrib import admin

from .models import Camera, LocalCamera, WifiCamera

admin.site.register([Camera, LocalCamera, WifiCamera])
