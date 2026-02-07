from platform import system

from django.core.exceptions import ObjectDoesNotExist
from django.db import models
from django.urls import reverse

from django.contrib.auth import get_user_model


class Camera(models.Model):
    user = models.ForeignKey(
        get_user_model(), on_delete=models.CASCADE, related_name="cameras"
    )
    name = models.CharField(max_length=80, null=True, blank=True)
    location = models.CharField(max_length=150, null=True, blank=True)
    status = models.BooleanField(default=True, null=True, blank=True)  # type: ignore
    connection_type = models.CharField(
        max_length=1, choices=[("L", "Local"), ("W", "Wi-Fi")], null=True, blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True, null=True, blank=True)

    def __str__(self):
        return self.get_name

    @property
    def get_video_url(self):
        try:
            if self.connection_type == "W":
                return WifiCamera.get_stream_url(self.pk)
            path = LocalCamera.get_camera_path(self.pk)
            return reverse("cameras:get-camera-video", query={"index": path[-1]})
        except (ObjectDoesNotExist, KeyError):
            return None

    @property
    def get_name(self):
        return f"CAM-{self.pk}"

    @property
    def get_connection_url_or_id(self):
        if self.connection_type == "W":
            return self.wificamera.stream_url  # type: ignore
        if system() == "Linux":
            return self.localcamera.path.split("video")[-1]  # type: ignore
        return self.localcamera.get_id  # type: ignore


class LocalCamera(models.Model):
    camera = models.OneToOneField(Camera, on_delete=models.CASCADE)
    info = models.JSONField(default=dict, null=True, blank=True)

    @staticmethod
    def get_camera_path(camera_id):
        """
        Dispara um exeção se não houver path
        """
        cam = LocalCamera.objects.get(camera_id=camera_id)  # type: ignore
        return cam.path

    @property
    def path(self):
        return self.info["path"]  # type: ignore

    @property
    def get_id(self):
        return self.info["id"]  # type: ignore


class WifiCamera(models.Model):
    camera = models.OneToOneField(Camera, on_delete=models.CASCADE)
    stream_url = models.URLField(max_length=255, null=True, blank=True)
    username = models.CharField(max_length=100, null=True, blank=True)
    password = models.CharField(max_length=100, null=True, blank=True)

    @staticmethod
    def get_stream_url(camera_id):
        cam = WifiCamera.objects.get(camera_id=camera_id) # type: ignore
        return cam.stream_url
