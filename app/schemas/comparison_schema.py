from pydantic import BaseModel


class ComparisonResult(BaseModel):

    server_id: str

    instance_type: str

    allocation_status: str

    utilization_status: str

    classification: str

    actual_vcpu: int
    golden_vcpu: int

    actual_memory: int
    golden_memory: int

    actual_disk: int
    golden_disk: int

    cpu_utilization: float

    memory_utilization: float


class ComparisonResponse(BaseModel):

    status: bool

    message: str

    compared_servers: int