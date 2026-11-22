from fastapi import APIRouter, Depends, HTTPException, Query

from app.core.auth_dependency import get_current_user, require_admin
from app.schemas.golden_generation_schema import GoldenGenerationRequest
from app.service.golden_generation_service import golden_generation_service

router = APIRouter(prefix="/golden-generation", tags=["Golden Configuration Generation"])


def _is_admin(user: dict) -> bool:
    return str(user.get("role", "")).upper() == "ADMIN"


@router.post("/generate")
async def generate_golden_configuration(
    request: GoldenGenerationRequest,
    current_user: dict = Depends(get_current_user),
):
    try:
        proposals = await golden_generation_service.generate(
            instance_type=request.instance_type,
            minimum_healthy_servers=request.minimum_healthy_servers,
            created_by=current_user.get("sub", ""),
        )
        return {
            "message": f"Created {len(proposals)} proposal(s). Admin approval is required before activation.",
            "proposals": proposals,
        }
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/proposals")
async def get_golden_proposals(
    status: str | None = Query(default=None),
    current_user: dict = Depends(get_current_user),
):
    owner = None if _is_admin(current_user) else str(current_user.get("sub", ""))
    return await golden_generation_service.get_proposals(status=status, created_by=owner)


@router.get("/proposals/{proposal_id}")
async def get_golden_proposal(
    proposal_id: str,
    current_user: dict = Depends(get_current_user),
):
    proposal = await golden_generation_service.get_proposal(proposal_id)
    if not proposal:
        raise HTTPException(status_code=404, detail="Golden Configuration proposal not found.")
    if not _is_admin(current_user) and proposal.get("generated_by") != str(current_user.get("sub", "")):
        raise HTTPException(status_code=403, detail="You can only view proposals you created.")
    return proposal


@router.post("/proposals/{proposal_id}/approve")
async def approve_golden_proposal(
    proposal_id: str,
    current_admin: dict = Depends(require_admin),
):
    try:
        result = await golden_generation_service.approve_proposal(
            proposal_id=proposal_id,
            approved_by=current_admin.get("sub", "admin"),
        )
        return {"message": "Proposal approved and activated.", "data": result}
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/proposals/{proposal_id}/reject")
async def reject_golden_proposal(
    proposal_id: str,
    reason: str | None = Query(default=None, max_length=1000),
    current_admin: dict = Depends(require_admin),
):
    try:
        result = await golden_generation_service.reject_proposal(
            proposal_id=proposal_id,
            rejected_by=current_admin.get("sub", "admin"),
            reason=reason,
        )
        return {"message": "Proposal rejected.", "data": result}
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
