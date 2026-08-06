import asyncio
import logging
from asyncio import CancelledError

from fastapi import WebSocket, WebSocketDisconnect

from apps.control.models import Profile
from apps.cameras.models import Camera
from apps.license.models import License
from apps.notifications.models import Notification
from apps.panel.models import Configuration
from core.config import settings
from services.camera import CameraService

logger = logging.getLogger(__name__)

FEATURE_VARIANTS: dict[str, list[str]] = {
    "face_recognition": ["face_recognition"],
    "analise_comportamental": ["analise_comportamental", "anlise_comportamental"],
}


async def check_license_feature(profile_id: str, *feature_slugs: str) -> bool:
    profile = await Profile.get_or_none(profile_id=profile_id)
    if not profile:
        return False
    license_obj = await License.filter(user_id=profile.user_id, status="ACTIVE").first()
    if not license_obj:
        return False
    stored_features = license_obj.features or []
    for slug in feature_slugs:
        variants = FEATURE_VARIANTS.get(slug, [slug])
        if any(v in stored_features for v in variants):
            return True
    return False


async def authenticate(profile_id: str | None) -> str | None:
    if not profile_id:
        return None
    profile = await Profile.get_or_none(profile_id=profile_id)
    if not profile:
        return None
    return profile.profile_id


async def load_user_config(profile_id: str) -> dict:
    conf = await Configuration.get_or_none(profile_id=profile_id)
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


async def get_user_camera(camera_id: int, profile_id: str):
    return await Camera.get_or_none(id=camera_id, profile_id=profile_id)


async def set_camera_status(camera, status: bool):
    if camera is None:
        return
    cam = await Camera.get_or_none(id=camera.id)
    if cam and cam.status != status:
        cam.status = status
        await cam.save()


async def create_notification(
    profile_id: str,
    camera_id: int,
    title: str,
    description: str,
    level: str,
    frame: bytes,
):
    import uuid
    from pathlib import Path

    filename = f"{uuid.uuid4()}.jpg"
    path = Path(settings.MEDIA_ROOT) / "notifications_frames"
    path.mkdir(parents=True, exist_ok=True)
    (path / filename).write_bytes(frame)

    await Notification.create(
        profile_id=profile_id,
        title=title,
        description=description,
        level=level,
        photo=f"notifications_frames/{filename}",
        camera_id=camera_id,
    )


def create_camera_service(video_source, fps=15, allow_draw=True):
    return CameraService(video_source, fps=fps, allow_draw=allow_draw)


async def websocket_watchdog(
    websocket: WebSocket,
    stop: asyncio.Event,
    on_disconnect,
    interval: float = 15.0,
):
    try:
        while not stop.is_set():
            try:
                msg = await asyncio.wait_for(
                    websocket.receive(), timeout=interval
                )
            except asyncio.TimeoutError:
                try:
                    await websocket.send({"type": "websocket.ping"})
                except Exception:
                    break
                continue
            if msg.get("type") == "websocket.disconnect":
                break
    except (CancelledError, WebSocketDisconnect, RuntimeError):
        pass
    if not stop.is_set():
        stop.set()
        await on_disconnect()
