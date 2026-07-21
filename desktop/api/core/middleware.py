from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse

from apps.control.models import Profile


class ControlMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        profile_id = request.headers.get("PID", "")
        user_id = request.headers.get("UID", "")

        if profile_id and user_id:
            request.state.profile = await Profile.get_or_none(user_id=user_id, profile_id=profile_id)

        """else:
            return JSONResponse(
                status_code=401,
                content={"detail": "WHO ARE YOU?"},
            )"""

        response = await call_next(request)
        return response

