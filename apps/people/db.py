import sqlite3
from pathlib import Path

import sqlite_vec

BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATABASE_DIR = BASE_DIR / "db.sqlite3"


_db_connection = None

def get_conn():
    global _db_connection
    if _db_connection is None:
        _db_connection = sqlite3.connect(DATABASE_DIR, check_same_thread=False)
        try:
            _db_connection.enable_load_extension(True)
            sqlite_vec.load(_db_connection)
            _db_connection.enable_load_extension(False)
        except AttributeError:
            print("Extensões SQLite não suportadas neste ambiente")
    return _db_connection


def insert_person_embedding(person, embedding):
    db = get_conn()
    db.execute(
        """
        INSERT INTO PersonEmbedding (person, embedding) VALUES (?, ?)
        """,
        (person, embedding),
    )
    db.commit()



def search_person_by_embedding(embedding, k=1):
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
    return rows


def main():
    db = get_conn()
    db.execute(
        """
        CREATE VIRTUAL TABLE IF NOT EXISTS PersonEmbedding 
        USING vec0(
            id_person_embedding INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
            person INTEGER NOT NULL
                REFERENCES people_person (id),
            embedding FLOAT[512]
        )
        """
    )
    db.commit()


if __name__ == "__main__":
    main()
