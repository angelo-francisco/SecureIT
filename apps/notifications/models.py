from django.contrib.auth import get_user_model
from django.db import models

from apps.cameras.models import Camera

class Notification(models.Model):
    user = models.ForeignKey(
        get_user_model(), on_delete=models.CASCADE, related_name="notifications", verbose_name="Utilizador"
    )
    title = models.CharField(max_length=50, verbose_name="Título")
    description = models.TextField(verbose_name="Descrição")
    level = models.CharField(
        max_length=1,
        choices=[
            ("I", "Informação"),
            ("E", "Erro"),
            ("S", "Suspeito"),
            ("P", "Perigo"),
        ],
        verbose_name="Nível"
    )
    deleted = models.BooleanField(default=False, verbose_name="Eliminado") # type: ignore
    camera = models.ForeignKey(Camera, on_delete=models.CASCADE, null=True, blank=True)
    readed = models.BooleanField(default=False, verbose_name="Lida") # type: ignore
    photo = models.ImageField(upload_to="notifications_frames/", null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Data de Criação")

    def __str__(self) -> str:
        return f'Notificação de {self.user.get_full_name()}'

    class Meta:
        verbose_name = "Notificação"
        verbose_name_plural = "Notificações"