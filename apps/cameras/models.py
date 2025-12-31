from django.db import models


class Camera(models.Model):
    name = models.CharField(max_length=100, null=True, blank=True)
    location = models.CharField(max_length=150, null=True, blank=True)
    status = models.BooleanField(default=True, null=True, blank=True)
    connection_type = models.CharField(
        max_length=1, choices=[("L", "Local"), ("W", "Wi-Fi")], null=True, blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True, null=True, blank=True)

    def __str__(self):
        return f"{self.name} - {self.location}"


class LocalCamera(models.Model):
    camera = models.ForeignKey(Camera, on_delete=models.CASCADE)
    info = models.JSONField(default=dict, null=True, blank=True)


class WifiCamera(models.Model):
    camera = models.ForeignKey(Camera, on_delete=models.CASCADE)
    stream_url = models.URLField(max_length=255, null=True, blank=True)
    username = models.CharField(max_length=100, null=True, blank=True)
    password = models.CharField(max_length=100, null=True, blank=True)
