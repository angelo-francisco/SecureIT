import logging

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse

from apps.auth.models import User
from core.security import decode_access_token

logger = logging.getLogger("auth.middleware")

PUBLIC_PREFIXES = {"/api/auth/", "/media/", "/ws/", "/api/health"}


class AuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        user: User | None = None
        path = request.url.path

        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header.removeprefix("Bearer ")
            payload = decode_access_token(token)
            if payload and payload.get("sub"):
                try:
                    user_id = int(payload["sub"])
                    user = await User.get_or_none(id=user_id)
                except (ValueError, TypeError):
                    pass

        request.state.user = user

        authed = user is not None
        is_public = any(path.startswith(p) for p in PUBLIC_PREFIXES)
        
        if not authed and not is_public:
            return JSONResponse(
                status_code=401,
                content={"detail": "USER_IS_NOT_AUTHENTICATED"},
            )

        response = await call_next(request)
        return response
