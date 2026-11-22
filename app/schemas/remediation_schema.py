from typing import Optional, Any

from pydantic import BaseModel


class RemediationPlanCreate(BaseModel):
    server_id: str
    issue_type: str
    action: str

    changes: dict[str, Any]

    reason: str
    expected_impact: str
    risk_level: str

    recommendation: Optional[str] = None


class RemediationPlanResponse(BaseModel):
    remediation_id: str

    server_id: str
    issue_type: str
    action: str

    changes: dict[str, Any]

    reason: str
    expected_impact: str
    risk_level: str

    recommendation: Optional[str] = None

    # AI-generated explanation
    ai_reasoning: Optional[str] = None
    ai_expected_impact: Optional[str] = None
    ai_risk_explanation: Optional[str] = None
    ai_recommendation: Optional[str] = None

    status: str
    created_by: str