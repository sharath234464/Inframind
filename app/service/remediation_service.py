from uuid import uuid4

from app.repository.remediation_repository import (
    RemediationRepository
)

from app.repository.request_repository import (
    RequestRepository
)

from app.service.remediation_ai_service import (
    remediation_ai_service
)


class RemediationService:

    def __init__(self):

        self.repository = RemediationRepository()

        self.request_repository = RequestRepository()

    async def create_plan(
        self,
        server_id: str,
        issue_type: str,
        action: str,
        changes: dict,
        reason: str,
        expected_impact: str,
        risk_level: str,
        recommendation: str | None,
        created_by: str
    ):

        # --------------------------------------------------
        # STEP 1: Generate deterministic remediation plan
        # --------------------------------------------------

        remediation_id = f"REM-{uuid4().hex[:8].upper()}"

        # --------------------------------------------------
        # STEP 2: Ask AI to explain the plan
        # --------------------------------------------------

        ai_result = await remediation_ai_service.generate_reasoning(
            server_id=server_id,
            issue_type=issue_type,
            action=action,
            changes=changes,
            reason=reason,
            expected_impact=expected_impact,
            risk_level=risk_level
        )

        # --------------------------------------------------
        # STEP 3: Store complete remediation plan
        # --------------------------------------------------

        plan = {
            "remediation_id": remediation_id,

            "server_id": server_id,

            "issue_type": issue_type,

            "action": action,

            "changes": changes,

            # Deterministic values
            "reason": reason,
            "expected_impact": expected_impact,
            "risk_level": risk_level,
            "recommendation": recommendation,

            # AI explanation
            "ai_reasoning": ai_result.get(
                "reasoning"
            ),

            "ai_expected_impact": ai_result.get(
                "expected_impact"
            ),

            "ai_risk_explanation": ai_result.get(
                "risk_explanation"
            ),

            "ai_recommendation": ai_result.get(
                "recommendation"
            ),

            "status": "DRAFT",

            "created_by": created_by
        }

        return await self.repository.create(plan)

    # ------------------------------------------------------
    # GET SINGLE PLAN
    # ------------------------------------------------------

    async def get_plan(
        self,
        remediation_id: str
    ):

        return await self.repository.find_by_id(
            remediation_id
        )

    # ------------------------------------------------------
    # GET SERVER PLANS
    # ------------------------------------------------------

    async def get_server_plans(
        self,
        server_id: str
    ):

        return await self.repository.find_by_server(
            server_id
        )

    # ------------------------------------------------------
    # GET ALL PLANS
    # ------------------------------------------------------

    async def get_all_plans(self):

        return await self.repository.find_all()

    # ------------------------------------------------------
    # UPDATE STATUS
    # ------------------------------------------------------

    async def update_status(
        self,
        remediation_id: str,
        status: str
    ):

        return await self.repository.update_status(
            remediation_id,
            status
        )

    # ------------------------------------------------------
    # CREATE INFRASTRUCTURE REQUEST
    # ------------------------------------------------------

    async def create_infrastructure_request(
        self,
        remediation_id: str,
        user_id: str
    ):

        plan = await self.repository.find_by_id(
            remediation_id
        )

        if not plan:
            return None

        # Prevent duplicate requests
        if plan.get("status") == "REQUEST_CREATED":

            return {
                "message": (
                    "Infrastructure request already "
                    "created for this remediation plan."
                ),
                "remediation_id": remediation_id
            }

        # --------------------------------------------------
        # Create infrastructure change request
        # --------------------------------------------------

        request = {

            "request_type": "RESOURCE_CHANGE",

            "target_id": plan["server_id"],

            "payload": {

                "remediation_id": remediation_id,

                "action": plan["action"],

                "changes": plan["changes"],

                "issue_type": plan["issue_type"],

                "expected_impact": plan[
                    "expected_impact"
                ],

                "risk_level": plan[
                    "risk_level"
                ],

                # Include AI explanation
                "ai_reasoning": plan.get(
                    "ai_reasoning"
                ),

                "ai_risk_explanation": plan.get(
                    "ai_risk_explanation"
                ),

                "ai_recommendation": plan.get(
                    "ai_recommendation"
                )
            },

            "reason": plan["reason"],

            "requested_by": user_id,

            "status": "PENDING"
        }

        created_request = await (
            self.request_repository.create(
                request
            )
        )

        # --------------------------------------------------
        # Update remediation status
        # --------------------------------------------------

        await self.repository.update_status(
            remediation_id,
            "REQUEST_CREATED"
        )

        return created_request


remediation_service = RemediationService()