from time import strptime

from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator
from django.db import models


class Configuration(models.Model):
    user = models.OneToOneField(
        get_user_model(), on_delete=models.CASCADE, related_name="settings"
    )
    fps = models.PositiveIntegerField(
        default=15, validators=[MinValueValidator(1)], verbose_name="FPS"
    )
    monitoring_start_time = models.TimeField(
        null=True, blank=True, verbose_name="Início do Monitoramento"
    )
    monitoring_end_time = models.TimeField(
        null=True, blank=True, verbose_name="Término do Monitoramento"
    )
    alert_cooldown = models.PositiveIntegerField(
        default=5,
        validators=[MinValueValidator(3)],
        verbose_name="Tempo de espera (segundos)",
    )
    detect_every = models.PositiveIntegerField(
        default=3,
        validators=[MinValueValidator(3)],
        verbose_name="Número de frames a detectar",
    )
    allow_draw = models.BooleanField(
        default=True, verbose_name="Permitir desenho"
    )

    def __str__(self):
        return f"Configurações de {self.user.get_full_name()}"

    class Meta:
        verbose_name = "Configuração"
        verbose_name_plural = "Configurações"

    @staticmethod
    def is_valid_time(value: str):
        try:
            strptime(value, "%H:%M:%S")
            return True
        except:  # NOQA
            return False
