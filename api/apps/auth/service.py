from apps.auth.models import User
from apps.auth.schemas import SignupRequest
from apps.panel.models import Configuration
from core.exceptions import ValidationError_, Unauthorized
from core.security import create_access_token


async def create_user(data: SignupRequest) -> User:
    existing = await User.get_or_none(email=data.email)
    if existing:
        raise ValidationError_("Este e-mail já foi cadastrado.")

    user = User(
        email=data.email,
        first_name=data.first_name,
        last_name=data.last_name,
        phone=data.phone,
    )
    user.set_password(data.password)
    user.set_pin(data.pin)
    await user.save()

    config = Configuration(
        user=user,
        monitoring_start_time="22:00:00",
        monitoring_end_time="08:00:00",
    )
    await config.save()

    return user


async def authenticate_user(email: str, password: str) -> User:
    user = await User.get_or_none(email=email)
    if not user or not user.check_password(password):
        raise Unauthorized("E-mail ou palavra-passe incorrectos")
    if not user.is_active:
        raise Unauthorized("Conta desativada")
    return user


async def authenticate_with_pin(email: str, pin: str) -> User:
    user = await User.get_or_none(email=email)
    if not user or not user.check_pin(pin):
        raise Unauthorized("E-mail ou PIN incorrectos")
    if not user.is_active:
        raise Unauthorized("Conta desativada")
    return user


async def list_accounts() -> list[User]:
    return await User.all().order_by("email")


def generate_token(user: User) -> str:
    from datetime import timedelta
    return create_access_token(
        data={"sub": str(user.id)},
        expires_delta=timedelta(days=365),
    )


def generate_pin_token(user: User) -> str:
    from datetime import timedelta
    return create_access_token(
        data={"sub": str(user.id), "type": "pin"},
        expires_delta=timedelta(hours=1),
    )
