from datetime import datetime, timezone

from app.db_handler.mongodb import database


class RequestRepository:

    def __init__(self):
        self.collection = database["infrastructure_requests"]

    async def create(self, request_data: dict):

        now = datetime.now(timezone.utc)

        request_data["created_at"] = now
        request_data["updated_at"] = now

        result = await self.collection.insert_one(
            request_data
        )

        request_data["_id"] = result.inserted_id

        return request_data

    async def find_by_id(self, request_id):

        return await self.collection.find_one(
            {"request_id": request_id}
        )

    async def find_by_user(self, user_id):

        cursor = self.collection.find(
            {"requested_by": user_id}
        ).sort(
            "created_at",
            -1
        )

        return await cursor.to_list(
            length=None
        )

    async def find_all(self, status=None):

        query = {}

        if status:
            query["status"] = status

        cursor = self.collection.find(
            query
        ).sort(
            "created_at",
            -1
        )

        return await cursor.to_list(
            length=None
        )

    async def update_status(
        self,
        request_id: str,
        status: str,
        updated_data: dict | None = None
    ):

        update = {
            "status": status,
            "updated_at": datetime.now(timezone.utc)
        }

        if updated_data:
            update.update(updated_data)

        result = await self.collection.update_one(
            {"request_id": request_id},
            {"$set": update}
        )

        return result.modified_count > 0