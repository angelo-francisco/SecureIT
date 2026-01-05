from django.db import models
from django.urls import reverse
from django.core.exceptions import ObjectDoesNotExist


class Camera(models.Model):
    location = models.CharField(max_length=150, null=True, blank=True)
    status = models.BooleanField(default=True, null=True, blank=True)
    connection_type = models.CharField(
        max_length=1, choices=[("L", "Local"), ("W", "Wi-Fi")], null=True, blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True, null=True, blank=True)

    def __str__(self):
        return f"{self.name} - {self.location}"

    @property
    def get_video_url(self):
        try:
            if self.connection_type == "W":
                return  WifiCamera.get_stream_url(self.pk)
            path = LocalCamera.get_camera_path(self.pk) 
            return reverse("cameras:get-camera-video", query={"index": path[-1]})
        except (ObjectDoesNotExist, KeyError):
            return None
    
    @property
    def get_name(self):
        return f'CAM-{self.pk}'


class LocalCamera(models.Model):
    camera = models.ForeignKey(Camera, on_delete=models.CASCADE)
    info = models.JSONField(default=dict, null=True, blank=True)

    @staticmethod
    def get_camera_path(camera_id):
        """
        Dispara um exeção se não houver path
        """
        cam = LocalCamera.objects.get(camera_id=camera_id)
        return cam.path

    @property
    def path(self):
        return self.info["path"]


class WifiCamera(models.Model):
    camera = models.ForeignKey(Camera, on_delete=models.CASCADE)
    stream_url = models.URLField(max_length=255, null=True, blank=True)
    username = models.CharField(max_length=100, null=True, blank=True)
    password = models.CharField(max_length=100, null=True, blank=True)

    @staticmethod
    def get_stream_url(camera_id):
        cam = WifiCamera.objects.get(camera_id=camera_id)
        return cam.stream_url