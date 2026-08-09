from tortoise import fields, models


class Notification(models.Model):
    id = fields.IntField(primary_key=True)
    profile = fields.ForeignKeyField("models.Profile", related_name="notifications")
    title = fields.CharField(max_length=50)
    description = fields.TextField()
    level = fields.CharField(max_length=1)
    deleted = fields.BooleanField(default=False)
    camera = fields.ForeignKeyField(
        "models.Camera", related_name="notifications", null=True
    )
    person = fields.ForeignKeyField(
        "models.Person", related_name="notifications", null=True
    )
    photo = fields.CharField(max_length=255, null=True)
    created_at = fields.DatetimeField(auto_now_add=True)

    class Meta:
        table = "notifications"

    def __str__(self) -> str:
        return f"Notification({self.id})"
