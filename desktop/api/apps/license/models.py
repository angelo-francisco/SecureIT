from tortoise import fields, models


class License(models.Model):
    id = fields.UUIDField(primary_key=True)
    license_id = fields.CharField(max_length=255, unique=True)
    user_id = fields.CharField(max_length=255, db_index=True)
    license_key = fields.CharField(max_length=30)
    license_type = fields.CharField(max_length=20)
    activated_at = fields.DatetimeField()
    expires_at = fields.DatetimeField()
    last_validated_at = fields.DatetimeField(null=True)
    hardware_fingerprint = fields.CharField(max_length=255)
    signed_payload = fields.TextField()
    public_key = fields.TextField()
    signature = fields.TextField()
    max_cameras = fields.IntField(default=-1)
    max_people = fields.IntField(default=-1)
    features = fields.JSONField(default=list)
    status = fields.CharField(max_length=20, default="ACTIVE")
    created_at = fields.DatetimeField(auto_now_add=True)

    class Meta:
        table = "licenses"
