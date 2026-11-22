from fastapi import APIRouter, Depends, HTTPException

from app.core.auth_dependency import get_current_user
from app.repository.inventory_repository import InventoryRepository
from app.service.health_score_service import (
    health_score_service
)


router = APIRouter(
    prefix="/health",
    tags=["Infrastructure Health"]
)


inventory_repository = InventoryRepository()


@router.get("/{server_id}")
async def get_server_health(
    server_id: str,
    current_user: dict = Depends(get_current_user)
):

    existing = await health_score_service.get_server_health(
        server_id
    )

    if existing:

        return existing

    server = await inventory_repository.find_by_server_id(
        server_id
    )

    if not server:

        raise HTTPException(
            status_code=404,
            detail="Server not found"
        )

    return await health_score_service.calculate_and_save(
        server
    )


@router.get("")
async def get_all_health_scores(
    current_user: dict = Depends(get_current_user)
):

    return await health_score_service.get_all_health_scores()