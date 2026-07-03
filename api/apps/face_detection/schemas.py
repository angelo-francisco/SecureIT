from datetime import datetime
from pydantic import BaseModel


class FaceDetectionResponse(BaseModel):
    id: int
    person_id: int | None
    name: str | None
    unknown: bool
    confidence: float
    camera_id: int | None
    camera_name: str | None
    photo: str | None
    created_at: datetime

    model_config = {"from_attributes": True}
