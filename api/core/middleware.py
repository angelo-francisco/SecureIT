from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse

from apps.auth.models import User
from core.security import decode_access_token


class AnonymousUser:
    is_authenticated = False
    id = None

    def check_pin(self, pin: str) -> bool:
        return False


def authentication_not_required(func):
    setattr(func, "_auth_not_required", True)
    return func


class AuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        user: User | AnonymousUser = AnonymousUser()

        pin_token = request.headers.get("X-Pin-Token")
        if pin_token:
            payload = decode_access_token(pin_token)
            if payload and payload.get("type") == "pin" and payload.get("sub"):
                try:
                    db_user = await User.get_or_none(id=int(payload["sub"]))
                    if db_user:
                        user = db_user
                except (ValueError, TypeError):
                    pass

        request.state.user = user

        endpoint = request.scope.get("endpoint")
        auth_not_required = getattr(endpoint, "_auth_not_required", False) if endpoint else True

        if not auth_not_required and not user.is_authenticated:
            return JSONResponse(
                status_code=401,
                content={"detail": "PIN não verificado"},
            )

        response = await call_next(request)
        return response
