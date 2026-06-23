from datetime import datetime
from pydantic import BaseModel, field_validator


class CameraCreate(BaseModel):
    name: str
    location: str
    connection_type: str

    @field_validator("connection_type")
    @classmethod
    def validate_type(cls, v: str) -> str:
        v = v.upper()
        if v not in ("L", "W"):
            raise ValueError("Tipo de conexão inválido. Use Local ou Wi-Fi.")
        return v


class CameraUpdate(BaseModel):
    name: str | None = None
    location: str | None = None
    stream_url: str | None = None


class LocalCameraCreate(BaseModel):
    camera_path: str


class WifiCameraCreate(BaseModel):
    stream_url: str

    @field_validator("stream_url")
    @classmethod
    def validate_url(cls, v: str) -> str:
        if not v.startswith(("http://", "https://", "rtsp://")):
            raise ValueError("URL inválida. Use HTTP, HTTPS ou RTSP.")
        return v


class CameraResponse(BaseModel):
    id: int
    user_id: int
    name: str | None
    location: str | None
    status: bool | None
    connection_type: str | None
    get_name: str
    video_source: str | int | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True, "arbitrary_types_allowed": True}


class CameraDetailResponse(CameraResponse):
    localcamera: dict | None = None
    wificamera: dict | None = None


class AvailableCamera(BaseModel):
    id: int
    name: str
    path: str
    backend: str
    index: int
