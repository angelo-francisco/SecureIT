from platform import system

from tortoise import fields, models


class Camera(models.Model):
    id = fields.IntField(pk=True)
    user = fields.ForeignKeyField("models.User", related_name="cameras")
    name = fields.CharField(max_length=30, null=True)
    location = fields.CharField(max_length=150, null=True)
    status = fields.BooleanField(default=True, null=True)
    connection_type = fields.CharField(max_length=1, null=True)
    created_at = fields.DatetimeField(auto_now_add=True)
    updated_at = fields.DatetimeField(auto_now=True)

    class Meta:
        table = "cameras"

    @property
    def get_name(self) -> str:
        return f"CAM-{self.id}"

    @property
    async def video_source(self) -> str | int | None:
        if self.connection_type == "W":
            wifi = await self.wificamera
            if wifi:
                return wifi.stream_url
        if self.connection_type == "L":
            local = await self.localcamera
            if local:
                path = local.info.get("path", "")
                if system() == "Linux":
                    return path.split("video")[-1] if "video" in path else path
                return local.info.get("id", path)
        return None

    def __str__(self) -> str:
        return self.get_name


class LocalCamera(models.Model):
    id = fields.IntField(pk=True)
    camera = fields.OneToOneField("models.Camera", related_name="localcamera")
    info = fields.JSONField(default=dict, null=True)

    class Meta:
        table = "local_cameras"

    def __str__(self) -> str:
        return f"LocalCamera({self.camera_id})"


class WifiCamera(models.Model):
    id = fields.IntField(pk=True)
    camera = fields.OneToOneField("models.Camera", related_name="wificamera")
    stream_url = fields.CharField(max_length=255, null=True)

    class Meta:
        table = "wifi_cameras"

    def __str__(self) -> str:
        return f"WifiCamera({self.camera_id})"
