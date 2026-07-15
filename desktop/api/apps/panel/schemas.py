from pydantic import BaseModel, field_validator


class ConfigurationUpdate(BaseModel):
    fps: int | None = None
    monitoring_start_time: str | None = None
    monitoring_end_time: str | None = None
    alert_cooldown: int | None = None
    detect_every: int | None = None
    allow_draw: bool | None = None

    @field_validator("fps")
    @classmethod
    def validate_fps(cls, v: int | None) -> int | None:
        if v is not None and v < 1:
            raise ValueError("FPS deve ser maior que 1")
        return v

    @field_validator("alert_cooldown")
    @classmethod
    def validate_cooldown(cls, v: int | None) -> int | None:
        if v is not None and v < 0:
            raise ValueError("Tempo de espera deve ser positivo")
        return v

    @field_validator("detect_every")
    @classmethod
    def validate_detect(cls, v: int | None) -> int | None:
        if v is not None and v < 1:
            raise ValueError("Detecções por frames deve ser maior que 1")
        return v


class ConfigurationResponse(BaseModel):
    id: int
    user_id: int
    fps: int
    monitoring_start_time: str | None
    monitoring_end_time: str | None
    alert_cooldown: int
    detect_every: int
    allow_draw: bool

    model_config = {"from_attributes": True}


class DashboardResponse(BaseModel):
    cameras: list
    notifications_count: int
