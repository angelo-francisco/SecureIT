from fastapi import APIRouter, Depends, Query

from apps.auth.models import User
from apps.notifications.schemas import NotificationResponse
from apps.notifications.service import (
    delete_notification,
    get_unread_count,
    list_notifications,
)
from core.deps import get_current_user, verify_pin

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("", response_model=list[NotificationResponse])
async def list_notifications_endpoint(
    filter: str = Query("A", alias="search-query"),
    page: int = Query(1, ge=1),
    current_user: User = Depends(verify_pin),
):
    notifications, _ = await list_notifications(current_user.id, filter, page)
    return [NotificationResponse.model_validate(n) for n in notifications]


@router.delete("/{notification_id}", status_code=204)
async def delete_notification_endpoint(
    notification_id: int,
    current_user: User = Depends(verify_pin),
):
    await delete_notification(notification_id, current_user.id)


@router.get("/unread-count")
async def unread_count(
    current_user: User = Depends(get_current_user),
):
    count = await get_unread_count(current_user.id)
    return {"count": count}
