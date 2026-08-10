import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from tortoise import Tortoise

from core.config import settings
from core.database import after_db_startup, db_error_hint
from core.embedded_db import stop_embedded_postgres

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    if settings.EMBEDDED_DB:
        from core.embedded_db import start_embedded_postgres

        start_embedded_postgres()

    try:
        await after_db_startup()
    except Exception as exc:  # noqa
        logger.exception("Database startup failed")
        await Tortoise.close_connections()
        stop_embedded_postgres()
        raise RuntimeError(db_error_hint(exc)) from exc

    try:
        yield
    finally:
        await Tortoise.close_connections()
        stop_embedded_postgres()
