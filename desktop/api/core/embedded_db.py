import json
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


def _pgdata_dir() -> Path:
    return Path(_user_data_dir()) / "pgdata"


def _force_stop_leftovers() -> None:
    """Kill any postgres still using our data dir.

    pgserver only stops the server when the *last* registered handle cleans
    up; handles left behind by processes that were hard-killed stay forever
    in pgdata/.handle_pids.json, so server.cleanup() alone can leave the
    database running. This safety net guarantees the DB dies together with
    the API no matter how the process ends.
    """
    try:
        import psutil
    except Exception:
        return
    data_dir = str(_pgdata_dir().resolve())
    for proc in psutil.process_iter(attrs=["pid", "cmdline"]):
        try:
            cmdline = proc.info["cmdline"] or []
        except Exception:
            continue
        if not cmdline:
            continue
        if "postgres" not in os.path.basename(cmdline[0]):
            continue
        if f"-D {data_dir}" in " ".join(cmdline):
            try:
                proc.terminate()
                proc.wait(3)
            except psutil.TimeoutExpired:
                proc.kill()


def _prune_stale_handles(data_dir: Path) -> None:
    """Drop dead pids from pgserver's handle list (.handle_pids.json).

    pids of hard-killed processes accumulate there forever, which also keeps
    pgserver's own cleanup from stopping the server. Removing pids that are
    no longer alive restores that behaviour.
    """
    handle_file = data_dir / ".handle_pids.json"
    if not handle_file.exists():
        return
    try:
        import psutil

        pids = json.loads(handle_file.read_text())
        alive = [p for p in pids if isinstance(p, int) and psutil.pid_exists(p)]
        handle_file.write_text(json.dumps(alive))
    except Exception:
        logger.exception("Failed to prune stale pgserver handles")


def stop_embedded_postgres() -> None:
    """Stop the embedded PostgreSQL if it was started by this process.

    Idempotent and safe to call from shutdown hooks and atexit. The leftover
    sweep guarantees the server stops even if pgserver's own bookkeeping is
    stale.
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
    _force_stop_leftovers()


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

        data_dir = _pgdata_dir()
        data_dir.mkdir(parents=True, exist_ok=True)
        _prune_stale_handles(data_dir)

        server = get_server(str(data_dir))
        _server = server
        uri = server.get_uri()

        parsed = urlparse(uri)
        query = parse_qs(parsed.query)
        host = query.get("host", [parsed.hostname])[0]
        credentials: dict = {
            "host": host,
            "user": parsed.username or "postgres",
            "password": parsed.password,
            "database": (parsed.path or "/postgres")[1:],
        }
        if parsed.port:
            credentials["port"] = parsed.port
        settings.DATABASE_URL = uri
        _embedded_credentials = credentials
        _embedded_uri = uri
        logger.info("Embedded PostgreSQL started (data_dir=%s)", data_dir)
        return uri
