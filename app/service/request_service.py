from datetime import datetime, timezone
from uuid import uuid4

from fastapi import HTTPException

from app.repository.request_repository import RequestRepository
from app.service.request_execution_service import (
    RequestExecutionService
)
from app.service.audit_service import audit_service


class RequestService:

    def __init__(self):

        self.repository = RequestRepository()

        self.execution_service = (
            RequestExecutionService()
        )

    # ==========================================================
    # AUDIT HELPER
    # ==========================================================

    async def _audit(
        self,
        user_id: str,
        action: str,
        entity_type: str,
        entity_id: str | None = None,
        description: str | None = None,
        status: str = "SUCCESS"
    ):

        """
        Write audit information without allowing an audit
        failure to break the main business operation.
        """

        try:

            await audit_service.log_action(
                user_id=user_id,
                action=action,
                entity_type=entity_type,
                entity_id=entity_id,
                description=description,
                status=status
            )

        except Exception:
            # Audit failure must not break the main operation.
            pass

    # ==========================================================
    # CREATE REQUEST
    # ==========================================================

    async def create(
        self,
        request,
        current_user: dict
    ):

        request_id = (
            f"REQ-{uuid4().hex[:8].upper()}"
        )

        request_data = {
            "request_id": request_id,

            "request_type": request.request_type,

            "target_id": request.target_id,

            "payload": request.payload,

            "reason": request.reason,

            "requested_by": current_user["sub"],

            "status": "PENDING",

            "created_at": datetime.now(timezone.utc),

            "updated_at": datetime.now(timezone.utc)
        }

        created = await self.repository.create(
            request_data
        )

        # ------------------------------------------------------
        # AUDIT: REQUEST CREATED
        # ------------------------------------------------------

        await self._audit(
            user_id=current_user["sub"],
            action="REQUEST_CREATED",
            entity_type="INFRASTRUCTURE_REQUEST",
            entity_id=request_id,
            description=(
                f"Infrastructure request created. "
                f"Type: {request.request_type}. "
                f"Reason: {request.reason}"
            ),
            status="SUCCESS"
        )

        return {
            "request_id": created["request_id"],
            "request_type": created["request_type"],
            "status": created["status"],
            "requested_by": created["requested_by"],
            "message": "Request submitted successfully"
        }

    # ==========================================================
    # MY REQUESTS
    # ==========================================================

    async def my_requests(
        self,
        current_user: dict
    ):

        requests = await self.repository.find_by_user(
            current_user["sub"]
        )

        for request in requests:

            request["_id"] = str(
                request["_id"]
            )

        return requests

    # ==========================================================
    # ALL REQUESTS
    # ==========================================================

    async def all_requests(
        self,
        status: str | None = None
    ):

        requests = await self.repository.find_all(
            status
        )

        for request in requests:

            request["_id"] = str(
                request["_id"]
            )

        return requests

    # ==========================================================
    # APPROVE / REJECT REQUEST
    # ==========================================================

    async def decide(
        self,
        request_id: str,
        decision: str,
        admin: dict,
        comment: str | None = None
    ):

        request_data = await self.repository.find_by_id(
            request_id
        )

        if not request_data:

            raise HTTPException(
                status_code=404,
                detail="Request not found"
            )

        if request_data["status"] != "PENDING":

            raise HTTPException(
                status_code=400,
                detail=(
                    "Only PENDING requests "
                    "can be approved or rejected"
                )
            )

        # ======================================================
        # REJECT
        # ======================================================

        if decision == "REJECT":

            await self.repository.update_status(
                request_id,
                "REJECTED",
                {
                    "reviewed_by": admin["sub"],
                    "review_comment": comment,
                    "reviewed_at": datetime.now(
                        timezone.utc
                    )
                }
            )

            # --------------------------------------------------
            # AUDIT: REQUEST REJECTED
            # --------------------------------------------------

            await self._audit(
                user_id=admin["sub"],
                action="REQUEST_REJECTED",
                entity_type="INFRASTRUCTURE_REQUEST",
                entity_id=request_id,
                description=(
                    f"Infrastructure request rejected. "
                    f"Comment: {comment or 'No comment provided'}"
                ),
                status="SUCCESS"
            )

            return {
                "request_id": request_id,
                "status": "REJECTED",
                "message": "Request rejected"
            }

        # ======================================================
        # APPROVE
        # ======================================================

        if decision == "APPROVE":

            await self.repository.update_status(
                request_id,
                "APPROVED",
                {
                    "approved_by": admin["sub"],
                    "review_comment": comment,
                    "approved_at": datetime.now(
                        timezone.utc
                    )
                }
            )

            # --------------------------------------------------
            # AUDIT: REQUEST APPROVED
            # --------------------------------------------------

            await self._audit(
                user_id=admin["sub"],
                action="REQUEST_APPROVED",
                entity_type="INFRASTRUCTURE_REQUEST",
                entity_id=request_id,
                description=(
                    f"Infrastructure request approved. "
                    f"Type: {request_data['request_type']}. "
                    f"Comment: "
                    f"{comment or 'No comment provided'}"
                ),
                status="SUCCESS"
            )

            # ==================================================
            # EXECUTE APPROVED REQUEST
            # ==================================================

            try:

                execution_result = (
                    await self.execution_service.execute(
                        {**request_data, "approved_by": admin["sub"]}
                    )
                )

                await self.repository.update_status(
                    request_id,
                    "COMPLETED",
                    {
                        "execution_result": execution_result,
                        "executed_at": datetime.now(
                            timezone.utc
                        )
                    }
                )

                # ----------------------------------------------
                # AUDIT: EXECUTION COMPLETED
                # ----------------------------------------------

                await self._audit(
                    user_id=admin["sub"],
                    action="REQUEST_EXECUTED",
                    entity_type="INFRASTRUCTURE_REQUEST",
                    entity_id=request_id,
                    description=(
                        "Approved infrastructure request "
                        "executed successfully."
                    ),
                    status="SUCCESS"
                )

                return {
                    "request_id": request_id,
                    "status": "COMPLETED",
                    "message": (
                        "Request approved and executed"
                    ),
                    "execution": execution_result
                }

            except Exception as exc:

                await self.repository.update_status(
                    request_id,
                    "FAILED",
                    {
                        "execution_error": str(exc),
                        "executed_at": datetime.now(
                            timezone.utc
                        )
                    }
                )

                # ----------------------------------------------
                # AUDIT: EXECUTION FAILED
                # ----------------------------------------------

                await self._audit(
                    user_id=admin["sub"],
                    action="REQUEST_EXECUTION_FAILED",
                    entity_type="INFRASTRUCTURE_REQUEST",
                    entity_id=request_id,
                    description=(
                        "Infrastructure request was approved "
                        "but execution failed. "
                        f"Error: {str(exc)}"
                    ),
                    status="FAILED"
                )

                raise HTTPException(
                    status_code=500,
                    detail=(
                        "Request approved but "
                        f"execution failed: {str(exc)}"
                    )
                )

        # ======================================================
        # INVALID DECISION
        # ======================================================

        raise HTTPException(
            status_code=400,
            detail="Invalid decision"
        )


request_service = RequestService()