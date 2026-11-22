from fastapi import APIRouter, Depends, Query, File, UploadFile, HTTPException

from app.core.auth_dependency import (
    get_current_user,
    require_admin
)

from app.schemas.request_schema import (
    InfrastructureRequestCreate,
    RequestDecision
)

from app.service.request_service import (
    request_service
)
from app.service.upload_service import upload_service


router = APIRouter(
    prefix="/requests",
    tags=["Infrastructure Requests"]
)


@router.post("")
async def create_request(
    request: InfrastructureRequestCreate,
    current_user: dict = Depends(
        get_current_user
    )
):

    return await request_service.create(
        request,
        current_user
    )


@router.get("/mine")
async def get_my_requests(
    current_user: dict = Depends(
        get_current_user
    )
):

    return await request_service.my_requests(
        current_user
    )


@router.get("/admin")
async def get_all_requests(
    status: str | None = Query(
        default=None
    ),
    admin: dict = Depends(
        require_admin
    )
):

    return await request_service.all_requests(
        status
    )


@router.post(
    "/{request_id}/decision"
)
async def decide_request(
    request_id: str,
    decision: RequestDecision,
    admin: dict = Depends(
        require_admin
    )
):

    return await request_service.decide(
        request_id=request_id,
        decision=decision.decision,
        admin=admin,
        comment=decision.comment
    )

@router.post("/inventory-upload")
async def submit_inventory_for_approval(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    """Users submit inventory for review; this endpoint never inserts inventory."""
    try:
        records = await upload_service.prepare_inventory_for_request(file)
        request = InfrastructureRequestCreate(
            request_type="INVENTORY_UPLOAD",
            target_id=None,
            payload={"filename": file.filename, "records": records},
            reason=f"Inventory upload approval requested for {file.filename} ({len(records)} servers)."
        )
        result = await request_service.create(request, current_user)
        return {**result, "uploaded_records": len(records), "message": "Inventory validated and submitted for admin approval. No inventory records were written yet."}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Unable to validate inventory file: {exc}") from exc
