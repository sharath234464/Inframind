from app.db_handler.mongodb import database


class SimulationRepository:

    def __init__(self):
        self.inventory_collection = database[
            "server_inventory"
        ]

        self.golden_collection = database[
            "golden_configuration"
        ]

    async def get_server(self, server_id: str):

        return await self.inventory_collection.find_one(
            {
                "server_id": str(server_id).strip()
            },
            {
                "_id": 0
            }
        )

    async def get_golden_configuration(
        self,
        instance_type: str
    ):

        wanted = str(
            instance_type or ""
        ).strip().casefold()

        if not wanted:
            return None

        rows = await self.golden_collection.find(
            {},
            {
                "_id": 0
            }
        ).to_list(length=None)

        for row in rows:
            if str(
                row.get("instance_type", "")
            ).strip().casefold() == wanted:
                return row

        return None