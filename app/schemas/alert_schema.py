from typing import Optional
from pydantic import BaseModel


class AlertCreate(BaseModel):
    server_id: str
    alert_type: str
    severity: str
    title: str
    message: str
    recommendation: Optional[str] = None


class AlertResponse(BaseModel):
    alert_id: str
    server_id: str
    alert_type: str
    severity: str
    title: str
    message: str
    recommendation: Optional[str] = None
    status: str