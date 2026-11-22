from typing import Optional
from pydantic import BaseModel


class AuditLogCreate(BaseModel):
    action: str
    entity_type: str
    entity_id: Optional[str] = None
    description: Optional[str] = None
    status: str = "SUCCESS"


class AuditLogResponse(BaseModel):
    audit_id: str
    user_id: str
    action: str
    entity_type: str
    entity_id: Optional[str] = None
    description: Optional[str] = None
    status: str