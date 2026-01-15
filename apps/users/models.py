from django.db import models
from django.contrib.auth.models import AbstractUser
from django.contrib.auth.hashers import make_password, check_password


class User(AbstractUser):
    username = None
    email = models.EmailField(unique=True)
    pin = models.CharField(max_length=4)

from django.contrib.auth.models import AbstractUser, BaseUserManager


class UserManager(BaseUserManager):
    use_in_migrations = True

    def create_user(self, phone, pin=None, **extra_fields):
        if not phone:
            raise ValueError('O telefone é obrigatório')

        user = self.model(phone=phone, **extra_fields)

        if pin:
            user.set_password(pin)  # PIN é tratado como password

        user.save(using=self._db)
        return user

    def create_superuser(self, phone, pin, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)

        if not pin:
            raise ValueError('Superuser precisa de PIN')

        return self.create_user(phone, pin, **extra_fields)


class User(AbstractUser):
    username = None
    phone = models.CharField(max_length=20, unique=True)
    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []


    def set_pin(self, raw_pin):
        self.pin = make_password(raw_pin)

    def check_pin(self, raw_pin):
        return check_password(raw_pin, self.pin)

    objects = UserManager()

    def __str__(self):
        return self.phone

