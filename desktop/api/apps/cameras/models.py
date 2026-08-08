import logging
from enum import StrEnum
from platform import system

from tortoise import fields, models

from apps.cameras.device_cache import resolve_windows_device_id
from apps.cameras.paths import resolve_video_path

logger = logging.getLogger(__name__)

VIDEO_EXTENSIONS = (".mp4", ".avi", ".mov", ".mkv", ".flv", ".wmv", ".webm")


def _is_video_file(path: str) -> bool:
    return any(path.lower().endswith(ext) for ext in VIDEO_EXTENSIONS)


def _camera_device_id(raw) -> int | None:
    """Coerce a camera device identifier to an int without raising.

    The frontend may store ``id`` as an int, a digit string, or omit it
    entirely (e.g. demo cameras saved with only a ``path``). Return None when
    there is no usable id instead of crashing serialization/websockets.
    """
    if isinstance(raw, bool) or raw is None:
        return None
    if isinstance(raw, int):
        return raw if raw >= 0 else None
    if isinstance(raw, str) and raw.strip().isdigit():
        return int(raw.strip())
    return None


class CameraType(StrEnum):
    LOCAL = "L"
    WIFI = "W"


class CameraTask(StrEnum):
    DETECTION = "D"
    FACE_RECOGNITION = "FR"
    BEHAVIOUR_ANALYSIS = "BA"


class Camera(models.Model):
    id = fields.IntField(primary_key=True)
    profile = fields.ForeignKeyField("models.Profile", related_name="cameras")
    name = fields.CharField(max_length=30, null=True)
    location = fields.CharField(max_length=150, null=True)
    status = fields.BooleanField(default=True, null=True)
    connection_type = fields.CharEnumField(CameraType, max_length=1, null=True)
    connection_info = fields.JSONField(default=dict, null=True)
    task = fields.CharEnumField(
        CameraTask, max_length=2, default=CameraTask.DETECTION, null=True
    )
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
                return resolve_video_path(path)
            if system() == "Linux" and path:
                return path
            if system() == "Windows":
                resolved = resolve_windows_device_id(path)
                if resolved is not None:
                    return resolved
            return _camera_device_id(self.connection_info.get("id"))
        return None

    def effective_task(self) -> str:
        if self.task and self.task != CameraTask.DETECTION:
            return self.task
        if self.face_recognition:
            return CameraTask.FACE_RECOGNITION
        return CameraTask.DETECTION

    def __str__(self) -> str:
        return self.get_name()
