from typing import Optional

from pydantic import BaseModel, Field


class GoldenGenerationRequest(BaseModel):

    instance_type: Optional[str] = None

    minimum_healthy_servers: int = Field(
        default=5,
        ge=1
    )


class GoldenConfigurationSuggestion(BaseModel):

    instance_type: str

    vcpu: float

    memory: float

    disk: float

    target_cpu_utilization_min: float

    target_cpu_utilization_max: float

    target_memory_utilization_min: float

    target_memory_utilization_max: float

    source_server_count: int

    status: str

    ai_reasoning: Optional[str] = None