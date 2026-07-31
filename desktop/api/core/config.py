import sys
from pathlib import Path

from pydantic_settings import BaseSettings


def is_bundled() -> bool:
    """True when running inside a PyInstaller bundle."""
    return getattr(sys, "_MEIPASS", None) is not None


def _base_dir() -> Path:
    if is_bundled():
        return Path(getattr(sys, "_MEIPASS"))
    return Path(__file__).resolve().parent.parent


def _user_data_dir() -> Path:
    home_dir = Path.home() / ".secureit"
    home_dir.mkdir(parents=True, exist_ok=True)
    return home_dir


class Settings(BaseSettings):
    DEBUG: bool = True

    SECRET_KEY: str = ""

    BASE_DIR: Path = _base_dir()
    DATABASE_URL: str = "postgres://secureit:secureit@localhost:5432/secureit"
    WEB_URL: str = "http://localhost:3000"
    YOLO_PATH: Path = _base_dir() / "yolo"
    MEDIA_ROOT: Path = _user_data_dir() / "media" if is_bundled() else _base_dir() / "media"
    UPLOAD_MAX_SIZE: int = 3 * 1024 * 1024

    TIME_ZONE: str = "Africa/Luanda"

    EMBEDDED_DB: bool = False
    PORT: int | None = None

    ED25519_PUBLIC_KEY: str = ""
    ED25519_PUBLIC_KEY_PATH: str = str(_base_dir() / "ed25519_public.pem")

    model_config = {"env_file": ".env", "extra": "ignore"}

    def get_ed25519_public_key(self) -> str:
        if self.ED25519_PUBLIC_KEY:
            return self.ED25519_PUBLIC_KEY.strip()
        path = Path(self.ED25519_PUBLIC_KEY_PATH)
        if not path.exists():
            raise FileNotFoundError(
                f"Ed25519 public key not found at {path}. "
                "Set ED25519_PUBLIC_KEY (inline PEM) or generate with: "
                "python scripts/generate_keys.py"
            )
        return path.read_text().strip()


settings = Settings()
