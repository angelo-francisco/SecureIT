from tortoise.expressions import Q

from apps.notifications.models import Notification
from apps.audit.service import log_action
from core.exceptions import NotFound


async def list_notifications(
    profile_id: str,
    filter_type: str = "A",
    page: int = 1,
    per_page: int = 5,
) -> tuple[list[Notification], int]:
    query = Notification.filter(profile_id=profile_id, deleted=False)

    match filter_type:
        case "NR":
            query = query.filter(readed=False)
        case "R":
            query = query.filter(readed=True)

    total = await query.count()
    offset = (page - 1) * per_page
    notifications = await query.order_by("-created_at").offset(offset).limit(per_page).prefetch_related("camera")
    return notifications, total


async def delete_notification(notification_id: int, profile_id: str):
    notification = await Notification.get_or_none(id=notification_id, profile_id=profile_id)
    if not notification:
        raise NotFound("Notificação não encontrada")
    notification.deleted = True
    await notification.save()
    await log_action("delete", "notification", notification_id, profile_id)


async def get_unread_count(profile_id: str) -> int:
    return await Notification.filter(profile_id=profile_id, readed=False, deleted=False).count()
