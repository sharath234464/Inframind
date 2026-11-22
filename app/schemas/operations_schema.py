from typing import Any, Optional

from pydantic import BaseModel


class OperationsSummaryResponse(BaseModel):
    total_servers: int
    compliant_servers: int
    non_compliant_servers: int

    open_alerts: int
    critical_alerts: int
    high_risk_servers: int

    pending_requests: int
    active_scheduled_jobs: int
    pending_golden_proposals: int

    recent_activity: list[dict[str, Any]]