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


def _env_file() -> Path:
    # Resolve relative to the app root so it works both from source and
    # inside the PyInstaller bundle (where .env is shipped next to the app).
    return _base_dir() / ".env"


class Settings(BaseSettings):
    DEBUG: bool = True

    BASE_DIR: Path = _base_dir()
    # Required. Provided via env/.env (GitHub secret for CI builds).
    DATABASE_URL: str = ""
    WEB_URL: str = ""
    YOLO_PATH: Path = _base_dir() / "yolo"
    MEDIA_ROOT: Path = _user_data_dir() / "media" if is_bundled() else _base_dir() / "media"
    UPLOAD_MAX_SIZE: int = 3 * 1024 * 1024

    TIME_ZONE: str = "Africa/Luanda"

    EMBEDDED_DB: bool = False
    PORT: int | None = None

    # Public key used to verify license tokens signed by the web server.
    # Provided via env/.env (ED25519_PUBLIC_KEY). It is not secret, but it
    # must match the web server's signing key.
    ED25519_PUBLIC_KEY: str = ""
    ED25519_PUBLIC_KEY_PATH: str = str(_base_dir() / "ed25519_public.pem")

    model_config = {"env_file": _env_file(), "extra": "ignore"}

    def get_ed25519_public_key(self) -> str:
        if self.ED25519_PUBLIC_KEY:
            return self.ED25519_PUBLIC_KEY.strip()
        path = Path(self.ED25519_PUBLIC_KEY_PATH)
        if not path.exists():
            raise FileNotFoundError(
                f"Ed25519 public key not found at {path}. "
                "Set ED25519_PUBLIC_KEY (inline PEM) in your env/.env or "
                "generate with: python scripts/generate_keys.py"
            )
        return path.read_text().strip()


settings = Settings()
