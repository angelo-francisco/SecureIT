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


def insert_person_embedding(person, embedding):
    db = get_conn()
    db.execute(
        """
        INSERT INTO PersonEmbedding (person, embedding) VALUES (?, ?)
        """,
        (person, embedding),
    )
    db.commit()
    db.close()


def search_person_by_embedding(embedding, k=10):
    db = get_conn()
    cursor = db.cursor()
    cursor.execute(
        """
        SELECT PP.id, PP.first_name, PP.last_name, PP.type, PP.banned, PE.distance
        FROM PersonEmbedding AS PE
        INNER JOIN people_person AS PP ON PE.person = PP.id
        WHERE PE.embedding MATCH ? AND k = ?
        ORDER BY PE.distance;
        """,
        (embedding, k),
    )
    rows = cursor.fetchall()
    db.close()
    return rows


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
    db.commit()
    db.close()
    print("TABELA VIRTUAL CONFERIDA")


if __name__ == "__main__":
    main()
