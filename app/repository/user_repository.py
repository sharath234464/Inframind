from datetime import datetime, timezone

from app.db_handler.mongodb import database


class UserRepository:

    def __init__(self):
        self.collection = database["users"]

    async def create_user(self, user_data: dict):

        user_data["created_at"] = datetime.now(timezone.utc)
        user_data["updated_at"] = datetime.now(timezone.utc)

        result = await self.collection.insert_one(user_data)

        user_data["_id"] = result.inserted_id

        return user_data

    async def find_by_email(self, email: str):

        return await self.collection.find_one(
            {"email": email.lower().strip()}
        )

    async def find_by_id(self, user_id):

        return await self.collection.find_one(
            {"_id": user_id}
        )