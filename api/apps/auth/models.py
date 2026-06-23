from tortoise import fields, models

from core.security import hash_password, verify_password


class User(models.Model):
    id = fields.IntField(pk=True)
    email = fields.CharField(max_length=255, unique=True, index=True)
    hashed_password = fields.CharField(max_length=255)
    first_name = fields.CharField(max_length=30)
    last_name = fields.CharField(max_length=30)
    phone = fields.CharField(max_length=30, null=True)
    pin = fields.CharField(max_length=128, null=True)
    is_active = fields.BooleanField(default=True)
    created_at = fields.DatetimeField(auto_now_add=True)

    class Meta:
        table = "users"

    def set_password(self, password: str):
        self.hashed_password = hash_password(password)

    def check_password(self, password: str) -> bool:
        return verify_password(password, self.hashed_password)

    def set_pin(self, raw_pin: str):
        self.pin = hash_password(raw_pin)

    def check_pin(self, raw_pin: str) -> bool:
        if not self.pin:
            return False
        return verify_password(raw_pin, self.pin)

    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}"

    def __str__(self) -> str:
        return self.email
