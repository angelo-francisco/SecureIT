import asyncio

from fastapi import FastAPI
from tortoise.contrib.fastapi import register_tortoise

from core.config import settings
from core.database import get_tortoise_config


def bootstrap_database(app: FastAPI) -> None:
    if settings.EMBEDDED_DB:
        from core.embedded_db import (
            start_embedded_postgres,
            wait_for_embedded_postgres,
        )

        start_embedded_postgres()
        asyncio.run(wait_for_embedded_postgres())

    register_tortoise(app, config=get_tortoise_config(), generate_schemas=False, add_exception_handlers=True,)
