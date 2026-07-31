from tortoise import fields, models


class Profile(models.Model):
    profile_id = fields.CharField(max_length=255, primary_key=True)
    user_id = fields.CharField(max_length=255, db_index=True)
    isAdmin = fields.BooleanField(default=False)
    created_at = fields.DatetimeField(auto_now_add=True)

    class Meta:
        table = "profiles"
