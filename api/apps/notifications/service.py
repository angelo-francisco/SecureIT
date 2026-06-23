from tortoise.expressions import Q

from apps.notifications.models import Notification
from core.exceptions import NotFound


async def list_notifications(
    user_id: int,
    filter_type: str = "A",
    page: int = 1,
    per_page: int = 5,
) -> tuple[list[Notification], int]:
    query = Notification.filter(user_id=user_id, deleted=False)

    match filter_type:
        case "NR":
            query = query.filter(readed=False)
        case "R":
            query = query.filter(readed=True)

    total = await query.count()
    offset = (page - 1) * per_page
    notifications = await query.order_by("-created_at").offset(offset).limit(per_page).prefetch_related("camera")
    return notifications, total


async def delete_notification(notification_id: int, user_id: int):
    notification = await Notification.get_or_none(id=notification_id, user_id=user_id)
    if not notification:
        raise NotFound("Notificação não encontrada")
    notification.deleted = True
    await notification.save()


async def get_unread_count(user_id: int) -> int:
    return await Notification.filter(user_id=user_id, readed=False, deleted=False).count()
