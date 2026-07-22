from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse

from apps.control.models import Profile
from core.context import current_profile_id


class ControlMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        profile_id = request.headers.get("PID", "")
        user_id = request.headers.get("UID", "")

        token = current_profile_id.set(None)
        if profile_id and user_id:
            request.state.profile = await Profile.get_or_none(user_id=user_id, profile_id=profile_id)
            if request.state.profile:
                current_profile_id.set(profile_id)

        """else:
            return JSONResponse(
                status_code=401,
                content={"detail": "WHO ARE YOU?"},
            )"""

        try:
            response = await call_next(request)
            return response
        finally:
            current_profile_id.reset(token)
