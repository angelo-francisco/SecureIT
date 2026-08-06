import logging
import os

from pydantic import BaseModel, field_validator
from tortoise.contrib.pydantic import pydantic_model_creator, pydantic_queryset_creator

from .models import Camera

logger = logging.getLogger(__name__)

CameraDetail = pydantic_model_creator(Camera, name="CameraDetail")
ListCameras = pydantic_queryset_creator(Camera, name="ListCameras")


class CameraUpdate(BaseModel):
    name: str | None = None
    location: str | None = None
    connection_info: dict | None = None
    face_recognition: bool | None = None
    task: str | None = None

    @field_validator("task")
    @classmethod
    def validate_task(cls, v: str | None) -> str | None:
        if v is not None:
            v = v.upper()
            if v not in ("D", "FR", "BA"):
                raise ValueError("Tarefa inválida. Use D, FR ou BA.")
        return v


class CameraCreate(BaseModel):
    name: str
    location: str
    connection_type: str
    connection_info: dict = {}
    face_recognition: bool = False
    task: str = "D"

    @field_validator("connection_type")
    @classmethod
    def validate_type(cls, v: str) -> str:
        v = v.upper()
        if v not in ("L", "W"):
            raise ValueError("Tipo de conexão inválido. Use Local ou Wi-Fi.")
        return v

    @field_validator("task")
    @classmethod
    def validate_task(cls, v: str) -> str:
        v = v.upper()
        if v not in ("D", "FR", "BA"):
            raise ValueError("Tarefa inválida. Use D, FR ou BA.")
        return v

    @field_validator("connection_info")
    @classmethod
    def validate_info(cls, v: dict, info) -> dict:
        connection_type = info.data.get("connection_type", "").upper()
        if connection_type == "W":
            stream_url = v.get("stream_url", "")
            if not stream_url.startswith(("http://", "https://", "rtsp://")):
                raise ValueError("URL inválida. Use HTTP, HTTPS ou RTSP.")
        if connection_type == "L":
            path = v.get("path", "")
            if path and any(
                path.lower().endswith(ext)
                for ext in (".mp4", ".avi", ".mov", ".mkv", ".flv", ".wmv", ".webm")
            ):
                if not os.path.isfile(path):
                    logger.warning("demo video file not found on disk: %s", path)
        return v


class AvailableCamera(BaseModel):
    id: int
    name: str
    path: str
    backend: int
    index: int
    usable: bool = True
