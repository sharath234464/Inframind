from typing import Any

from pydantic import BaseModel


class UtilizationTrendPoint(BaseModel):
    timestamp: Any
    cpu_utilization: float
    memory_utilization: float
    disk_utilization: float


class ClassificationSummary(BaseModel):
    classification: str
    count: int


class AnalyticsSummaryResponse(BaseModel):
    total_records: int
    average_cpu_utilization: float
    average_memory_utilization: float
    average_disk_utilization: float
    classifications: list[ClassificationSummary]


class ServerAnalyticsResponse(BaseModel):
    server_id: str
    total_records: int
    average_cpu_utilization: float
    average_memory_utilization: float
    average_disk_utilization: float
    trend: list[UtilizationTrendPoint]