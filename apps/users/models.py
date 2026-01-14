from django.db import models

from django.contrib.auth.models import AbstractUser
from django.contrib.auth.hashers import make_password, check_password


class User(AbstractUser):
    username = None
    email = models.EmailField(unique=True)
    pin = models.CharField(max_length=4)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    def set_pin(self, raw_pin):
        self.pin = make_password(raw_pin)

    def check_pin(self, raw_pin):
        return check_password(raw_pin, self.pin)
