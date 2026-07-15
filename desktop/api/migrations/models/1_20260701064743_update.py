from tortoise import BaseDBAsyncClient


async def upgrade(db: BaseDBAsyncClient) -> str:
    return """
        ALTER TABLE "people" DROP COLUMN "type";"""


async def downgrade(db: BaseDBAsyncClient) -> str:
    return """
        ALTER TABLE "people" ADD "type" VARCHAR(1)NOT NULL;"""
