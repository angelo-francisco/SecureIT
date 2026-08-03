import asyncio
import atexit
import logging
import os
import threading
import time
from pathlib import Path
from urllib.parse import parse_qs, urlparse

import asyncpg
import psutil

from core.config import _user_data_dir, settings

logger = logging.getLogger("embedded_db")

_URI_LOCK = threading.Lock()
_embedded_uri: str | None = None
_embedded_credentials: dict | None = None
_server: object | None = None

# pgserver waits at most 10s for a single pg_ctl start. On Windows a stale
# handle on PGDATA/log can make the postmaster retry opening it for ~30s,
# blowing past that timeout, so we retry after killing leftovers/rotating the
# log. We also patch pg_ctl's timeout up so a genuine recovery/init is never
# cut short.
_START_ATTEMPTS = 3
_START_RETRY_DELAY = 2.0
_PG_CTL_TIMEOUT = 120.0


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


def _pgdata_dir() -> Path:
    data_dir = Path(_user_data_dir()) / "pgdata"
    data_dir.mkdir(parents=True, exist_ok=True)
    return data_dir


def _pg_log_path() -> Path:
    """Server log kept OUTSIDE pgdata.

    On Windows, PostgreSQL crash recovery fsyncs every file under pgdata,
    including the server log that `pg_ctl -l` holds open (pg_ctl's own handle).
    That raises a Windows "sharing violation" that stalls recovery for ~30s and
    blows past pg_ctl's 10s wait, so the API fails to start. Pointing the log
    outside pgdata (the fix used by the fitz-pgserver fork) avoids the conflict
    entirely and recovery completes in ~1-2s.
    """
    log = Path(_user_data_dir()) / "pgserver.log"
    log.parent.mkdir(parents=True, exist_ok=True)
    return log


def _is_our_postgres(proc: psutil.Process, data_dir: Path) -> bool:
    """Match an embedded postgres process bound to our data dir."""
    name = (proc.info.get("name") or "").lower()
    if "postgres" not in name:
        return False
    cmdline = proc.info.get("cmdline") or []
    if not cmdline:
        return False
    marker = str(data_dir).replace("\\", "/").lower()
    return marker in " ".join(cmdline).replace("\\", "/").lower()


def _cleanup_leftover_postgres(data_dir: Path) -> None:
    """Kill postgres processes left over from an abnormally terminated run.

    pgserver only reaps stale servers while initializing a brand-new data dir.
    If the Tauri app is killed without its exit hook (taskkill, crash, forced
    quit, reboot), postgres.exe survives and keeps PGDATA/log open. The next
    launch then hits a Windows "sharing violation" while the postmaster retries
    opening the log for ~30s - longer than pg_ctl's 10s wait - and the API
    startup fails. Kill any process using our data dir before starting.
    """
    killed = []
    for proc in psutil.process_iter(["name", "cmdline"]):
        if proc.pid == os.getpid() or not _is_our_postgres(proc, data_dir):
            continue
        logger.warning(
            "Killing leftover embedded postgres (pid=%s cmdline=%s)",
            proc.pid,
            " ".join(proc.info.get("cmdline") or []),
        )
        try:
            proc.terminate()
            try:
                proc.wait(2)
            except psutil.TimeoutExpired:
                pass
            if proc.is_running():
                proc.kill()
            killed.append(proc.pid)
        except psutil.NoSuchProcess:
            pass
        except psutil.AccessDenied:
            logger.warning("Cannot stop leftover embedded postgres pid=%s", proc.pid)
    if killed:
        logger.info("Stopped leftover embedded postgres processes: %s", killed)


def _rotate_pg_log(data_dir: Path) -> None:
    """Drop the previous server log before starting a fresh postmaster.

    pgserver always opens PGDATA/log when launching postgres. On Windows an
    open handle held by another process makes that open retry for ~30s while
    pg_ctl only waits 10s, so the start times out. Removing the file up front
    (when possible) sidesteps the lock.
    """
    log = data_dir / "log"
    if not log.exists():
        return
    try:
        log.unlink()
        logger.info("Rotated stale embedded postgres log")
    except OSError:
        logger.warning("Could not remove %s (another process may hold it)", log)


def _preflight(data_dir: Path) -> None:
    """Clear anything that can wedge pg_ctl's start wait (Windows only).

    Only Windows exhibits the log-open "sharing violation"; elsewhere the
    server reuses or restarts cleanly, so POSIX behavior is left untouched.
    """
    if os.name != "nt":
        return
    _cleanup_leftover_postgres(data_dir)
    _rotate_pg_log(data_dir)


