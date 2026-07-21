from tortoise import fields, models


class Profile(models.Model):
    profile_id = fields.CharField(max_length=255, pk=True)
    user_id = fields.CharField(max_length=255, index=True)
    isAdmin = fields.BooleanField(default=False)
    created_at = fields.DatetimeField(auto_now_add=True)

    class Meta:
        table = "profiles"
