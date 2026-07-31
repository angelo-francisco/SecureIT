from tortoise import fields, models


class Configuration(models.Model):
    id = fields.IntField(primary_key=True)
    profile = fields.OneToOneField("models.Profile", related_name="settings")
    fps = fields.IntField(default=15)
    monitoring_start_time = fields.CharField(max_length=8, null=True)
    monitoring_end_time = fields.CharField(max_length=8, null=True)
    alert_cooldown = fields.IntField(default=5)
    detect_every = fields.IntField(default=3)
    allow_draw = fields.BooleanField(default=True)

    class Meta:
        table = "configurations"

    @staticmethod
    def is_valid_time(value: str) -> bool:
        from time import strptime
        try:
            strptime(value, "%H:%M:%S")
            return True
        except ValueError:
            return False

    def __str__(self) -> str:
        return f"Configuration({self.user_id})"
