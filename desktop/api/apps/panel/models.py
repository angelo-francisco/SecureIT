from tortoise import fields, models


class Configuration(models.Model):
    id = fields.IntField(primary_key=True)
    profile = fields.OneToOneField("models.Profile", related_name="settings")
    fps = fields.IntField(default=15)
    monitoring_start_time = fields.CharField(max_length=8, null=True, default="18:00")
    monitoring_end_time = fields.CharField(max_length=8, null=True, default="07:00")
    alert_cooldown = fields.IntField(default=5)
    detect_every = fields.IntField(default=3)
    allow_draw = fields.BooleanField(default=True)

    class Meta:
        table = "configurations"

    @staticmethod
    def is_valid_time(value: str) -> bool:
        from time import strptime

        if not isinstance(value, str):
            return False
        for fmt in ("%H:%M", "%H:%M:%S"):
            try:
                strptime(value, fmt)
                return True
            except ValueError:
                continue
        return False

    @staticmethod
    def normalize_time(value: str) -> str | None:
        """Normalize ``HH:MM[:SS]`` to ``HH:MM`` or None when invalid."""
        from datetime import datetime

        if not isinstance(value, str):
            return None
        for fmt in ("%H:%M", "%H:%M:%S"):
            try:
                return datetime.strptime(value, fmt).strftime("%H:%M")
            except ValueError:
                continue
        return None

    def __str__(self) -> str:
        return f"Configuration({self.user_id})"
