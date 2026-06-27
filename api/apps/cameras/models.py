from platform import system

from tortoise import fields, models


class Camera(models.Model):
    id = fields.IntField(pk=True)
    user = fields.ForeignKeyField("models.User", related_name="cameras")
    name = fields.CharField(max_length=30, null=True)
    location = fields.CharField(max_length=150, null=True)
    status = fields.BooleanField(default=True, null=True)
    connection_type = fields.CharField(max_length=1, null=True)
    connection_info = fields.JSONField(default=dict, null=True)
    created_at = fields.DatetimeField(auto_now_add=True)
    updated_at = fields.DatetimeField(auto_now=True)

    class Meta:
        table = "cameras"

    @property
    def get_name(self) -> str:
        return f"CAM-{self.id}"

    @property
    async def video_source(self) -> str | int | None:
        if not self.connection_info:
            return None
        if self.connection_type == "W":
            return self.connection_info.get("stream_url")
        if self.connection_type == "L":
            path = self.connection_info.get("path", "")
            if system() == "Linux":
                return path.split("video")[-1] if "video" in path else path
            return self.connection_info.get("id", path)
        return None

    def __str__(self) -> str:
        return self.get_name
