from datetime import datetime
from pydantic import BaseModel, EmailStr, field_validator


class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    pin: str
    first_name: str
    last_name: str
    phone: str | None = None

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 12:
            raise ValueError("Palavra-passe deve conter pelo menos 12 caracteres")
        return v

    @field_validator("pin")
    @classmethod
    def validate_pin(cls, v: str) -> str:
        if len(v) != 4 or not v.isdigit():
            raise ValueError("O PIN deve conter 4 dígitos")
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class PinLoginRequest(BaseModel):
    email: EmailStr
    pin: str

    @field_validator("pin")
    @classmethod
    def validate_pin(cls, v: str) -> str:
        if len(v) != 4 or not v.isdigit():
            raise ValueError("PIN deve conter 4 dígitos")
        return v


class PinRequest(BaseModel):
    email: EmailStr
    pin: str

    @field_validator("pin")
    @classmethod
    def validate_pin(cls, v: str) -> str:
        if len(v) != 4 or not v.isdigit():
            raise ValueError("PIN deve conter 4 dígitos")
        return v


class AccountResponse(BaseModel):
    id: int
    email: str
    first_name: str
    last_name: str

    model_config = {"from_attributes": True}


class UserResponse(BaseModel):
    id: int
    email: str
    first_name: str
    last_name: str
    phone: str | None = None
    full_name: str
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class PinLoginTokenResponse(BaseModel):
    access_token: str
    pin_token: str
    token_type: str = "bearer"
    user: UserResponse


class PinTokenResponse(BaseModel):
    pin_token: str
    token_type: str = "pin"


class ReAuthRequest(BaseModel):
    email: EmailStr
    pin: str

    @field_validator("pin")
    @classmethod
    def validate_pin(cls, v: str) -> str:
        if len(v) != 4 or not v.isdigit():
            raise ValueError("PIN deve conter 4 dígitos")
        return v
