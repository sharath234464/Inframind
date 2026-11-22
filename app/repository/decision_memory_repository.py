from datetime import datetime, timezone

from app.db_handler.mongodb import database


class DecisionMemoryRepository:

    def __init__(self):

        self.collection = database[
            "decision_memory"
        ]

    async def create(
        self,
        memory_data: dict
    ):

        memory_data["created_at"] = (
            datetime.now(timezone.utc)
        )

        result = await self.collection.insert_one(
            memory_data
        )

        memory_data["_id"] = result.inserted_id

        return memory_data

    async def find_similar(
        self,
        issue_type: str,
        classification: str | None = None
    ):

        query = {
            "issue_type": issue_type
        }

        if classification:

            query["classification"] = (
                classification
            )

        cursor = self.collection.find(
            query
        ).sort(
            "created_at",
            -1
        )

        return await cursor.to_list(
            length=20
        )

    async def find_all(self):

        cursor = self.collection.find().sort(
            "created_at",
            -1
        )

        return await cursor.to_list(
            length=None
        )