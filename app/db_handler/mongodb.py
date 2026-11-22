from motor.motor_asyncio import AsyncIOMotorClient

from app.core.config import settings

# One shared client for the whole application. This connects to the configured
# database; it does not drop, recreate, or clear any existing collections.
client = AsyncIOMotorClient(
    settings.MONGODB_URL,
    serverSelectionTimeoutMS=5000,
)
database = client[settings.DATABASE_NAME]


async def initialize_database() -> None:
    """Verify connectivity without changing existing database contents."""
    await client.admin.command("ping")


async def close_database() -> None:
    client.close()
