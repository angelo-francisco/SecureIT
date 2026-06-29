from tortoise import BaseDBAsyncClient

RUN_IN_TRANSACTION = True


async def upgrade(db: BaseDBAsyncClient) -> str:
    return """
        CREATE TABLE IF NOT EXISTS "users" (
    "id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    "email" VARCHAR(255) NOT NULL UNIQUE,
    "hashed_password" VARCHAR(255) NOT NULL,
    "first_name" VARCHAR(30) NOT NULL,
    "last_name" VARCHAR(30) NOT NULL,
    "phone" VARCHAR(30),
    "pin" VARCHAR(128),
    "is_active" INT NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "idx_users_email_133a6f" ON "users" ("email");
CREATE TABLE IF NOT EXISTS "cameras" (
    "id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    "name" VARCHAR(30),
    "location" VARCHAR(150),
    "status" INT DEFAULT 1,
    "connection_type" VARCHAR(1) /* LOCAL: L\nWIFI: W */,
    "connection_info" JSON,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" INT NOT NULL REFERENCES "users" ("id") ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS "notifications" (
    "id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    "title" VARCHAR(50) NOT NULL,
    "description" TEXT NOT NULL,
    "level" VARCHAR(1) NOT NULL,
    "deleted" INT NOT NULL DEFAULT 0,
    "readed" INT NOT NULL DEFAULT 0,
    "photo" VARCHAR(255),
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "camera_id" INT REFERENCES "cameras" ("id") ON DELETE CASCADE,
    "user_id" INT NOT NULL REFERENCES "users" ("id") ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS "configurations" (
    "id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    "fps" INT NOT NULL DEFAULT 15,
    "monitoring_start_time" VARCHAR(8),
    "monitoring_end_time" VARCHAR(8),
    "alert_cooldown" INT NOT NULL DEFAULT 5,
    "detect_every" INT NOT NULL DEFAULT 3,
    "allow_draw" INT NOT NULL DEFAULT 1,
    "user_id" INT NOT NULL UNIQUE REFERENCES "users" ("id") ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS "homes" (
    "id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    "number" INT NOT NULL,
    "street" VARCHAR(30) NOT NULL
);
CREATE TABLE IF NOT EXISTS "people" (
    "id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    "first_name" VARCHAR(30) NOT NULL,
    "last_name" VARCHAR(30) NOT NULL,
    "type" VARCHAR(1) NOT NULL,
    "photo" VARCHAR(255),
    "added_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "banned" INT NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS "residents" (
    "id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    "bi" VARCHAR(14) NOT NULL UNIQUE,
    "person_id" INT NOT NULL UNIQUE REFERENCES "people" ("id") ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS "resident_homes" (
    "id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    "home_id" INT NOT NULL REFERENCES "homes" ("id") ON DELETE CASCADE,
    "resident_id" INT NOT NULL REFERENCES "residents" ("id") ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS "roles" (
    "id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    "name" VARCHAR(60) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" INT NOT NULL REFERENCES "users" ("id") ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS "person_roles" (
    "id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    "field_values" JSON,
    "person_id" INT NOT NULL REFERENCES "people" ("id") ON DELETE CASCADE,
    "role_id" INT NOT NULL REFERENCES "roles" ("id") ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS "role_fields" (
    "id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    "label" VARCHAR(60) NOT NULL,
    "field_type" VARCHAR(20) NOT NULL,
    "required" INT NOT NULL DEFAULT 0,
    "options" JSON,
    "sort_order" INT NOT NULL DEFAULT 0,
    "role_id" INT NOT NULL REFERENCES "roles" ("id") ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS "visitors" (
    "id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    "type" VARCHAR(3) NOT NULL,
    "person_id" INT NOT NULL UNIQUE REFERENCES "people" ("id") ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS "visits" (
    "id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    "desc" TEXT,
    "visited_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "visitor_id" INT NOT NULL REFERENCES "visitors" ("id") ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS "visit_destinies" (
    "id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    "resident_id" INT NOT NULL REFERENCES "residents" ("id") ON DELETE CASCADE,
    "visit_id" INT NOT NULL REFERENCES "visits" ("id") ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS "workers" (
    "id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    "bi" VARCHAR(14) NOT NULL UNIQUE,
    "fields" VARCHAR(30) NOT NULL,
    "person_id" INT NOT NULL UNIQUE REFERENCES "people" ("id") ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS "worker_homes" (
    "id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    "home_id" INT NOT NULL REFERENCES "homes" ("id") ON DELETE CASCADE,
    "worker_id" INT NOT NULL REFERENCES "workers" ("id") ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS "aerich" (
    "id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    "version" VARCHAR(255) NOT NULL,
    "app" VARCHAR(100) NOT NULL,
    "content" JSON NOT NULL
);"""


async def downgrade(db: BaseDBAsyncClient) -> str:
    return """
        """


MODELS_STATE = (
    "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"
    "Nl3sTmWUUWxt14WE+9++enn8HwDrKtg="
)
