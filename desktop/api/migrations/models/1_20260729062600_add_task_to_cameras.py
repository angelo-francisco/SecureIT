from tortoise import BaseDBAsyncClient


async def upgrade(db: BaseDBAsyncClient) -> str:
    return """
        ALTER TABLE "cameras"
        ADD COLUMN IF NOT EXISTS "task" VARCHAR(2) DEFAULT 'D';
        COMMENT ON COLUMN "cameras"."task" IS 'DETECTION: D
FACE_RECOGNITION: FR
BEHAVIOUR_ANALYSIS: BA';
    """


async def downgrade(db: BaseDBAsyncClient) -> str:
    return """
        ALTER TABLE "cameras" DROP COLUMN IF EXISTS "task";
    """
