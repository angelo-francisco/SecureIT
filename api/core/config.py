from pathlib import Path
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    SECRET_KEY: str = "x4$n!bnme4(khao6sy@8t*x&d1jn@#xk4^*u41-v20=5(2c55-"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 365

    DEBUG: bool = True

    BASE_DIR: Path = Path(__file__).resolve().parent.parent
    DATABASE_URL: str = "postgres://secureit:secureit@localhost:5432/secureit"
    YOLO_PATH: Path = BASE_DIR / "yolo"
    MEDIA_ROOT: Path = BASE_DIR / "media"
    UPLOAD_MAX_SIZE: int = 3 * 1024 * 1024

    TIME_ZONE: str = "Africa/Luanda"

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
