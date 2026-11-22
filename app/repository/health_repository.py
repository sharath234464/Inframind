from datetime import datetime, timezone

from app.db_handler.mongodb import database
from app.utils.mongo_serialization import serialize_mongo


class HealthRepository:

    def __init__(self):
        self.collection = database["server_health_scores"]

    async def save(self, health_data: dict):

        health_data["created_at"] = datetime.now(
            timezone.utc
        )

        await self.collection.update_one(
            {
                "server_id": health_data["server_id"]
            },
            {
                "$set": health_data
            },
            upsert=True
        )

        return health_data

    async def find_by_server(
        self,
        server_id: str
    ):

        return serialize_mongo(await self.collection.find_one({"server_id": server_id}))

    async def find_all(self):

        cursor = self.collection.find()

        return serialize_mongo(await cursor.to_list(length=None))