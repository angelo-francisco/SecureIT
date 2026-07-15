from tortoise import BaseDBAsyncClient


async def upgrade(db: BaseDBAsyncClient) -> str:
    return """
        CREATE TABLE IF NOT EXISTS "users" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "email" VARCHAR(255) NOT NULL UNIQUE,
    "hashed_password" VARCHAR(255) NOT NULL,
    "first_name" VARCHAR(30) NOT NULL,
    "last_name" VARCHAR(30) NOT NULL,
    "phone" VARCHAR(30),
    "pin" VARCHAR(128),
    "is_active" BOOL NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS "idx_users_email_133a6f" ON "users" ("email");
CREATE TABLE IF NOT EXISTS "cameras" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "name" VARCHAR(30),
    "location" VARCHAR(150),
    "status" BOOL,
    "connection_type" VARCHAR(1),
    "connection_info" JSONB,
    "face_recognition" BOOL NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "user_id" INT NOT NULL REFERENCES "users" ("id") ON DELETE CASCADE
);
COMMENT ON COLUMN "cameras"."connection_type" IS 'LOCAL: L\nWIFI: W';
CREATE TABLE IF NOT EXISTS "notifications" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "title" VARCHAR(50) NOT NULL,
    "description" TEXT NOT NULL,
    "level" VARCHAR(1) NOT NULL,
    "deleted" BOOL NOT NULL,
    "readed" BOOL NOT NULL,
    "photo" VARCHAR(255),
    "created_at" TIMESTAMPTZ NOT NULL,
    "camera_id" INT REFERENCES "cameras" ("id") ON DELETE CASCADE,
    "user_id" INT NOT NULL REFERENCES "users" ("id") ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS "configurations" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "fps" INT NOT NULL,
    "monitoring_start_time" VARCHAR(8),
    "monitoring_end_time" VARCHAR(8),
    "alert_cooldown" INT NOT NULL,
    "detect_every" INT NOT NULL,
    "allow_draw" BOOL NOT NULL,
    "user_id" INT NOT NULL UNIQUE REFERENCES "users" ("id") ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS "people" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "first_name" VARCHAR(30) NOT NULL,
    "last_name" VARCHAR(30) NOT NULL,
    "type" VARCHAR(1) NOT NULL,
    "photo" VARCHAR(255),
    "added_at" TIMESTAMPTZ NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "banned" BOOL NOT NULL
);
CREATE TABLE IF NOT EXISTS "person_embeddings" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "embedding" public.vector(512) NOT NULL,
    "person_id" INT NOT NULL REFERENCES "people" ("id") ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS "roles" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "name" VARCHAR(60) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL,
    "user_id" INT NOT NULL REFERENCES "users" ("id") ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS "person_roles" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "field_values" JSONB,
    "person_id" INT NOT NULL REFERENCES "people" ("id") ON DELETE CASCADE,
    "role_id" INT NOT NULL REFERENCES "roles" ("id") ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS "role_fields" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "label" VARCHAR(60) NOT NULL,
    "field_type" VARCHAR(20) NOT NULL,
    "required" BOOL NOT NULL,
    "options" JSONB,
    "sort_order" INT NOT NULL,
    "role_id" INT NOT NULL REFERENCES "roles" ("id") ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS "aerich" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "version" VARCHAR(255) NOT NULL,
    "app" VARCHAR(100) NOT NULL,
    "content" JSONB NOT NULL
);"""


async def downgrade(db: BaseDBAsyncClient) -> str:
    return """
        """
