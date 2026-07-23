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

    ED25519_PUBLIC_KEY_PATH: str = str(BASE_DIR / "ed25519_public.pem")

    model_config = {"env_file": ".env", "extra": "ignore"}

    def get_ed25519_public_key(self) -> str:
        path = Path(self.ED25519_PUBLIC_KEY_PATH)
        if not path.exists():
            raise FileNotFoundError(
                f"Ed25519 public key not found at {path}. "
                "Generate with: python scripts/generate_keys.py"
            )
        return path.read_text().strip()


settings = Settings()
