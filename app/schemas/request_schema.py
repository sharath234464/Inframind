from typing import Literal, Optional

from pydantic import BaseModel, Field


RequestType = Literal[
    "ADD_SERVER",
    "UPDATE_SERVER",
    "DELETE_SERVER",
    "RESOURCE_CHANGE",
    "GOLDEN_CONFIG_CHANGE",
    "INVENTORY_UPLOAD",
    "GOLDEN_CONFIG_GENERATION",
]


RequestStatus = Literal[
    "PENDING",
    "APPROVED",
    "REJECTED",
    "COMPLETED",
    "FAILED",
]


class InfrastructureRequestCreate(BaseModel):
    request_type: RequestType

    target_id: Optional[str] = None

    payload: dict = Field(
        default_factory=dict
    )

    reason: str = Field(
        ...,
        min_length=5,
        max_length=1000
    )


class RequestDecision(BaseModel):
    decision: Literal[
        "APPROVE",
        "REJECT"
    ]

    comment: Optional[str] = None