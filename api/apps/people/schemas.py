from datetime import datetime
from pydantic import BaseModel, field_validator


FIELD_TYPES = [
    ("G", "Guarda"),
    ("M", "Motorista"),
    ("E", "Electricista"),
    ("J", "Jardineiro(a)"),
    ("AL", "Auxiliar de Limpeza"),
    ("MA", "Membro da Administração"),
    ("O", "Outra(a)"),
]

PERSON_TYPES = [
    ("R", "Residente"),
    ("V", "Visitante"),
    ("W", "Trabalhador"),
]

VISITOR_TYPES = [
    ("VR", "Visitando residente"),
    ("PE", "Procurando emprego"),
    ("PS", "Prestador de serviço"),
    ("E", "Entregador"),
    ("O", "Outro(a)"),
]

FIELD_TYPES_DICT = dict(FIELD_TYPES)
VALID_FIELD_KEYS = {k for k, _ in FIELD_TYPES}
VALID_VISITOR_KEYS = {k for k, _ in VISITOR_TYPES}


class PersonCreate(BaseModel):
    first_name: str
    last_name: str
    person_type: str
    photo_base64: str

    @field_validator("person_type")
    @classmethod
    def validate_type(cls, v: str) -> str:
        if v not in ("R", "V", "W"):
            raise ValueError("Tipo de pessoa inválido")
        return v


class PersonUpdate(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    photo_base64: str | None = None


class ResidentCreate(BaseModel):
    bi: str
    homes: list[int]

    @field_validator("bi")
    @classmethod
    def validate_bi(cls, v: str) -> str:
        if len(v) != 14:
            raise ValueError("O BI deve conter exatamente 14 caracteres")
        return v.upper()


class WorkerCreate(BaseModel):
    bi: str
    homes: list[int]
    fields: list[str]

    @field_validator("bi")
    @classmethod
    def validate_bi(cls, v: str) -> str:
        if len(v) != 14:
            raise ValueError("O BI deve conter exatamente 14 caracteres")
        return v.upper()

    @field_validator("fields")
    @classmethod
    def validate_fields(cls, v: list[str]) -> list[str]:
        if not v:
            raise ValueError("Áreas de trabalho não informadas")
        if set(v) - VALID_FIELD_KEYS:
            raise ValueError("Uma ou mais áreas de trabalho são inválidas")
        return v


class VisitorCreate(BaseModel):
    host_id: int
    visitor_type: str

    @field_validator("visitor_type")
    @classmethod
    def validate_type(cls, v: str) -> str:
        if v not in VALID_VISITOR_KEYS:
            raise ValueError("Tipo de visitante inválido")
        return v


class VisitCreate(BaseModel):
    desc: str | None = None
    destinies: list[int]


class HomeResponse(BaseModel):
    id: int
    number: int
    street: str

    model_config = {"from_attributes": True}


class ResidentResponse(BaseModel):
    id: int
    bi: str
    person_id: int
    homes: list[HomeResponse] = []

    model_config = {"from_attributes": True}


class VisitorResponse(BaseModel):
    id: int
    type: str
    person_id: int

    model_config = {"from_attributes": True}


class WorkerResponse(BaseModel):
    id: int
    bi: str
    person_id: int
    fields: str
    list_fields: list[str] = []
    work_homes: list[int] = []

    model_config = {"from_attributes": True}


class PersonResponse(BaseModel):
    id: int
    first_name: str
    last_name: str
    full_name: str
    type: str
    photo: str | None
    added_at: datetime
    updated_at: datetime
    banned: bool
    resident: ResidentResponse | None = None
    visitor: VisitorResponse | None = None
    worker: WorkerResponse | None = None

    model_config = {"from_attributes": True}


class VisitResponse(BaseModel):
    id: int
    visitor_id: int
    desc: str | None
    visited_at: datetime
    destinies: list = []

    model_config = {"from_attributes": True}


class FaceSearchRequest(BaseModel):
    photo_base64: str
