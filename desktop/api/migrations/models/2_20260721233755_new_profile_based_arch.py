from tortoise import BaseDBAsyncClient

RUN_IN_TRANSACTION = True


async def upgrade(db: BaseDBAsyncClient) -> str:
    return """
        ALTER TABLE "roles" DROP CONSTRAINT IF EXISTS "fk_roles_users_2f19a6db";
        ALTER TABLE "configurations" DROP CONSTRAINT IF EXISTS "fk_configur_users_4bf7591b";
        ALTER TABLE "notifications" DROP CONSTRAINT IF EXISTS "fk_notifica_users_ca29871f";
        ALTER TABLE "cameras" DROP CONSTRAINT IF EXISTS "fk_cameras_users_b3e36ccf";
        CREATE TABLE IF NOT EXISTS "profiles" (
    "profile_id" VARCHAR(255) NOT NULL PRIMARY KEY,
    "user_id" VARCHAR(255) NOT NULL,
    "isAdmin" BOOL NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS "idx_profiles_user_id_a414dd" ON "profiles" ("user_id");
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
        ALTER TABLE "cameras" ADD "profile_id" VARCHAR(255) NOT NULL;
        ALTER TABLE "cameras" DROP COLUMN "user_id";
        ALTER TABLE "notifications" ADD "profile_id" VARCHAR(255) NOT NULL;
        ALTER TABLE "notifications" DROP COLUMN "user_id";
        ALTER TABLE "configurations" ADD "profile_id" VARCHAR(255) NOT NULL UNIQUE;
        ALTER TABLE "configurations" DROP COLUMN "user_id";
        ALTER TABLE "roles" DROP COLUMN "user_id";
        DROP TABLE IF EXISTS "users";
        ALTER TABLE "cameras" ADD CONSTRAINT "fk_cameras_profiles_a0b8323b" FOREIGN KEY ("profile_id") REFERENCES "profiles" ("profile_id") ON DELETE CASCADE;
        ALTER TABLE "notifications" ADD CONSTRAINT "fk_notifica_profiles_3f960fca" FOREIGN KEY ("profile_id") REFERENCES "profiles" ("profile_id") ON DELETE CASCADE;
        ALTER TABLE "configurations" ADD CONSTRAINT "fk_configur_profiles_b35940d0" FOREIGN KEY ("profile_id") REFERENCES "profiles" ("profile_id") ON DELETE CASCADE;"""


async def downgrade(db: BaseDBAsyncClient) -> str:
    return """
        ALTER TABLE "configurations" DROP CONSTRAINT IF EXISTS "fk_configur_profiles_b35940d0";
        ALTER TABLE "notifications" DROP CONSTRAINT IF EXISTS "fk_notifica_profiles_3f960fca";
        ALTER TABLE "cameras" DROP CONSTRAINT IF EXISTS "fk_cameras_profiles_a0b8323b";
        ALTER TABLE "roles" ADD "user_id" INT NOT NULL;
        ALTER TABLE "cameras" ADD "user_id" INT NOT NULL;
        ALTER TABLE "cameras" DROP COLUMN "profile_id";
        ALTER TABLE "notifications" ADD "user_id" INT NOT NULL;
        ALTER TABLE "notifications" DROP COLUMN "profile_id";
        ALTER TABLE "configurations" ADD "user_id" INT NOT NULL UNIQUE;
        ALTER TABLE "configurations" DROP COLUMN "profile_id";
        DROP TABLE IF EXISTS "face_detections";
        DROP TABLE IF EXISTS "profiles";
        ALTER TABLE "roles" ADD CONSTRAINT "fk_roles_users_2f19a6db" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE;
        ALTER TABLE "cameras" ADD CONSTRAINT "fk_cameras_users_b3e36ccf" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE;
        ALTER TABLE "notifications" ADD CONSTRAINT "fk_notifica_users_ca29871f" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE;
        ALTER TABLE "configurations" ADD CONSTRAINT "fk_configur_users_4bf7591b" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE;"""


MODELS_STATE = (
    "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"
    "uII5ONfNiq0d6FE7vRa8ibTmbP/wOMmccY"
)
