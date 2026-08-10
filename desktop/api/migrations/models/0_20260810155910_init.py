from tortoise import BaseDBAsyncClient


async def upgrade(db: BaseDBAsyncClient) -> str:
    return """
        CREATE TABLE IF NOT EXISTS "profiles" (
    "profile_id" VARCHAR(255) NOT NULL PRIMARY KEY,
    "user_id" VARCHAR(255) NOT NULL,
    "isAdmin" BOOL NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "uid_profiles_user_id_3ea856" UNIQUE ("user_id", "profile_id")
);
CREATE TABLE IF NOT EXISTS "cameras" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "name" VARCHAR(30),
    "location" VARCHAR(150),
    "status" BOOL,
    "connection_type" VARCHAR(1),
    "connection_info" JSONB,
    "task" VARCHAR(2),
    "face_recognition" BOOL NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "profile_id" VARCHAR(255) NOT NULL REFERENCES "profiles" ("profile_id") ON DELETE CASCADE
);
COMMENT ON COLUMN "cameras"."connection_type" IS 'LOCAL: L\nWIFI: W';
COMMENT ON COLUMN "cameras"."task" IS 'DETECTION: D\nFACE_RECOGNITION: FR\nBEHAVIOUR_ANALYSIS: BA';
CREATE TABLE IF NOT EXISTS "face_detections" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "person_id" INT,
    "name" VARCHAR(255),
    "unknown" BOOL NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "camera_name" VARCHAR(255),
    "photo" VARCHAR(255),
    "created_at" TIMESTAMPTZ NOT NULL,
    "camera_id" INT REFERENCES "cameras" ("id") ON DELETE CASCADE,
    "profile_id" VARCHAR(255) NOT NULL REFERENCES "profiles" ("profile_id") ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS "configurations" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "fps" INT NOT NULL,
    "monitoring_start_time" VARCHAR(8),
    "monitoring_end_time" VARCHAR(8),
    "alert_cooldown" INT NOT NULL,
    "detect_every" INT NOT NULL,
    "allow_draw" BOOL NOT NULL,
    "profile_id" VARCHAR(255) NOT NULL UNIQUE REFERENCES "profiles" ("profile_id") ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS "people" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "first_name" VARCHAR(30) NOT NULL,
    "last_name" VARCHAR(30) NOT NULL,
    "photo" VARCHAR(255),
    "added_at" TIMESTAMPTZ NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "banned" BOOL NOT NULL
);
CREATE TABLE IF NOT EXISTS "notifications" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "title" VARCHAR(50) NOT NULL,
    "description" TEXT NOT NULL,
    "level" VARCHAR(1) NOT NULL,
    "deleted" BOOL NOT NULL,
    "photo" VARCHAR(255),
    "created_at" TIMESTAMPTZ NOT NULL,
    "camera_id" INT REFERENCES "cameras" ("id") ON DELETE CASCADE,
    "person_id" INT REFERENCES "people" ("id") ON DELETE CASCADE,
    "profile_id" VARCHAR(255) NOT NULL REFERENCES "profiles" ("profile_id") ON DELETE CASCADE
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
    "created_at" TIMESTAMPTZ NOT NULL
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
CREATE TABLE IF NOT EXISTS "audit_logs" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "profile_id" VARCHAR(255),
    "action" VARCHAR(10) NOT NULL,
    "entity_type" VARCHAR(30) NOT NULL,
    "entity_id" VARCHAR(255) NOT NULL,
    "synced" BOOL NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS "idx_audit_logs_profile_eb1b3f" ON "audit_logs" ("profile_id");
CREATE INDEX IF NOT EXISTS "idx_audit_logs_entity__893447" ON "audit_logs" ("entity_type");
CREATE TABLE IF NOT EXISTS "licenses" (
    "id" UUID NOT NULL PRIMARY KEY,
    "license_id" VARCHAR(255) NOT NULL UNIQUE,
    "user_id" VARCHAR(255) NOT NULL,
    "license_key" VARCHAR(30) NOT NULL,
    "license_type" VARCHAR(20) NOT NULL,
    "activated_at" TIMESTAMPTZ NOT NULL,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "last_validated_at" TIMESTAMPTZ,
    "hardware_fingerprint" VARCHAR(255) NOT NULL,
    "signed_payload" TEXT NOT NULL,
    "public_key" TEXT NOT NULL,
    "signature" TEXT NOT NULL,
    "max_cameras" INT NOT NULL,
    "max_people" INT NOT NULL,
    "features" JSONB NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS "idx_licenses_user_id_0b4512" ON "licenses" ("user_id");
CREATE TABLE IF NOT EXISTS "aerich" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "version" VARCHAR(255) NOT NULL,
    "app" VARCHAR(100) NOT NULL,
    "content" JSONB NOT NULL
);"""


async def downgrade(db: BaseDBAsyncClient) -> str:
    return """
        """
