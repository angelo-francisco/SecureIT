import logging
from pathlib import Path
from urllib.parse import urlparse

from aerich import Command
from tortoise import Tortoise
from tortoise.context import TortoiseContext, set_global_context
from tortoise.exceptions import ConfigurationError

from core.config import settings

logger = logging.getLogger("database")

TORTOISE_MODELS = [
    "apps.control.models",
    "apps.cameras.models",
    "apps.face_detection.models",
    "apps.notifications.models",
    "apps.panel.models",
    "apps.people.models",
    "apps.audit.models",
    "apps.license.models",
    "aerich.models",
]

TORTOISE_ORM = {
    "connections": {"default": settings.DATABASE_URL},
    "apps": {
        "models": {
            "models": TORTOISE_MODELS,
            "default_connection": "default",
        },
    },
}


def get_tortoise_config() -> dict:
    from core.embedded_db import embedded_credentials

    credentials = embedded_credentials()
    if settings.EMBEDDED_DB and credentials:
        connections = {
            "default": {
                "engine": "tortoise.backends.asyncpg",
                "credentials": credentials,
            }
        }
    else:
        connections = {"default": settings.DATABASE_URL}
    return {
        "connections": connections,
        "apps": {
            "models": {
                "models": TORTOISE_MODELS,
                "default_connection": "default",
            },
        },
    }


def db_error_hint(exc: Exception) -> str:
    """Human-readable guidance for a database connection failure.

    The desktop bundle connects to the bundled PostgreSQL (EMBEDDED_DB) unless
    a DATABASE_URL points at an external server. Outside Docker the sample
    `db` host only exists inside the compose network, so a bare getaddrinfo
    error leaves users with no clue what to do - this explains it.
    """
    if settings.EMBEDDED_DB:
        return (
            "The bundled PostgreSQL failed to start. Check the server log at "
            f"{Path.home() / '.secureit' / 'pgserver.log'}. If the data "
            "directory is corrupted, delete ~/.secureit/pgdata and retry, or "
            "set EMBEDDED_DB=false and provide a reachable DATABASE_URL."
        )
    host = urlparse(settings.DATABASE_URL).hostname or "?"
    return (
        f"Cannot connect to PostgreSQL at '{host}' (from DATABASE_URL): {exc}. "
        "That host may only be reachable inside the project's Docker network. "
        "Run the desktop app normally (it enables the bundled database), or set "
        "EMBEDDED_DB=true in the .env, or fix DATABASE_URL."
    )


def migrations_dir() -> Path:
    return Path(settings.BASE_DIR) / "migrations"


async def run_migrations() -> None:
    config = get_tortoise_config()
    location = str(migrations_dir())
    # aerich calls Tortoise.init() internally, which would re-initialise (and
    # close) the app's TortoiseContext and wipe the global fallback that lets
    # requests/websockets/background tasks reach the DB. Run it inside its own
    # isolated context so the app's global context stays intact.
    async with TortoiseContext():
        if not Path(location, "models").exists():
            logger.warning(
                "No aerich migrations found at %s; generating schema from models",
                location,
            )
            await Tortoise.init(config=config)
            await Tortoise.generate_schemas(safe=True)
            return

        cmd = Command(tortoise_config=config, app="models", location=location)
        await cmd.init()
        try:
            migrated = await cmd.upgrade()
        except Exception as exc:  # NOQA
            logger.warning(
                "Aerich upgrade failed (%s); bootstrapping schema from models", exc
            )
            await Tortoise.generate_schemas(safe=True)
            migrated = await cmd.upgrade()
        if migrated:
            logger.info("Applied aerich migrations: %s", migrated)


def ensure_global_fallback() -> None:
    """Re-establish the global TortoiseContext fallback if it was lost.

    Tortoise 1.x clears the global fallback whenever close_connections() runs
    on the active context (e.g. aerich's internal Tortoise.init() re-init path).
    Requests, websockets and background tasks rely on that fallback, so restore
    it if startup ever leaves it missing.
    """
    ctx = Tortoise._get_context()
    if ctx is None:
        return
    try:
        set_global_context(ctx)
    except ConfigurationError:
        pass  # already active - nothing to do
    else:
        logger.warning("Global Tortoise context fallback was missing; re-established")


async def after_db_startup():
    conn = Tortoise.get_connection("default")

    await conn.execute_query("CREATE EXTENSION IF NOT EXISTS vector")

    await run_migrations()

    try:
        await conn.execute_query("""
            CREATE INDEX IF NOT EXISTS idx_person_embeddings_vector
            ON person_embeddings
            USING hnsw (embedding vector_cosine_ops)
        """)
    except Exception as exc:
        logger.warning("HNSW index creation skipped: %s", exc)
    finally:
        ensure_global_fallback()

    try:
        from apps.notifications.service import cleanup_orphan_photos

        await cleanup_orphan_photos()
    except Exception:
        logger.exception("notification photo cleanup failed")
