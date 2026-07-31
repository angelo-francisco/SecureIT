from tortoise import BaseDBAsyncClient

RUN_IN_TRANSACTION = True


async def upgrade(db: BaseDBAsyncClient) -> str:
    return """
        CREATE TABLE IF NOT EXISTS "profiles" (
    "profile_id" VARCHAR(255) NOT NULL PRIMARY KEY,
    "user_id" VARCHAR(255) NOT NULL,
    "isAdmin" BOOL NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS "idx_profiles_user_id_a414dd" ON "profiles" ("user_id");
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
    "profile_id" VARCHAR(255) NOT NULL REFERENCES "profiles" ("profile_id") ON DELETE CASCADE
);
COMMENT ON COLUMN "cameras"."connection_type" IS 'LOCAL: L
WIFI: W';
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


MODELS_STATE = (
    "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"
)
