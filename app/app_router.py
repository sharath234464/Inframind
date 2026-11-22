from fastapi import APIRouter

from app.router.upload_router import router as upload_router
from app.router.comparison_router import router as comparison_router
from app.router.report_router import router as report_router
from app.router.dashboard_router import router as dashboard_router
from app.router.recommendation_ai_router import router as recommendation_ai_router
from app.router.recommendation_router import router as recommendation_router
from app.router.chatbot_router import router as chatbot_router
from app.router.analysis_graph_router import router as analysis_graph_router
from app.router.auth_router import router as auth_router
from app.router.admin_router import router as admin_router
from app.router.request_router import router as request_router
from app.router.job_router import router as job_router
from app.router.simulation_router import router as simulation_router
from app.router.golden_generation_router import router as golden_generation_router
from app.router.golden_router import router as golden_router
from app.router.decision_memory_router import router as decision_memory_router
from app.router.alert_router import router as alert_router
from app.router.audit_router import router as audit_router
from app.router.health_router import router as health_router
from app.router.operations_router import router as operations_router
from app.router.analytics_router import router as analytics_router
from app.router.remediation_router import router as remediation_router
from app.router.support_chat_router import router as support_chat_router

app_router = APIRouter()

app_router.include_router(upload_router)
app_router.include_router(comparison_router)
app_router.include_router(report_router)
app_router.include_router(dashboard_router)
app_router.include_router(recommendation_ai_router)
app_router.include_router(recommendation_router)
app_router.include_router(chatbot_router)
app_router.include_router(analysis_graph_router)
app_router.include_router(auth_router)
app_router.include_router(admin_router)
app_router.include_router(request_router)
app_router.include_router(job_router)
app_router.include_router(simulation_router)
app_router.include_router(golden_generation_router)
app_router.include_router(golden_router)
app_router.include_router(decision_memory_router)
app_router.include_router(alert_router)
app_router.include_router(audit_router)
app_router.include_router(health_router)
app_router.include_router(operations_router)
app_router.include_router(analytics_router)
app_router.include_router(remediation_router)
app_router.include_router(support_chat_router)
