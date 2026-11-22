from typing import Optional

from pydantic import BaseModel, Field


class DecisionMemoryCreate(BaseModel):

    server_id: Optional[str] = None

    issue_type: str

    classification: Optional[str] = None

    decision: str

    action: str

    reason: Optional[str] = None

    outcome: Optional[str] = None


class DecisionMemoryResponse(BaseModel):

    memory_id: str

    issue_type: str

    classification: Optional[str] = None

    decision: str

    action: str

    reason: Optional[str] = None

    outcome: Optional[str] = None

    created_by: str