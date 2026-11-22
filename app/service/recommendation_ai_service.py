from openai import AsyncOpenAI

from app.core.config import settings
from app.prompt.recommendation_prompt import RECOMMENDATION_PROMPT


class RecommendationAIService:
    def __init__(self):
        self.client = (
            AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
            if settings.OPENAI_API_KEY
            else None
        )

    async def generate_recommendation(self, state):
        if self.client is None:
            raise RuntimeError(
                "OPENAI_API_KEY is not configured. Add it to the backend .env file."
            )

        server = state["server"]
        golden_server = state["golden_server"]

        prompt = RECOMMENDATION_PROMPT.format(
            server_id=server["server_id"],
            allocation_status=state["allocation_status"],
            utilization_status=state["utilization_status"],
            classification=state["classification"],
            compliance_status=state["compliance_status"],
            actual_vcpu=server["vcpu"],
            actual_memory=server["memory"],
            actual_disk=server["disk"],
            golden_vcpu=golden_server["vcpu"],
            golden_memory=golden_server["memory"],
            golden_disk=golden_server["disk"],
        )

        response = await self.client.responses.create(
            model=settings.MODEL_NAME or "gpt-4.1-mini",
            input=prompt,
        )
        return (response.output_text or "").strip()


recommendation_ai_service = RecommendationAIService()
