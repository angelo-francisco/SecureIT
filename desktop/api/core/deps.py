import logging

from apps.control.models import Profile
from fastapi import HTTPException, Request

from core.context import current_profile_id

logger = logging.getLogger(__name__)


async def require_profile(request: Request) -> Profile:
    profile_id = request.headers.get("PID", "")
    user_id = request.headers.get("UID", "")

    if not profile_id or not user_id:
        current_profile_id.set(None)
        raise HTTPException(
            status_code=401,
            detail="Perfil não encontrado",
        )

    profile = await Profile.get_or_none(
        profile_id=profile_id,
        user_id=user_id,
    )

    if not profile:
        current_profile_id.set(None)
        raise HTTPException(
            status_code=401,
            detail="Perfil não encontrado",
        )

    # Starlette runs each request in its own task context, so the value set
    # here persists for the rest of the request (e.g. audit log_action).
    current_profile_id.set(profile.profile_id)
    return profile
