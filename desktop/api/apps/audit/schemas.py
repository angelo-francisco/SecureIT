from datetime import datetime
from pydantic import BaseModel


class AuditLogResponse(BaseModel):
    id: int
    profile_id: str | None
    action: str
    entity_type: str
    entity_id: str
    synced: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class AuditLogListResponse(BaseModel):
    results: list[AuditLogResponse]
    has_next: bool
    has_previous: bool
    number: int
    num_pages: int


class MarkSyncedRequest(BaseModel):
    ids: list[int]
