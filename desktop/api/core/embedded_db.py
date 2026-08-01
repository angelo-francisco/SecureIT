import logging
import os
import threading
from pathlib import Path
from urllib.parse import parse_qs, urlparse

from core.config import _user_data_dir, settings

logger = logging.getLogger("embedded_db")

_URI_LOCK = threading.Lock()
_embedded_uri: str | None = None
_embedded_credentials: dict | None = None
_server: object | None = None


def embedded_credentials() -> dict | None:
    """Tortoise connection credentials for the embedded PostgreSQL."""
    return _embedded_credentials


def stop_embedded_postgres() -> None:
    """Stop the embedded PostgreSQL if it was started by this process.

    Idempotent and safe to call from shutdown hooks and atexit.
    """
    global _server
    server = _server
    _server = None
    if server is not None:
        try:
            server.cleanup()
            logger.info("Embedded PostgreSQL stopped")
        except Exception:
            logger.exception("Failed to stop embedded PostgreSQL cleanly")


def start_embedded_postgres() -> str:
    """Start the bundled PostgreSQL (pgserver) and return its connection URI.

    Launched once per process; safe to call multiple times.
    The bundled server includes the pgvector extension (enabled via
    CREATE EXTENSION in core.database). On Linux/macOS it listens on a
    local unix socket; on Windows it binds a free local port.
    """
    global _embedded_uri, _embedded_credentials, _server
    if _embedded_uri is not None:
        return _embedded_uri

    with _URI_LOCK:
        if _embedded_uri is not None:
            return _embedded_uri

        try:
            from pgserver import get_server
        except ImportError as exc:  # pragma: no cover
            raise RuntimeError(
                "pgserver not installed. Embedded database is unavailable."
            ) from exc

        data_dir = Path(_user_data_dir()) / "pgdata"
        data_dir.mkdir(parents=True, exist_ok=True)

        server = get_server(str(data_dir))
        _server = server
        uri = server.get_uri()

        parsed = urlparse(uri)
        query = parse_qs(parsed.query)
        host = query.get("host", [parsed.hostname])[0]

        if os.name == "nt" and "host" not in query and parsed.hostname:
            host = "127.0.0.1"
            parsed = urlparse(
                f"postgresql://{parsed.username or 'postgres'}@"
                f"{host}:{parsed.port}/{parsed.path.lstrip('/') or 'postgres'}"
            )

        credentials: dict = {
            "host": host,
            "user": parsed.username or "postgres",
            "password": parsed.password,
            "database": (parsed.path or "/postgres")[1:],
        }
        if parsed.port:
            credentials["port"] = parsed.port
        settings.DATABASE_URL = parsed.geturl()
        _embedded_credentials = credentials
        _embedded_uri = uri
        logger.info("Embedded PostgreSQL started (data_dir=%s)", data_dir)
        return uri
