from fastapi import APIRouter, Depends

from app.core.auth_dependency import (
    get_current_user
)

from app.service.operations_service import (
    operations_service
)


router = APIRouter(
    prefix="/operations",
    tags=["Operations Dashboard"]
)


@router.get("/summary")
async def get_operations_summary(
    current_user: dict = Depends(
        get_current_user
    )
):

    return await operations_service.get_summary()