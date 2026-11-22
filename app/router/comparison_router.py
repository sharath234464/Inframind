from fastapi import APIRouter, Depends

from app.core.auth_dependency import require_admin

from app.schemas.comparison_schema import ComparisonResponse
from app.service.comparison_service import comparison_service

router = APIRouter(
    prefix="/comparison",
    tags=["Comparison"]
)


@router.post(
    "/run",
    response_model=ComparisonResponse
)
async def compare_servers(current_admin: dict = Depends(require_admin)):

    return await comparison_service.compare_servers()