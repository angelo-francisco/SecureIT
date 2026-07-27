from platform import system

from tortoise import fields, models

from enum import StrEnum

VIDEO_EXTENSIONS = (".mp4", ".avi", ".mov", ".mkv", ".flv", ".wmv", ".webm")


def _is_video_file(path: str) -> bool:
    return any(path.lower().endswith(ext) for ext in VIDEO_EXTENSIONS)


class CameraType(StrEnum):
    LOCAL = "L"
    WIFI = "W"


class CameraTask(StrEnum):
    DETECTION = "D"
    FACE_RECOGNITION = "FR"
    BEHAVIOUR_ANALYSIS = "BA"


class Camera(models.Model):
    id = fields.IntField(pk=True)
    profile = fields.ForeignKeyField("models.Profile", related_name="cameras")
    name = fields.CharField(max_length=30, null=True)
    location = fields.CharField(max_length=150, null=True)
    status = fields.BooleanField(default=True, null=True)
    connection_type = fields.CharEnumField(CameraType, max_length=1, null=True)
    connection_info = fields.JSONField(default=dict, null=True)
    task = fields.CharEnumField(CameraTask, max_length=2, default=CameraTask.DETECTION, null=True)
    face_recognition = fields.BooleanField(default=False)
    created_at = fields.DatetimeField(auto_now_add=True)
    updated_at = fields.DatetimeField(auto_now=True)

    class Meta:  # type: ignore
        table = "cameras"

    class PydanticMeta:
        exclude = ["user"]
        computed = ["get_name", "video_source"]

    def get_name(self) -> str:
        return f"CAM-{self.id}"

    def video_source(self) -> str | int | None:
        if not self.connection_info:
            return None
        if self.connection_type == "W":
            return self.connection_info.get("stream_url")
        if self.connection_type == "L":
            path = self.connection_info.get("path", "")
            if _is_video_file(path):
                return path
            if system() == "Linux":
                return path.split("video")[-1] if "video" in path else path
            return self.connection_info.get("id", path)
        return None

    def effective_task(self) -> str:
        if self.task and self.task != CameraTask.DETECTION:
            return self.task
        if self.face_recognition:
            return CameraTask.FACE_RECOGNITION
        return CameraTask.DETECTION

    def __str__(self) -> str:
        return self.get_name()