_pg_ctl_patched = False


def _ensure_pg_ctl_timeout() -> None:
    """Raise pg_ctl's start timeout above pgserver's hardcoded 10s.

    pgserver runs `pg_ctl -w start` with timeout=10. Crash recovery and first
    initdb can take longer on slow machines, so default the timeout to a more
    generous value. Applied once by wrapping the `pg_ctl` name bound in
    pgserver.postgres_server (a module-global lookup at call time).
    """
    global _pg_ctl_patched
    if _pg_ctl_patched:
        return
    import pgserver.postgres_server as _ps

    _orig_pg_ctl = _ps.pg_ctl

    def _pg_ctl_with_timeout(*args, **kwargs):
        kwargs.setdefault("timeout", _PG_CTL_TIMEOUT)
        return _orig_pg_ctl(*args, **kwargs)

    _ps.pg_ctl = _pg_ctl_with_timeout
    _pg_ctl_patched = True


def _get_server_clean(data_dir: Path) -> object:
    """get_server() for the data dir, dropping any half-initialized instance."""
    from pgserver import get_server
    from pgserver.postgres_server import PostgresServer

    class ExternalLogPostgresServer(PostgresServer):
        """pgserver instance whose log file lives outside pgdata.

        PostgresServer.__init__ assigns ``self.log = pgdata / "log"``; the
        no-op setter swallows that and the getter returns the external path,
        so ``pg_ctl -l`` writes to a file outside pgdata (see _pg_log_path).
        """

        _log_path = _pg_log_path()

        @property
        def log(self) -> Path:
            return self._log_path

        @log.setter
        def log(self, value: Path) -> None:
            pass

    key = data_dir.expanduser().resolve()
    stale = PostgresServer._instances.pop(key, None)
    if stale is not None:
        atexit.unregister(stale._cleanup)
        logger.warning("Discarded stale pgserver instance for %s", key)

    _ensure_pg_ctl_timeout()

    # On Windows use the external-log variant (see _pg_log_path); POSIX keeps
    # the stock behavior, matching the preflight gating.
    if os.name == "nt":
        return ExternalLogPostgresServer(data_dir, cleanup_mode="stop")
    return get_server(str(data_dir))


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

        data_dir = _pgdata_dir()
        _preflight(data_dir)

        last_exc: Exception | None = None
        server = None
        for attempt in range(1, _START_ATTEMPTS + 1):
            try:
                server = _get_server_clean(data_dir)
                break
            except Exception as exc:  # noqa: BLE001 - surface any pgserver failure
                last_exc = exc
                logger.warning(
                    "Embedded postgres start attempt %d/%d failed: %s",
                    attempt,
                    _START_ATTEMPTS,
                    exc,
                )
                _preflight(data_dir)
                if attempt < _START_ATTEMPTS:
                    time.sleep(_START_RETRY_DELAY)

        if server is None:
            raise RuntimeError(
                "Failed to start embedded PostgreSQL "
                f"after {_START_ATTEMPTS} attempts"
            ) from last_exc

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


async def wait_for_embedded_postgres(
    timeout: float = 30.0, interval: float = 0.5
) -> None:
    """Block until the embedded PostgreSQL answers ``SELECT 1``.

    pgserver already waits for the postmaster to report "ready", but this is
    the definitive positive signal the app gates its startup on: only when a
    real SQL round-trip succeeds do we let the app continue booting.
    """
    credentials = _embedded_credentials
    if not credentials:
        raise RuntimeError("Embedded PostgreSQL was not started")

    deadline = time.monotonic() + timeout
    last_exc: Exception | None = None
    while time.monotonic() < deadline:
        try:
            conn = await asyncpg.connect(**credentials, timeout=3)
            try:
                await conn.execute("SELECT 1")
            finally:
                await conn.close()
            logger.info("Embedded PostgreSQL healthcheck passed")
            return
        except Exception as exc:  # noqa: BLE001 - server may still be booting
            last_exc = exc
            await asyncio.sleep(interval)

    raise RuntimeError(
        "Embedded PostgreSQL did not answer a healthcheck within "
        f"{timeout:g}s. Check the server log at {_pg_log_path()}. If the data "
        "directory is corrupted, delete ~/.secureit/pgdata and retry, or set "
        "EMBEDDED_DB=false and provide a reachable DATABASE_URL."
    ) from last_exc
