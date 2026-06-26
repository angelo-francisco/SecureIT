import sqlite3

import sqlite_vec
from core.config import settings
from tortoise import Tortoise

TORTOISE_MODELS = [
    "apps.auth.models",
    "apps.cameras.models",
    "apps.notifications.models",
    "apps.panel.models",
    "apps.people.models",
    "aerich.models",
]


async def init_db():
    kwargs = dict(
        db_url=settings.DATABASE_URL,
        modules={"models": TORTOISE_MODELS},
    )
    try:
        await Tortoise.init(**kwargs, _enable_global_fallback=True)
    except TypeError:
        await Tortoise.init(**kwargs)

    if settings.DEBUG:
        await Tortoise.generate_schemas()


async def close_db():
    await Tortoise.close_connections()


def init_vec_db():
    db_path = settings.DATABASE_PATH
    conn = sqlite3.connect(db_path)
    conn.enable_load_extension(True)
    sqlite_vec.load(conn)
    conn.enable_load_extension(False)
    conn.execute(
        """
        CREATE VIRTUAL TABLE IF NOT EXISTS PersonEmbedding 
        USING vec0(
            id_person_embedding INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
            person INTEGER NOT NULL,
            embedding FLOAT[512]
        )
        """
    )
    conn.commit()
    conn.close()
    print("PersonEmbedding table ready.")


if __name__ == "__main__":
    init_vec_db()
