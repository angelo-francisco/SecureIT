from pathlib import Path
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DEBUG: bool = True

    BASE_DIR: Path = Path(__file__).resolve().parent.parent
    DATABASE_URL: str = "postgres://secureit:secureit@localhost:5432/secureit"
    YOLO_PATH: Path = BASE_DIR / "yolo"
    MEDIA_ROOT: Path = BASE_DIR / "media"
    UPLOAD_MAX_SIZE: int = 3 * 1024 * 1024

    TIME_ZONE: str = "Africa/Luanda"

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
