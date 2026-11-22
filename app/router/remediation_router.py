from fastapi import APIRouter, Depends, HTTPException

from app.schemas.remediation_schema import (
    RemediationPlanCreate,
    RemediationPlanResponse
)

from app.service.remediation_service import (
    remediation_service
)

from app.core.auth_dependency import (
    get_current_user
)


router = APIRouter(
    prefix="/remediation",
    tags=["Remediation"]
)


# ==========================================================
# CREATE REMEDIATION PLAN
# ==========================================================

@router.post(
    "",
    response_model=RemediationPlanResponse
)
async def create_remediation_plan(
    request: RemediationPlanCreate,
    current_user: dict = Depends(get_current_user)
):

    created_by = current_user.get("sub")

    plan = await remediation_service.create_plan(

        server_id=request.server_id,

        issue_type=request.issue_type,

        action=request.action,

        changes=request.changes,

        reason=request.reason,

        expected_impact=request.expected_impact,

        risk_level=request.risk_level,

        recommendation=request.recommendation,

        created_by=created_by
    )

    return plan


# ==========================================================
# GET ALL REMEDIATION PLANS
# ==========================================================

@router.get(
    "",
    response_model=list[RemediationPlanResponse]
)
async def get_all_remediation_plans(
    current_user: dict = Depends(get_current_user)
):

    return await remediation_service.get_all_plans()


# ==========================================================
# GET REMEDIATION PLANS FOR SERVER
# ==========================================================

@router.get(
    "/server/{server_id}",
    response_model=list[RemediationPlanResponse]
)
async def get_server_remediation_plans(
    server_id: str,
    current_user: dict = Depends(get_current_user)
):

    return await remediation_service.get_server_plans(
        server_id
    )


# ==========================================================
# GET SINGLE REMEDIATION PLAN
# ==========================================================

@router.get(
    "/{remediation_id}",
    response_model=RemediationPlanResponse
)
async def get_remediation_plan(
    remediation_id: str,
    current_user: dict = Depends(get_current_user)
):

    plan = await remediation_service.get_plan(
        remediation_id
    )

    if not plan:

        raise HTTPException(
            status_code=404,
            detail="Remediation plan not found"
        )

    return plan


# ==========================================================
# SUBMIT REMEDIATION PLAN
# ==========================================================

@router.post(
    "/{remediation_id}/submit"
)
async def submit_remediation_plan(
    remediation_id: str,
    current_user: dict = Depends(get_current_user)
):

    plan = await remediation_service.get_plan(
        remediation_id
    )

    if not plan:

        raise HTTPException(
            status_code=404,
            detail="Remediation plan not found"
        )

    if plan.get("status") != "DRAFT":

        raise HTTPException(
            status_code=400,
            detail=(
                "Only DRAFT remediation plans "
                "can be submitted."
            )
        )

    updated = await remediation_service.update_status(
        remediation_id,
        "SUBMITTED"
    )

    return {
        "message": "Remediation plan submitted successfully",
        "remediation_id": remediation_id,
        "status": "SUBMITTED",
        "data": updated
    }


# ==========================================================
# CREATE INFRASTRUCTURE REQUEST
# ==========================================================

@router.post(
    "/{remediation_id}/create-request"
)
async def create_infrastructure_request(
    remediation_id: str,
    current_user: dict = Depends(get_current_user)
):

    plan = await remediation_service.get_plan(
        remediation_id
    )

    if not plan:

        raise HTTPException(
            status_code=404,
            detail="Remediation plan not found"
        )

    if plan.get("status") not in [
        "DRAFT",
        "SUBMITTED"
    ]:

        raise HTTPException(
            status_code=400,
            detail=(
                "Infrastructure request cannot "
                "be created from the current status."
            )
        )

    user_id = current_user.get("sub")

    result = await (
        remediation_service
        .create_infrastructure_request(
            remediation_id,
            user_id
        )
    )

    if not result:

        raise HTTPException(
            status_code=400,
            detail=(
                "Unable to create infrastructure request."
            )
        )

    return {
        "message": (
            "Infrastructure request created "
            "successfully."
        ),
        "data": result
    }


# ==========================================================
# CANCEL REMEDIATION PLAN
# ==========================================================

@router.post(
    "/{remediation_id}/cancel"
)
async def cancel_remediation_plan(
    remediation_id: str,
    current_user: dict = Depends(get_current_user)
):

    plan = await remediation_service.get_plan(
        remediation_id
    )

    if not plan:

        raise HTTPException(
            status_code=404,
            detail="Remediation plan not found"
        )

    if plan.get("status") not in [
        "DRAFT",
        "SUBMITTED"
    ]:

        raise HTTPException(
            status_code=400,
            detail=(
                "Only DRAFT or SUBMITTED "
                "plans can be cancelled."
            )
        )

    updated = await remediation_service.update_status(
        remediation_id,
        "CANCELLED"
    )

    return {
        "message": "Remediation plan cancelled",
        "remediation_id": remediation_id,
        "status": "CANCELLED",
        "data": updated
    }