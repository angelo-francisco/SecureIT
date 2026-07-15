import logging

from apps.cameras.models import Camera
from apps.notifications.models import Notification
from apps.panel.models import Configuration
from core.config import settings
from core.security import decode_access_token
from services.camera import CameraService

logger = logging.getLogger(__name__)


async def authenticate(token: str | None) -> int | None:
    if not token:
        logger.warning("[auth] token is None")
        return None
    payload = decode_access_token(token)
    if payload is None:
        logger.warning("[auth] token decode failed")
        return None
    user_id = int(payload.get("sub", 0))
    if user_id <= 0:
        logger.warning("[auth] invalid user_id=%s", user_id)
        return None
    logger.info("[auth] authenticated user_id=%s", user_id)
    return user_id


async def load_user_config(user_id: int) -> dict:
    conf = await Configuration.get_or_none(user_id=user_id)
    if not conf:
        return {}
    return {
        "fps": conf.fps,
        "alert_cooldown": conf.alert_cooldown,
        "detect_every": conf.detect_every,
        "allow_draw": conf.allow_draw,
        "monitoring_start_time": conf.monitoring_start_time,
        "monitoring_end_time": conf.monitoring_end_time,
    }


async def get_user_camera(camera_id: int, user_id: int):
    return await Camera.get_or_none(id=camera_id, user_id=user_id)


async def set_camera_status(camera, status: bool):
    if camera is None:
        return
    cam = await Camera.get_or_none(id=camera.id)
    if cam and cam.status != status:
        cam.status = status
        await cam.save()


async def create_notification(user_id: int, camera_id: int, title: str, description: str, level: str, frame: bytes):
    import uuid
    from pathlib import Path

    filename = f"{uuid.uuid4()}.jpg"
    path = Path(settings.MEDIA_ROOT) / "notifications_frames"
    path.mkdir(parents=True, exist_ok=True)
    (path / filename).write_bytes(frame)

    await Notification.create(
        user_id=user_id,
        title=title,
        description=description,
        level=level,
        photo=f"notifications_frames/{filename}",
        camera_id=camera_id,
    )


def create_camera_service(video_source, fps=15, allow_draw=True):
    return CameraService(video_source, fps=fps, allow_draw=allow_draw)
