from pydantic import BaseModel


class DashboardResponse(BaseModel):

    status: bool

    message: str

    total_servers: int

    properly_allocated: int
    under_allocated: int
    over_allocated: int

    properly_utilized: int
    under_utilized: int
    over_utilized: int

    compliant: int

    needs_review: int