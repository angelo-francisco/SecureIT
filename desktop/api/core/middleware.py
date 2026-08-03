from apps.control.models import Profile
from core.context import current_profile_id
from fastapi import Request


async def control_middleware(request: Request, call_next):
    profile_id = request.headers.get("PID", "")
    user_id = request.headers.get("UID", "")

    token = current_profile_id.set(None)

    try:
        if profile_id and user_id:
            request.state.profile = await Profile.get_or_none(
                user_id=user_id,
                profile_id=profile_id,
            )

            if request.state.profile:
                current_profile_id.set(profile_id)

        return await call_next(request)

    finally:
        current_profile_id.reset(token)
