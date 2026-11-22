from typing import Optional

from pydantic import BaseModel


class HealthScoreResponse(BaseModel):
    server_id: str
    health_score: float
    risk_level: str
    risk_factors: list[str]
    recommendation: Optional[str] = None