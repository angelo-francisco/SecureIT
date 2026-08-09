from datetime import datetime
from pydantic import BaseModel


class NotificationResponse(BaseModel):
    id: int
    profile_id: str
    title: str
    description: str
    level: str
    deleted: bool
    camera_id: int | None
    person_id: int | None
    photo: str | None
    created_at: datetime

    model_config = {"from_attributes": True}
