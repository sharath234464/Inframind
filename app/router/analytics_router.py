from fastapi import APIRouter, Depends, HTTPException

from app.core.auth_dependency import (
    get_current_user
)

from app.service.analytics_service import (
    analytics_service
)


router = APIRouter(
    prefix="/analytics",
    tags=["Infrastructure Analytics"]
)


@router.get("/summary")
async def get_analytics_summary(
    current_user: dict = Depends(
        get_current_user
    )
):

    return await analytics_service.get_summary()


@router.get(
    "/server/{server_id}"
)
async def get_server_analytics(
    server_id: str,
    current_user: dict = Depends(
        get_current_user
    )
):

    result = (
        await analytics_service
        .get_server_analytics(
            server_id
        )
    )

    if not result:

        raise HTTPException(
            status_code=404,
            detail=(
                "No analytics found "
                "for this server"
            )
        )

    return result