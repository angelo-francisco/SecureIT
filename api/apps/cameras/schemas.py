from datetime import datetime
from pydantic import BaseModel, field_validator


class CameraCreate(BaseModel):
    name: str
    location: str
    connection_type: str
    connection_info: dict = {}

    @field_validator("connection_type")
    @classmethod
    def validate_type(cls, v: str) -> str:
        v = v.upper()
        if v not in ("L", "W"):
            raise ValueError("Tipo de conexão inválido. Use Local ou Wi-Fi.")
        return v

    @field_validator("connection_info")
    @classmethod
    def validate_info(cls, v: dict, info) -> dict:
        connection_type = info.data.get("connection_type", "").upper()
        if connection_type == "W":
            stream_url = v.get("stream_url", "")
            if not stream_url.startswith(("http://", "https://", "rtsp://")):
                raise ValueError("URL inválida. Use HTTP, HTTPS ou RTSP.")
        return v


class CameraUpdate(BaseModel):
    name: str | None = None
    location: str | None = None
    connection_info: dict | None = None


class CameraResponse(BaseModel):
    id: int
    user_id: int
    name: str | None
    location: str | None
    status: bool | None
    connection_type: str | None
    connection_info: dict | None
    get_name: str
    video_source: str | int | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True, "arbitrary_types_allowed": True}


class CameraDetailResponse(CameraResponse):
    pass


class AvailableCamera(BaseModel):
    id: int
    name: str
    path: str
    backend: str
    index: int
