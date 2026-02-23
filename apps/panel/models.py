from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator
from django.db import models


class Configuration(models.Model):
    user = models.OneToOneField(
        get_user_model(), on_delete=models.CASCADE, related_name="settings"
    )
    fps = models.PositiveIntegerField(default=15, validators=[MinValueValidator(1)])  # type: ignore
    monitoring_start_time = models.TimeField(null=True, blank=True)
    monitoring_end_time = models.TimeField(null=True, blank=True)
