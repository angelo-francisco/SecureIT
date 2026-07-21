from tortoise import Tortoise

from core.config import settings

TORTOISE_MODELS = [
    "apps.control.models",
    "apps.cameras.models",
    "apps.face_detection.models",
    "apps.notifications.models",
    "apps.panel.models",
    "apps.people.models",
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


async def init_db():
    kwargs = dict(
        db_url=settings.DATABASE_URL,
        modules={"models": TORTOISE_MODELS},
    )
    try:
        await Tortoise.init(**kwargs, _enable_global_fallback=True)
    except TypeError:
        await Tortoise.init(**kwargs)

    conn = Tortoise.get_connection("default")

    await conn.execute_query("CREATE EXTENSION IF NOT EXISTS vector")

    await conn.execute_query("""
        CREATE INDEX IF NOT EXISTS idx_person_embeddings_vector
        ON person_embeddings USING hnsw (embedding vector_cosine_ops)
    """)

    if settings.DEBUG:
        await Tortoise.generate_schemas()


async def close_db():
    await Tortoise.close_connections()
