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
    )  # type: ignore
    monitoring_start_time = models.TimeField(
        null=True, blank=True, verbose_name="Início do Monitoramento"
    )
    monitoring_end_time = models.TimeField(
        null=True, blank=True, verbose_name="Término do Monitoramento"
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
        except: # NOQA
            return False
