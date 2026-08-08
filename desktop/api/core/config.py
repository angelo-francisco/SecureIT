import sys
from pathlib import Path

from pydantic_settings import BaseSettings


def is_bundled() -> bool:
    return getattr(sys, "_MEIPASS", None) is not None


def _base_dir() -> Path:
    if is_bundled():
        return Path(getattr(sys, "_MEIPASS"))
    return Path(__file__).resolve().parent.parent


def _user_data_dir() -> Path:
    home_dir = Path.home() / ".secureit"
    home_dir.mkdir(parents=True, exist_ok=True)
    return home_dir


def _env_file() -> Path:
    return _base_dir() / ".env"


class Settings(BaseSettings):
    DEBUG: bool = True
    BASE_DIR: Path = _base_dir()
    DATABASE_URL: str = ""
    WEB_URL: str = ""
    VGGFACE2_PATH: Path = _base_dir() / "models" / "vggface2.pt"
    YOLO_PATH: Path = _base_dir() / "models" / "yolo26n.pt"
    MEDIA_ROOT: Path = (
        _user_data_dir() / "media" if is_bundled() else _base_dir() / "media"
    )
    UPLOAD_MAX_SIZE: int = 3 * 1024 * 1024
    TIME_ZONE: str = "Africa/Luanda"
    EMBEDDED_DB: bool = False
    PORT: int | None = None
    ED25519_PUBLIC_KEY: str = ""
    HOST_VIDEO_DIR: str = ""
    VIDEO_DIR: str = "/downloads"

    model_config = {"env_file": _env_file(), "extra": "ignore"}

    def get_ed25519_public_key(self) -> str:
        if self.ED25519_PUBLIC_KEY:
            return self.ED25519_PUBLIC_KEY.strip()
        raise RuntimeError("Public key not found")


settings = Settings()
