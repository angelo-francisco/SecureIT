import sqlite3
from pathlib import Path

import sqlite_vec

BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATABASE_DIR = BASE_DIR / "db.sqlite3"


def get_conn():
    db = sqlite3.connect(DATABASE_DIR)
    db.enable_load_extension(True)
    sqlite_vec.load(db)
    db.enable_load_extension(False)
    return db


def main():
    db = get_conn()
    db.execute(
        """
        CREATE VIRTUAL TABLE IF NOT EXISTS PersonEmbedding 
        USING vec0(
            person INTEGER,
            embedding FLOAT[512]
        )
        """
    )
    db.close()
    print("TABELA VIRTUAL CONFERIDA")


if __name__ == "__main__":
    main()
