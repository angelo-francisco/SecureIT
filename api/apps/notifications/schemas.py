from datetime import datetime
from pydantic import BaseModel


class NotificationResponse(BaseModel):
    id: int
    user_id: int
    title: str
    description: str
    level: str
    deleted: bool
    camera_id: int | None
    readed: bool
    photo: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class NotificationListParams(BaseModel):
    filter: str = "A"  # A = All, NR = Unread, R = Read
    page: int = 1
