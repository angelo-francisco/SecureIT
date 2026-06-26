from core.exceptions import Unauthorized
from core.middleware import authentication_not_required
from fastapi import APIRouter, Request

from apps.auth.models import User
from apps.auth.schemas import (
    AccountResponse,
    LoginRequest,
    PinLoginRequest,
    PinLoginTokenResponse,
    PinRequest,
    PinTokenResponse,
    SignupRequest,
    TokenResponse,
    UserResponse,
)
from apps.auth.service import (
    authenticate_user,
    authenticate_with_pin,
    create_user,
    generate_pin_token,
    generate_token,
    list_accounts,
)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signup", response_model=TokenResponse, status_code=201)
@authentication_not_required
async def signup(data: SignupRequest):
    user = await create_user(data)
    token = generate_token(user)
    # pin_token = generate_pin_token(user)
    return TokenResponse(access_token=token, user=UserResponse.model_validate(user))


@router.post("/login", response_model=TokenResponse)
@authentication_not_required
async def login(data: LoginRequest):
    user = await authenticate_user(data.email, data.password)
    token = generate_token(user)
    return TokenResponse(access_token=token, user=UserResponse.model_validate(user))


@router.post("/pin-login", response_model=PinLoginTokenResponse)
@authentication_not_required
async def pin_login(data: PinLoginRequest):
    user = await authenticate_with_pin(data.email, data.pin)
    token = generate_token(user)
    pin_token = generate_pin_token(user)
    return PinLoginTokenResponse(
        access_token=token,
        pin_token=pin_token,
        user=UserResponse.model_validate(user),
    )


@router.get("/accounts", response_model=list[AccountResponse])
@authentication_not_required
async def accounts():
    users = await list_accounts()
    return [AccountResponse.model_validate(u) for u in users]


@router.post("/pin", response_model=PinTokenResponse)
@authentication_not_required
async def verify_pin_endpoint(data: PinRequest):
    user = await User.get_or_none(email=data.email)
    if not user or not user.check_pin(data.pin):
        raise Unauthorized("PIN incorrecto")
    pin_token = generate_pin_token(user)
    return PinTokenResponse(pin_token=pin_token)


@router.post("/lock")
async def lock():
    return {"success": True}


@router.get("/me", response_model=UserResponse)
async def me(request: Request):
    return UserResponse.model_validate(request.state.user)
