from fastapi import APIRouter, Depends

from app.core.auth_dependency import require_admin
from app.repository.golden_repository import golden_repository

router = APIRouter(prefix="/golden", tags=["Golden Configuration"])


@router.get("")
async def get_golden_configurations(current_admin: dict = Depends(require_admin)):
    """Read the existing approved baseline collection without modifying it."""
    return await golden_repository.get_all_golden_configurations()
