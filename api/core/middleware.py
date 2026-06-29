import logging

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse

from apps.auth.models import User
from core.security import decode_access_token

logger = logging.getLogger("auth.middleware")

PUBLIC_ENDPOINTS = {
    "/api/auth/signup",
    "/api/auth/login",
    "/api/auth/pin-login",
    "/api/auth/re-auth",
    "/api/auth/accounts",
    "/media/people_photos/"
    "/api/health",
}


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
                    user = await User.get_or_none(id=int(payload["sub"]))
                except (ValueError, TypeError):
                    pass

        request.state.user = user

        authed = user is not None
        is_public = path in PUBLIC_ENDPOINTS or path.startswith('/media/')
        
        if not authed and not is_public:
            return JSONResponse(
                status_code=401,
                content={"detail": "USER_IS_NOT_AUTHENTICATED"},
            )

        response = await call_next(request)
        return response
