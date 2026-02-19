from django.contrib.auth import get_user_model
from django.db import models

from apps.cameras.models import Camera

class Notification(models.Model):
    user = models.ForeignKey(
        get_user_model(), on_delete=models.CASCADE, related_name="notifications"
    )
    title = models.CharField(max_length=50)
    description = models.TextField()
    level = models.CharField(
        max_length=1,
        choices=[
            ("I", "Informação"),
            ("E", "Erro"),
            ("S", "Suspeito"),
            ("P", "Perigo"),
        ],
    )
    deleted = models.BooleanField(default=False)
    camera = models.ForeignKey(Camera, on_delete=models.CASCADE, null=True, blank=True)
    readed = models.BooleanField(default=False) # type: ignore
    photo = models.ImageField(upload_to="notifications_frames/")
    created_at = models.DateTimeField(auto_now_add=True)
