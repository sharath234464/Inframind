from fastapi import APIRouter, Depends

from app.core.auth_dependency import require_admin
from app.service.analysis_graph_service import analysis_graph_service

router = APIRouter(prefix="/recommendations", tags=["AI Recommendations"])


@router.post("/ai")
async def generate_ai_recommendations(current_admin: dict = Depends(require_admin)):
    result = await analysis_graph_service.generate_ai_analysis(force=False)
    return {
        "message": result.get("message", "AI recommendation workflow finished."),
        "total_saved": result.get("recommendations_saved", 0),
        "completed": result.get("completed", 0),
        "skipped": result.get("skipped", 0),
        "failed": result.get("failed", 0),
    }
