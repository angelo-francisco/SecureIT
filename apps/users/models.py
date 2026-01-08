from django.db import models

from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.contrib.auth.hashers import make_password, check_password


class UserManager(BaseUserManager):
    use_in_migrations = True

    def create_user(self, phone, pin=None, **extra_fields):
        if not phone:
            raise ValueError('O telefone é obrigatório')

        user = self.model(phone=phone, **extra_fields)

        if pin:
            user.set_pin(pin)

        # Desativa password tradicional do Django
        user.set_password(None)

        user.save(using=self._db)
        return user

    def create_superuser(self, phone, pin=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)

        return self.create_user(phone, pin, **extra_fields)


class User(AbstractUser):
    username = None  # Remove username padrão
    phone = models.CharField(max_length=20, unique=True)
    pin = models.CharField(max_length=128)

    USERNAME_FIELD = 'phone'
    REQUIRED_FIELDS = []

    objects = UserManager()

    def set_pin(self, raw_pin):
        self.pin = make_password(raw_pin)

    def check_pin(self, raw_pin):
        return check_password(raw_pin, self.pin)

    def __str__(self):
        return self.phone
