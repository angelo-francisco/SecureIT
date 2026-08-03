from tortoise import fields, models


class FaceDetection(models.Model):
    id = fields.IntField(primary_key=True)
    profile = fields.ForeignKeyField("models.Profile", related_name="face_detections")
    person_id = fields.IntField(null=True)
    name = fields.CharField(max_length=255, null=True)
    unknown = fields.BooleanField(default=True)
    confidence = fields.FloatField(default=0.0)
    camera = fields.ForeignKeyField(
        "models.Camera", related_name="face_detections", null=True
    )
    camera_name = fields.CharField(max_length=255, null=True)
    photo = fields.CharField(max_length=255, null=True)
    created_at = fields.DatetimeField(auto_now_add=True)

    class Meta:
        table = "face_detections"

    def __str__(self) -> str:
        return f"FaceDetection({self.id}, person={self.name or 'unknown'})"
