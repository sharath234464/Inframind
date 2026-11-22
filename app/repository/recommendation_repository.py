from typing import List

from app.db_handler.mongodb import database


class RecommendationRepository:
    def __init__(self):
        self.analysis_collection = database["analysis_results"]
        self.recommendation_collection = database["recommendations"]

    async def get_analysis_results(self):
        return await self.analysis_collection.find({}, {"_id": 0}).to_list(length=None)

    async def insert_recommendations(self, recommendations: List[dict]):
        if not recommendations:
            return 0
        result = await self.recommendation_collection.insert_many(recommendations)
        return len(result.inserted_ids)

    async def replace_recommendations(self, recommendations: List[dict]):
        await self.recommendation_collection.delete_many({})
        return await self.insert_recommendations(recommendations)

    async def delete_previous_recommendations(self):
        await self.recommendation_collection.delete_many({})

    async def get_all_recommendations(self):
        return await self.recommendation_collection.find({}, {"_id": 0}).to_list(length=None)

    async def get_recommendation_by_server(self, server_id: str):
        return await self.recommendation_collection.find_one({"server_id": server_id}, {"_id": 0})


recommendation_repository = RecommendationRepository()
