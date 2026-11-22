from datetime import datetime, timezone

from app.db_handler.mongodb import database


class RemediationRepository:

    def __init__(self):
        self.collection = database[
            "remediation_plans"
        ]

    async def create(self, plan: dict):

        plan["created_at"] = datetime.now(
            timezone.utc
        )

        await self.collection.insert_one(plan)

        return plan

    async def find_by_id(
        self,
        remediation_id: str
    ):

        return await self.collection.find_one(
            {
                "remediation_id": remediation_id
            }
        )

    async def find_by_server(
        self,
        server_id: str
    ):

        cursor = self.collection.find(
            {
                "server_id": server_id
            }
        ).sort(
            "created_at",
            -1
        )

        return await cursor.to_list(
            length=100
        )

    async def find_all(self):

        cursor = self.collection.find().sort(
            "created_at",
            -1
        )

        return await cursor.to_list(
            length=500
        )

    async def update_status(
        self,
        remediation_id: str,
        status: str
    ):

        await self.collection.update_one(
            {
                "remediation_id": remediation_id
            },
            {
                "$set": {
                    "status": status,
                    "updated_at": datetime.now(
                        timezone.utc
                    )
                }
            }
        )

        return await self.find_by_id(
            remediation_id
        )