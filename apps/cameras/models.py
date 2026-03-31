from platform import system

from django.core.exceptions import ObjectDoesNotExist
from django.db import models
from django.urls import reverse

from django.contrib.auth import get_user_model


class Camera(models.Model):
    user = models.ForeignKey(
        get_user_model(),
        on_delete=models.CASCADE,
        related_name="cameras",
        verbose_name="Utilizador",
    )
    name = models.CharField(max_length=30, null=True, blank=True, verbose_name="Nome")
    location = models.CharField(
        max_length=150, null=True, blank=True, verbose_name="Localizaão"
    )
    status = models.BooleanField(
        default=True, null=True, blank=True, verbose_name="Estado"
    )  # type: ignore
    connection_type = models.CharField(
        max_length=1,
        choices=[("L", "Local"), ("W", "Wi-Fi")],
        null=True,
        blank=True,
        verbose_name="Tipo de Conexão",
    )
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True, null=True, blank=True)

    @property
    def get_video_url(self):
        try:
            if self.connection_type == "W":
                return self.wificamera.get_stream_url(self.pk)  # type: ignore
            path = self.localcamera.get_camera_path(self.pk)  # type: ignore
            return reverse("cameras:get-camera-video", query={"index": path[-1]})
        except (ObjectDoesNotExist, KeyError):
            return None

    @property
    def get_name(self):
        return f"CAM-{self.pk}"

    get_name.fget.short_description = "Nome"  # type:ignore

    @property
    def video_source(self):
        if self.connection_type == "W":
            return self.wificamera.stream_url  # type: ignore
        if system() == "Linux":
            return self.localcamera.path.split("video")[-1]  # type: ignore
        return self.localcamera.get_id  # type: ignore

    def __str__(self) -> str:
        return f"{self.get_name}"

    class Meta:
        verbose_name = "Câmara"
        verbose_name_plural = "Câmaras"


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

    def __str__(self) -> str:
        return f"{self.camera.get_name}"

    class Meta:
        verbose_name = "Câmara Local"
        verbose_name_plural = "Câmaras Locais"


class WifiCamera(models.Model):
    camera = models.OneToOneField(Camera, on_delete=models.CASCADE)
    stream_url = models.URLField(
        max_length=255, null=True, blank=True, verbose_name="URL de Transmissão"
    )

    @staticmethod
    def get_stream_url(camera_id):
        cam = WifiCamera.objects.get(camera_id=camera_id)  # type: ignore
        return cam.stream_url

    def __str__(self) -> str:
        return f"{self.camera.get_name}"

    class Meta:
        verbose_name = "Câmara Wifi"
        verbose_name_plural = "Câmaras Wifi"

class DetectionLine(models.Model):
    camera = models.OneToOneField(Camera, on_delete=models.CASCADE)
    x1 = models.FloatField()
    y1 = models.FloatField()
    x2 = models.FloatField()
    y2 = models.FloatField()