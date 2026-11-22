from fastapi import APIRouter, Depends

from app.core.auth_dependency import (
    get_current_user,
    require_admin
)

from app.service.audit_service import audit_service


router = APIRouter(
    prefix="/audit",
    tags=["Audit"]
)


@router.get("")
async def get_audit_logs(
    current_user: dict = Depends(require_admin)
):

    return await audit_service.get_all()


@router.get("/mine")
async def get_my_audit_history(
    current_user: dict = Depends(get_current_user)
):

    user_id = current_user["sub"]

    return await audit_service.get_user_history(
        user_id
    )


@router.get(
    "/entity/{entity_type}/{entity_id}"
)
async def get_entity_audit_history(
    entity_type: str,
    entity_id: str,
    current_user: dict = Depends(require_admin)
):

    return await audit_service.get_entity_history(
        entity_type,
        entity_id
    )