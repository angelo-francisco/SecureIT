from fastapi import APIRouter, Query, Request, Depends

from apps.notifications.schemas import NotificationResponse
from apps.notifications.service import (
    delete_notification,
    get_unread_count,
    list_notifications,
)

from core.deps import require_profile, Profile

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("")
async def list_notifications_endpoint(
    profile: Profile = Depends(require_profile),
    filter: str = Query("A", alias="search-query"),
    page: int = Query(1, ge=1),
    per_page: int = Query(5, ge=1, le=100),
):
    notifications, total = await list_notifications(
        profile.profile_id, filter, page, per_page
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
    notification_id: int,
    profile: Profile = Depends(require_profile),
):
    await delete_notification(notification_id, profile.profile_id)


@router.get("/unread-count")
async def unread_count(
    profile: Profile = Depends(require_profile),
):
    count = await get_unread_count(profile.profile_id)
    return {"count": count}
