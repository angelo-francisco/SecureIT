import sqlite3
from pathlib import Path

import sqlite_vec

BASE_DIR = Path(__file__).resolve().parent.parent.parent


def main():
    db = sqlite3.connect(BASE_DIR / "db.sqlite3")

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


if __name__ == "__main__":
    main()
