from fastapi import APIRouter, Query, Request

from apps.audit.schemas import AuditLogListResponse, MarkSyncedRequest
from apps.audit.service import list_audit_logs, mark_as_synced

router = APIRouter(prefix="/audit", tags=["audit"])


@router.get("/logs", response_model=AuditLogListResponse)
async def list_logs_endpoint(
    request: Request,
    action: str | None = Query(None),
    entity_type: str | None = Query(None),
    page: int = Query(1, ge=1),
):
    return await list_audit_logs(
        profile_id=request.state.profile.profile_id,
        action=action,
        entity_type=entity_type,
        page=page,
    )


@router.post("/logs/synced", status_code=200)
async def mark_synced_endpoint(data: MarkSyncedRequest):
    await mark_as_synced(data.ids)
    return {"message": "marked"}
