from fastapi import APIRouter, Depends

from app.core.auth_dependency import get_current_user

from app.schemas.dashboard_schema import DashboardResponse
from app.service.dashboard_service import dashboard_service


router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)


@router.get(
    "",
    response_model=DashboardResponse
)
async def get_dashboard(current_user: dict = Depends(get_current_user)):

    return await dashboard_service.get_dashboard()