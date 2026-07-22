from core.context import current_profile_id
from apps.audit.models import AuditLog


async def log_action(
    action: str,
    entity_type: str,
    entity_id: str | int,
    profile_id: str | None = None,
):
    pid = profile_id or current_profile_id.get()
    await AuditLog.create(
        profile_id=pid,
        action=action,
        entity_type=entity_type,
        entity_id=str(entity_id),
    )


async def list_audit_logs(
    profile_id: str,
    action: str | None = None,
    entity_type: str | None = None,
    page: int = 1,
    per_page: int = 20,
) -> dict:
    query = AuditLog.filter(profile_id=profile_id)
    if action:
        query = query.filter(action=action)
    if entity_type:
        query = query.filter(entity_type=entity_type)

    total = await query.count()
    offset = (page - 1) * per_page
    logs = await query.order_by("-created_at").offset(offset).limit(per_page)

    return {
        "results": logs,
        "has_next": total > page * per_page,
        "has_previous": page > 1,
        "number": page,
        "num_pages": (total + per_page - 1) // per_page,
    }


async def get_unsynced_logs() -> list[AuditLog]:
    return await AuditLog.filter(synced=False).order_by("created_at")


async def mark_as_synced(log_ids: list[int]):
    await AuditLog.filter(id__in=log_ids).update(synced=True)
