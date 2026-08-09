import logging

from apps.notifications.models import Notification
from apps.audit.service import log_action
from core.config import settings
from core.exceptions import NotFound

logger = logging.getLogger(__name__)


async def list_notifications(
    profile_id: str,
    page: int = 1,
    per_page: int = 5,
) -> tuple[list[Notification], int]:
    query = Notification.filter(profile_id=profile_id, deleted=False)

    total = await query.count()
    offset = (page - 1) * per_page
    notifications = (
        await query.order_by("-created_at")
        .offset(offset)
        .limit(per_page)
        .prefetch_related("camera")
    )
    return notifications, total


async def delete_notification(notification_id: int, profile_id: str):
    notification = await Notification.get_or_none(
        id=notification_id, profile_id=profile_id
    )
    if not notification:
        raise NotFound("Notificação não encontrada")
    notification.deleted = True
    await notification.save()
    await log_action("delete", "notification", notification_id, profile_id)


async def cleanup_orphan_photos() -> None:
    """Remove stored notification images that are not valid JPEGs.

    Older versions wrote raw numpy buffers to disk (broken files that show as
    a missing image in the UI). Anything that is not a real JPEG is deleted and
    the notification ``photo`` reference is nulled so the UI hides the link.
    """
    from pathlib import Path

    frames_dir = Path(settings.MEDIA_ROOT) / "notifications_frames"
    if not frames_dir.is_dir():
        return

    removed: list[str] = []
    for f in frames_dir.iterdir():
        if not f.is_file() or f.suffix.lower() != ".jpg":
            continue
        try:
            header = f.open("rb").read(2)
        except OSError:
            continue
        if header != b"\xff\xd8":
            removed.append(f.name)
            try:
                f.unlink()
            except OSError:
                logger.warning("could not delete broken image %s", f.name)

    if removed:
        refs = [f"notifications_frames/{name}" for name in removed]
        await Notification.filter(photo__in=refs).update(photo=None)
        logger.info("cleaned %d broken notification images", len(removed))
