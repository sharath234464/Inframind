from fastapi import APIRouter, Depends, HTTPException

from app.core.auth_dependency import get_current_user
from app.service.alert_service import alert_service


router = APIRouter(
    prefix="/alerts",
    tags=["Alerts"]
)


@router.get("")
async def get_alerts(
    current_user: dict = Depends(get_current_user)
):

    return await alert_service.get_all_alerts()


@router.get("/{alert_id}")
async def get_alert(
    alert_id: str,
    current_user: dict = Depends(get_current_user)
):

    alert = await alert_service.get_alert(alert_id)

    if not alert:
        raise HTTPException(
            status_code=404,
            detail="Alert not found"
        )

    return alert


@router.get("/server/{server_id}")
async def get_server_alerts(
    server_id: str,
    current_user: dict = Depends(get_current_user)
):

    return await alert_service.get_server_alerts(
        server_id
    )


@router.post("/{alert_id}/resolve")
async def resolve_alert(
    alert_id: str,
    current_user: dict = Depends(get_current_user)
):

    alert = await alert_service.resolve_alert(
        alert_id
    )

    if not alert:
        raise HTTPException(
            status_code=404,
            detail="Alert not found"
        )

    return alert