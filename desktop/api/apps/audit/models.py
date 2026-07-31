from tortoise import fields, models


class AuditLog(models.Model):
    id = fields.IntField(primary_key=True)
    profile_id = fields.CharField(max_length=255, null=True, db_index=True)
    action = fields.CharField(max_length=10)
    entity_type = fields.CharField(max_length=30, db_index=True)
    entity_id = fields.CharField(max_length=255)
    synced = fields.BooleanField(default=False)
    created_at = fields.DatetimeField(auto_now_add=True)

    class Meta:
        table = "audit_logs"
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"AuditLog({self.action} {self.entity_type}:{self.entity_id})"
