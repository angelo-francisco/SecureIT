import logging
from pathlib import Path

from aerich import Command
from tortoise import Tortoise

from core.config import is_bundled, settings

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


def _tortoise_config() -> dict:
    from core.embedded_db import embedded_credentials

    if settings.EMBEDDED_DB and embedded_credentials():
        connections = {
            "default": {
                "engine": "tortoise.backends.asyncpg",
                "credentials": embedded_credentials(),
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


def _migrations_dir() -> Path:
    return Path(settings.BASE_DIR) / "migrations"


async def _run_migrations() -> None:
    migrations_dir = _migrations_dir()
    cmd = Command(
        tortoise_config=_tortoise_config(),
        app="models",
        location=str(migrations_dir),
    )
    await cmd.init()
    try:
        migrated = await cmd.upgrade()
        if migrated:
            logger.info("Applied aerich migrations: %s", migrated)
    except Exception as exc:  # noqa: BLE001 - fresh DB without aerich table
        logger.info("Aerich table missing (%s); bootstrapping fresh schema", exc)
        await Tortoise.generate_schemas()
        migrated = await cmd.upgrade()
        if migrated:
            logger.info("Registered aerich migrations on fresh DB: %s", migrated)


async def init_db():
    if settings.EMBEDDED_DB:
        from core.embedded_db import start_embedded_postgres

        start_embedded_postgres()

    config = _tortoise_config()
    try:
        await Tortoise.init(config=config, _enable_global_fallback=True)
    except TypeError:
        await Tortoise.init(config=config)

    conn = Tortoise.get_connection("default")

    await conn.execute_query("CREATE EXTENSION IF NOT EXISTS vector")

    if settings.EMBEDDED_DB or is_bundled():
        await _run_migrations()
    elif settings.DEBUG:
        await Tortoise.generate_schemas()

    try:
        await conn.execute_query("""
            CREATE INDEX IF NOT EXISTS idx_person_embeddings_vector
            ON person_embeddings USING hnsw (embedding vector_cosine_ops)
        """)
    except Exception:
        pass


async def close_db():
    await Tortoise.close_connections()
