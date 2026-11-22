from app.db_handler.mongodb import database


class AIRecommendationRepository:

    def __init__(self):
        self.collection = database["ai_recommendations"]

    async def delete_previous_recommendations(self):
        await self.collection.delete_many({})

    async def save_recommendations(self, recommendations: list):
        if recommendations:
            await self.collection.insert_many(recommendations)

        return len(recommendations)

    async def get_all_recommendations(self):
        cursor = self.collection.find(
            {},
            {
                "_id": 0
            }
        )

        return await cursor.to_list(length=None)


ai_recommendation_repository = AIRecommendationRepository()