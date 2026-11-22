from fastapi import APIRouter, Depends

from app.core.auth_dependency import (
    get_current_user,
    require_admin
)

from app.schemas.decision_memory_schema import (
    DecisionMemoryCreate
)

from app.service.decision_memory_service import (
    decision_memory_service
)


router = APIRouter(
    prefix="/decision-memory",
    tags=["Decision Memory"]
)


@router.post("")
async def store_decision(
    request: DecisionMemoryCreate,
    current_user: dict = Depends(
        require_admin
    )
):

    return await decision_memory_service.store_decision(
        request,
        current_user
    )


@router.get("/similar")
async def find_similar_decisions(
    issue_type: str,
    classification: str | None = None,
    current_user: dict = Depends(
        get_current_user
    )
):

    return await decision_memory_service.find_similar_decisions(
        issue_type,
        classification
    )


@router.get("")
async def get_all_decisions(
    current_user: dict = Depends(
        require_admin
    )
):

    return await decision_memory_service.get_all()