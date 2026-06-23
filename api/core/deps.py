from fastapi import Depends, Header

from apps.auth.models import User
from core.exceptions import Unauthorized
from core.security import decode_access_token


async def get_current_user(
    authorization: str = Header(None),
) -> User:
    if not authorization:
        raise Unauthorized("Token de acesso não fornecido")

    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise Unauthorized("Formato de token inválido")

    payload = decode_access_token(token)
    if payload is None:
        raise Unauthorized("Token inválido ou expirado")

    user_id = payload.get("sub")
    if not user_id:
        raise Unauthorized("Token inválido")

    user = await User.get_or_none(id=int(user_id))
    if not user:
        raise Unauthorized("Utilizador não encontrado")

    return user


async def verify_pin(
    x_pin_token: str | None = Header(None, alias="X-Pin-Token"),
    current_user: User = Depends(get_current_user),
) -> User:
    if not x_pin_token:
        raise Unauthorized("PIN não verificado")

    payload = decode_access_token(x_pin_token)
    if payload is None or payload.get("type") != "pin" or payload.get("sub") != str(current_user.id):
        raise Unauthorized("PIN inválido ou expirado")

    return current_user
