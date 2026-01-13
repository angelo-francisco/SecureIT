import sqlite3
from pathlib import Path

import sqlite_vec

BASE_DIR = Path(__file__).resolve().parent.parent.parent
DB_DIR = BASE_DIR / "db.sqlite3"


def main():
    db = sqlite3.connect(DB_DIR)

    db.enable_load_extension(True)
    sqlite_vec.load(db)
    db.enable_load_extension(False)

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
