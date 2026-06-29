from tortoise import BaseDBAsyncClient

RUN_IN_TRANSACTION = True


async def upgrade(db: BaseDBAsyncClient) -> str:
    return """
        ALTER TABLE "cameras" ADD "face_recognition" INT NOT NULL DEFAULT 0;"""


async def downgrade(db: BaseDBAsyncClient) -> str:
    return """
        ALTER TABLE "cameras" DROP COLUMN "face_recognition";"""


MODELS_STATE = (
    "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"
)
