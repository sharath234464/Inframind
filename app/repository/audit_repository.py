from datetime import datetime, timezone

from app.db_handler.mongodb import database


class AuditRepository:

    def __init__(self):
        self.collection = database["audit_logs"]

    async def create(self, audit_log: dict):

        audit_log["created_at"] = datetime.now(timezone.utc)

        result = await self.collection.insert_one(
            audit_log
        )

        audit_log["_id"] = result.inserted_id

        return audit_log

    async def find_all(self):

        cursor = self.collection.find().sort(
            "created_at",
            -1
        )

        return await cursor.to_list(
            length=500
        )

    async def find_by_user(
        self,
        user_id: str
    ):

        cursor = self.collection.find(
            {
                "user_id": user_id
            }
        ).sort(
            "created_at",
            -1
        )

        return await cursor.to_list(
            length=200
        )

    async def find_by_entity(
        self,
        entity_type: str,
        entity_id: str
    ):

        cursor = self.collection.find(
            {
                "entity_type": entity_type,
                "entity_id": entity_id
            }
        ).sort(
            "created_at",
            -1
        )

        return await cursor.to_list(
            length=200
        )