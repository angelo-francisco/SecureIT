import logging

from apps.control.models import Profile
from fastapi import HTTPException, Request

from core.context import current_profile_id

logger = logging.Logger(__name__)


async def require_profile(request: Request) -> Profile:
    profile_id = request.headers.get("PID", "")
    user_id = request.headers.get("UID", "")
    token = current_profile_id.set(None)

    if not profile_id or not user_id:
        raise HTTPException(
            status_code=401,
            detail="Perfil não encontrado",
        )

    profile = await Profile.get_or_none(
        profile_id=profile_id,
        user_id=user_id,
    )

    if not profile:
        current_profile_id.reset(token)
        raise HTTPException(
            status_code=401,
            detail="Perfil não encontrado",
        )
    current_profile_id.set(profile.profile_id)
    current_profile_id.reset(token)
    return profile
