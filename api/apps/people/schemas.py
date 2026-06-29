from datetime import datetime

from pydantic import BaseModel, Field, field_validator

VALID_FIELD_TYPES = {"text", "number", "select", "boolean", "date"}


class RoleFieldCreate(BaseModel):
    label: str
    field_type: str = Field(default="text")
    required: bool = False
    options: list[str] | None = None
    sort_order: int = 0

    @field_validator("field_type")
    @classmethod
    def validate_type(cls, v: str) -> str:
        if v not in VALID_FIELD_TYPES:
            raise ValueError(
                f"Tipo de campo inválido. Válidos: {', '.join(sorted(VALID_FIELD_TYPES))}"
            )
        return v


class RoleCreate(BaseModel):
    name: str
    description: str | None = None
    fields: list[RoleFieldCreate] = []


class RoleFieldUpdate(BaseModel):
    label: str | None = None
    field_type: str | None = None
    required: bool | None = None
    options: list[str] | None = None
    sort_order: int | None = None


class RoleUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    fields: list[RoleFieldCreate | RoleFieldUpdate] | None = None


class RoleFieldResponse(BaseModel):
    id: int
    label: str
    field_type: str
    required: bool
    options: list[str] | None = None
    sort_order: int

    model_config = {"from_attributes": True}


class RoleResponse(BaseModel):
    id: int
    name: str
    description: str | None
    fields: list[RoleFieldResponse] = []
    created_at: datetime

    model_config = {"from_attributes": True}


class PersonRoleCreate(BaseModel):
    role_id: int
    field_values: dict[str, str | bool | int | float] | None = None


class PersonRoleResponse(BaseModel):
    id: int
    role_id: int
    role_name: str
    field_values: dict | None

    model_config = {"from_attributes": True}


class PersonCreate(BaseModel):
    first_name: str
    last_name: str
    photo_base64: str
    banned: bool = False
    roles: list[PersonRoleCreate] = []


class PersonUpdate(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    photo_base64: str | None = None


class PersonResponse(BaseModel):
    id: int
    first_name: str
    last_name: str
    full_name: str
    photo: str | None
    added_at: datetime
    updated_at: datetime
    banned: bool
    roles: list[PersonRoleResponse] = []

    model_config = {"from_attributes": True}


class FaceSearchRequest(BaseModel):
    photo_base64: str
