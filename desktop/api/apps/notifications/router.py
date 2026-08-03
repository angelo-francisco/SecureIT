from fastapi import APIRouter, Query, Request

from apps.notifications.schemas import NotificationResponse
from apps.notifications.service import (
    delete_notification,
    get_unread_count,
    list_notifications,
)

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("")
async def list_notifications_endpoint(
    request: Request,
    filter: str = Query("A", alias="search-query"),
    page: int = Query(1, ge=1),
    per_page: int = Query(5, ge=1, le=100),
):
    notifications, total = await list_notifications(
        request.state.profile.profile_id, filter, page, per_page
    )
    return {
        "results": [NotificationResponse.model_validate(n) for n in notifications],
        "has_next": total > page * per_page,
        "has_previous": page > 1,
        "number": page,
        "num_pages": (total + per_page - 1) // per_page,
    }


@router.delete("/{notification_id}", status_code=204)
async def delete_notification_endpoint(
    request: Request,
    notification_id: int,
):
    await delete_notification(notification_id, request.state.profile.profile_id)


@router.get("/unread-count")
async def unread_count(
    request: Request,
):
    count = await get_unread_count(request.state.profile.profile_id)
    return {"count": count}
