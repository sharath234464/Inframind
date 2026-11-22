from fastapi import APIRouter, Depends

from app.core.auth_dependency import require_admin

from app.service.analysis_graph_service import analysis_graph_service

router = APIRouter(
    prefix="/analysis",
    tags=["Analysis AI"]
)


@router.post("/generate")
async def generate_ai_analysis(current_admin: dict = Depends(require_admin)):

    return await analysis_graph_service.generate_ai_analysis()