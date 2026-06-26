from fastapi import APIRouter, Query, Request

from apps.notifications.schemas import NotificationResponse
from apps.notifications.service import (
    delete_notification,
    get_unread_count,
    list_notifications,
)

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("", response_model=list[NotificationResponse])
async def list_notifications_endpoint(
    request: Request,
    filter: str = Query("A", alias="search-query"),
    page: int = Query(1, ge=1),
):
    notifications, _ = await list_notifications(request.state.user.id, filter, page)
    return [NotificationResponse.model_validate(n) for n in notifications]


@router.delete("/{notification_id}", status_code=204)
async def delete_notification_endpoint(
    request: Request,
    notification_id: int,
):
    await delete_notification(notification_id, request.state.user.id)


@router.get("/unread-count")
async def unread_count(
    request: Request,
):
    count = await get_unread_count(request.state.user.id)
    return {"count": count}
