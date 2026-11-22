from fastapi import APIRouter, Depends

from app.core.auth_dependency import require_admin


router = APIRouter(
    prefix="/admin",
    tags=["Admin"]
)


@router.get("/test")
async def admin_test(
    current_admin=Depends(require_admin)
):
    return {
        "message": "Admin access successful",
        "user_id": current_admin.get("sub"),
        "role": current_admin.get("role")
    }