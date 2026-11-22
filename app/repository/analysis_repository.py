from app.db_handler.mongodb import database


from app.db_handler.mongodb import database


class AnalysisRepository:

    def __init__(self):
        self.collection = database["analysis_results"]

    async def delete_previous_results(self):

        await self.collection.delete_many({})

    async def insert_analysis_results(
        self,
        results: list
    ):

        if results:
            await self.collection.insert_many(results)

        return len(results)

    async def get_all_results(self):

        cursor = self.collection.find(
            {},
            {
                "_id": 0
            }
        )

        return await cursor.to_list(length=None)

    async def get_all_analysis_results(self):

        cursor = self.collection.find(
            {},
            {
                "_id": 0
            }
        )

        return await cursor.to_list(length=None)

    async def update_analysis_result(
        self,
        server_id: str,
        data: dict
    ):

        await self.collection.update_one(
            {
                "server_id": server_id
            },
            {
                "$set": data
            }
        )

    async def get_analysis_result_by_server(
        self,
        server_id: str
    ):

        return await self.collection.find_one(
            {
                "server_id": server_id
            },
            {
                "_id": 0
            }
        )

    async def get_server_by_id(
        self,
        server_id: str
    ):

        return await self.collection.find_one(
            {
                "server_id": server_id
            },
            {
                "_id": 0
            }
        )


analysis_repository = AnalysisRepository()