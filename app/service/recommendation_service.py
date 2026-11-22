from fastapi import HTTPException

from app.repository.recommendation_repository import recommendation_repository

from app.schemas.recommendation_schema import RecommendationResponse


class RecommendationService:

    async def generate_recommendations(
        self
    ) -> RecommendationResponse:

        analysis_results = (
            await recommendation_repository.get_analysis_results()
        )

        if not analysis_results:
            raise HTTPException(
                status_code=400,
                detail="No saved analysis results are available. Run a successful comparison first; existing recommendations were left unchanged.",
            )

        recommendations = []

        for server in analysis_results:

            recommendation, priority, reason = (
                self.get_recommendation(
                    server["classification"]
                )
            )

            recommendations.append(
                {
                    "server_id": server["server_id"],

                    "classification": server["classification"],

                    "recommendation": recommendation,

                    "priority": priority,

                    "reason": reason
                }
            )

        await recommendation_repository.delete_previous_recommendations()

        generated = (
            await recommendation_repository.insert_recommendations(
                recommendations
            )
        )

        return RecommendationResponse(
            status=True,
            message="Recommendations generated successfully.",
            generated_recommendations=generated
        )

    def get_recommendation(
        self,
        classification: str
    ):

        if classification == "Compliant":

            return (
                "No action required.",
                "Low",
                "Server configuration matches the golden configuration."
            )

        if classification == "Over Allocated & Under Utilized":

            return (
                "Reduce CPU and Memory.",
                "High",
                "Resources are over-provisioned while utilization is low."
            )

        if classification == "Over Allocated & Properly Utilized":

            return (
                "Monitor before downsizing.",
                "Medium",
                "Server is properly utilized but allocated resources exceed the golden configuration."
            )

        if classification == "Under Allocated & Over Utilized":

            return (
                "Increase CPU and Memory.",
                "Critical",
                "Current utilization exceeds the target range."
            )

        if classification == "Under Allocated & Under Utilized":

            return (
                "Review workload and server sizing.",
                "Medium",
                "Allocated resources are below the recommendation and utilization is also low."
            )

        if classification == "Over Allocated & Over Utilized":

            return (
                "Investigate workload before resizing.",
                "High",
                "Resources exceed the golden configuration but utilization is still high."
            )

        return (
            "Manual assessment required.",
            "Medium",
            "Further infrastructure analysis is recommended."
        )

    async def get_all_recommendations(
        self
    ):

        return await recommendation_repository.get_all_recommendations()

    async def get_recommendation_by_server(
        self,
        server_id: str
    ):

        return await recommendation_repository.get_recommendation_by_server(
            server_id
        )


recommendation_service = RecommendationService()