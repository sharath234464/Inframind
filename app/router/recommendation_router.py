from fastapi import APIRouter, Depends

from app.core.auth_dependency import get_current_user, require_admin

from app.schemas.recommendation_schema import RecommendationResponse
from app.service.recommendation_service import recommendation_service


router = APIRouter(
    prefix="/recommendations",
    tags=["Recommendations"]
)


@router.post(
    "/generate",
    response_model=RecommendationResponse
)
async def generate_recommendations(current_admin: dict = Depends(require_admin)):

    return await recommendation_service.generate_recommendations()


@router.get("")
async def get_all_recommendations(current_user: dict = Depends(get_current_user)):

    return await recommendation_service.get_all_recommendations()


@router.get("/{server_id}")
async def get_recommendation(
    server_id: str,
    current_user: dict = Depends(get_current_user),
):

    return await recommendation_service.get_recommendation_by_server(
        server_id
    )