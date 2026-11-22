from typing import Literal, Optional
from pydantic import BaseModel, Field, field_validator

# Safe, predefined infrastructure reports only. Users can customize names,
# descriptions, recurrence, and enable/disable state; arbitrary code is never executed.
JobType = Literal[
    "OVER_ALLOCATED_COUNT",
    "UNDER_ALLOCATED_COUNT",
    "NON_COMPLIANT_COUNT",
    "PROBLEM_SERVERS",
    "COMPLIANCE_SUMMARY",
]


class JobCreateRequest(BaseModel):
    name: str = Field(..., min_length=3, max_length=100)
    job_type: JobType
    cron_expression: str = Field(..., min_length=9, max_length=100, description="Standard five-field cron expression")
    description: Optional[str] = Field(default=None, max_length=500)
    enabled: bool = True


class JobUpdateRequest(BaseModel):
    name: Optional[str] = Field(default=None, min_length=3, max_length=100)
    cron_expression: Optional[str] = Field(default=None, min_length=9, max_length=100)
    description: Optional[str] = Field(default=None, max_length=500)
    enabled: Optional[bool] = None
