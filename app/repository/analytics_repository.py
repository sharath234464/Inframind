from app.db_handler.mongodb import database


class AnalyticsRepository:

    def __init__(self):
        self.collection = database["analysis_results"]

    async def get_all_records(self):

        cursor = self.collection.find(
            {}
        ).sort(
            "created_at",
            1
        )

        return await cursor.to_list(
            length=5000
        )

    async def get_server_records(
        self,
        server_id: str
    ):

        cursor = self.collection.find(
            {
                "server_id": server_id
            }
        ).sort(
            "created_at",
            1
        )

        return await cursor.to_list(
            length=1000
        )

    async def get_classification_counts(self):

        pipeline = [
            {
                "$group": {
                    "_id": "$classification",
                    "count": {
                        "$sum": 1
                    }
                }
            },
            {
                "$sort": {
                    "count": -1
                }
            }
        ]

        cursor = self.collection.aggregate(
            pipeline
        )

        return await cursor.to_list(
            length=100
        )