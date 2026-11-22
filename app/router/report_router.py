from fastapi import APIRouter, Depends

from app.core.auth_dependency import get_current_user

from app.schemas.report_schema import ReportResponse

from app.service.report_service import report_service


router = APIRouter(
    prefix="/reports",
    tags=["Reports"]
)


@router.get(
    "",
    response_model=ReportResponse
)
async def generate_report(current_user: dict = Depends(get_current_user)):

    return await report_service.generate_report()