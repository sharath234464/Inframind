from typing import Optional

from pydantic import BaseModel, Field


class ResourceSimulationRequest(BaseModel):

    server_id: str

    vcpu: Optional[float] = Field(
        default=None,
        gt=0
    )

    memory: Optional[float] = Field(
        default=None,
        gt=0
    )

    disk: Optional[float] = Field(
        default=None,
        gt=0
    )

    reason: Optional[str] = None


class SimulationResourceState(BaseModel):

    vcpu: float
    memory: float
    disk: float

    cpu_utilization: float
    memory_utilization: float
    disk_utilization: float


class SimulationResult(BaseModel):

    server_id: str

    current: dict

    simulated: dict

    allocation_change: str

    utilization_change: str

    current_classification: str

    simulated_classification: str

    recommendation: str