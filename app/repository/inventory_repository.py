from typing import List

from app.db_handler.mongodb import database


class InventoryRepository:

    def __init__(self):
        self.collection = database["server_inventory"]

    async def insert_inventory(
        self,
        inventory: List[dict]
    ):

        result = await self.collection.insert_many(inventory)

        return len(result.inserted_ids)

    async def get_existing_server_ids(
        self,
        server_ids: list[str]
    ):

        existing_servers = await self.collection.find(
            {
                "server_id": {
                    "$in": server_ids
                }
            },
            {
                "_id": 0,
                "server_id": 1
            }
        ).to_list(length=None)

        return [
            server["server_id"]
            for server in existing_servers
        ]
    async def get_all_inventory(self):
        return await self.collection.find(
            {},
            {
                "_id":0
            }
        ).to_list(length=None)

    async def find_by_server_id(self, server_id: str):
        return await self.collection.find_one(
            {"server_id": server_id},
            {"_id": 0}
        )


inventory_repository = InventoryRepository()