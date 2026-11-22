from pydantic import BaseModel


class RecommendationResponse(BaseModel):

    status: bool

    message: str

    generated_recommendations: int