import logging
import uuid
from pathlib import Path

from apps.face_detection.models import FaceDetection
from core.config import settings

logger = logging.getLogger(__name__)


async def list_face_detections(
    user_id: int,
    page: int = 1,
    per_page: int = 20,
    known_only: bool = False,
):
    qs = FaceDetection.filter(user_id=user_id).order_by("-created_at")
    if known_only:
        qs = qs.filter(unknown=False)
    total = await qs.count()
    detections = await qs.offset((page - 1) * per_page).limit(per_page)
    return detections, total


async def save_face_detection(
    user_id: int,
    person_id: int | None,
    name: str | None,
    unknown: bool,
    confidence: float,
    camera_id: int | None,
    camera_name: str | None,
    frame_bytes: bytes | None = None,
):
    photo_path = None
    if frame_bytes:
        filename = f"{uuid.uuid4()}.jpg"
        dir_path = Path(settings.MEDIA_ROOT) / "face_detections"
        dir_path.mkdir(parents=True, exist_ok=True)
        (dir_path / filename).write_bytes(frame_bytes)
        photo_path = f"face_detections/{filename}"

    await FaceDetection.create(
        user_id=user_id,
        person_id=person_id,
        name=name,
        unknown=unknown,
        confidence=confidence,
        camera_id=camera_id,
        camera_name=camera_name,
        photo=photo_path,
    )
