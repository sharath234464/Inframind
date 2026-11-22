from fastapi import APIRouter, Depends

from app.core.auth_dependency import get_current_user

from app.schemas.simulation_schema import (
    ResourceSimulationRequest
)

from app.service.simulation_service import (
    simulation_service
)


router = APIRouter(
    prefix="/simulation",
    tags=["What-If Simulation"]
)


@router.post("/resource")
async def simulate_resource_change(
    request: ResourceSimulationRequest,
    current_user: dict = Depends(
        get_current_user
    )
):

    return await simulation_service.simulate(
        request
    )