import re
import json

from openai import AsyncOpenAI

from app.core.config import settings

from app.repository.analysis_repository import analysis_repository
from app.repository.alert_repository import alert_repository
from app.repository.health_repository import HealthRepository
from app.repository.recommendation_repository import recommendation_repository
from app.repository.remediation_repository import RemediationRepository
from app.repository.decision_memory_repository import DecisionMemoryRepository
from app.repository.audit_repository import AuditRepository
from app.repository.request_repository import RequestRepository
from app.repository.job_repository import JobRepository
from app.repository.report_repository import report_repository
from app.repository.dashboard_repository import dashboard_repository
from app.schemas.request_schema import InfrastructureRequestCreate
from app.service.request_service import request_service
from app.service.assistant_action_service import assistant_action_service


client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY) if settings.OPENAI_API_KEY else None


class ChatbotService:

    def __init__(self):

        self.health_repository = HealthRepository()
        self.remediation_repository = RemediationRepository()
        self.decision_memory_repository = DecisionMemoryRepository()
        self.audit_repository = AuditRepository()
        self.request_repository = RequestRepository()
        self.job_repository = JobRepository()

    # ============================================================
    # SAFE SERIALIZATION
    # ============================================================

    def _serialize(self, data):

        return json.dumps(
            data,
            default=str,
            indent=2
        )

    # ============================================================
    # SERVER ID EXTRACTION
    # ============================================================

    def _extract_server_id(self, question: str):

        match = re.search(
            r"SRV-\d+",
            question.upper()
        )

        if match:
            return match.group()

        return None

    # ============================================================
    # DETERMINE REQUIRED DATA
    # ============================================================

    def _get_data_types(self, question: str):

        q = question.lower()

        data_types = set()

        # Server / analysis
        analysis_keywords = [
            "server",
            "servers",
            "allocation",
            "allocated",
            "utilization",
            "utilized",
            "classification",
            "compliant",
            "compliance",
            "analysis",
            "under allocated",
            "over allocated",
            "under utilized",
            "over utilized",
            "properly allocated",
            "properly utilized"
        ]

        if any(word in q for word in analysis_keywords):
            data_types.add("analysis")

        # Recommendation
        recommendation_keywords = [
            "recommendation",
            "recommendations",
            "suggestion",
            "suggestions",
            "what should i do",
            "what should be done"
        ]

        if any(word in q for word in recommendation_keywords):
            data_types.add("recommendations")

        # Alerts
        alert_keywords = [
            "alert",
            "alerts",
            "critical alert",
            "open alert",
            "warning"
        ]

        if any(word in q for word in alert_keywords):
            data_types.add("alerts")

        # Health
        health_keywords = [
            "health",
            "health score",
            "risk",
            "high risk",
            "critical risk"
        ]

        if any(word in q for word in health_keywords):
            data_types.add("health")

        # Remediation
        remediation_keywords = [
            "remediation",
            "remediate",
            "fix",
            "fixing",
            "remediation plan"
        ]

        if any(word in q for word in remediation_keywords):
            data_types.add("remediation")

        # Decision memory
        decision_keywords = [
            "decision",
            "decisions",
            "previous decision",
            "past decision",
            "decision memory",
            "previously decided",
            "what was decided"
        ]

        if any(word in q for word in decision_keywords):
            data_types.add("decision_memory")

        # Infrastructure requests
        request_keywords = [
            "request",
            "requests",
            "infrastructure request",
            "pending request",
            "approved request",
            "rejected request"
        ]

        if any(word in q for word in request_keywords):
            data_types.add("requests")

        # Scheduled jobs
        job_keywords = [
            "job",
            "jobs",
            "scheduled job",
            "scheduled jobs",
            "schedule",
            "execution history",
            "job history"
        ]

        if any(word in q for word in job_keywords):
            data_types.add("jobs")

        # Audit
        audit_keywords = [
            "audit",
            "audit log",
            "audit logs",
            "activity",
            "recent activity"
        ]

        if any(word in q for word in audit_keywords):
            data_types.add("audit")

        # Dashboard / report
        dashboard_keywords = [
            "dashboard",
            "summary",
            "overview",
            "total servers",
            "how many servers",
            "count",
            "statistics",
            "stats",
            "report"
        ]

        if any(word in q for word in dashboard_keywords):
            data_types.add("dashboard")

        # If question is vague, analysis is the safest default
        if not data_types:
            data_types.add("analysis")

        return data_types

    # ============================================================
    # LOAD ANALYSIS DATA
    # ============================================================

    async def _load_analysis(
        self,
        question: str,
        server_id: str | None
    ):

        if server_id:

            analysis = await analysis_repository.get_server_by_id(
                server_id
            )

            if analysis is None:
                return {
                    "error": "Server not found."
                }

            return analysis

        results = await analysis_repository.get_all_analysis_results()

        q = question.lower()

        # Filter common classification questions
        if "non-compliant" in q or "non compliant" in q:
            results = [
                item
                for item in results
                if str(
                    item.get("compliance_status", "")
                ).lower() == "non-compliant"
                or str(
                    item.get("classification", "")
                ).lower() != "compliant"
            ]

        elif "under allocated" in q:
            results = [
                item
                for item in results
                if item.get("allocation_status")
                == "Under Allocated"
            ]

        elif "over allocated" in q:
            results = [
                item
                for item in results
                if item.get("allocation_status")
                == "Over Allocated"
            ]

        elif "properly allocated" in q:
            results = [
                item
                for item in results
                if item.get("allocation_status")
                == "Properly Allocated"
            ]

        elif "under utilized" in q:
            results = [
                item
                for item in results
                if item.get("utilization_status")
                == "Under Utilized"
            ]

        elif "over utilized" in q:
            results = [
                item
                for item in results
                if item.get("utilization_status")
                == "Over Utilized"
            ]

        elif "properly utilized" in q:
            results = [
                item
                for item in results
                if item.get("utilization_status")
                == "Properly Utilized"
            ]

        return results

    # ============================================================
    # LOAD RECOMMENDATIONS
    # ============================================================

    async def _load_recommendations(
        self,
        server_id: str | None
    ):

        if server_id:

            recommendation = (
                await recommendation_repository
                .get_recommendation_by_server(server_id)
            )

            return recommendation

        return await recommendation_repository.get_all_recommendations()

    # ============================================================
    # LOAD ALERTS
    # ============================================================

    async def _load_alerts(
        self,
        question: str,
        server_id: str | None
    ):

        if server_id:

            return await alert_repository.find_by_server(
                server_id
            )

        alerts = await alert_repository.find_all()

        q = question.lower()

        if "critical" in q:
            alerts = [
                alert
                for alert in alerts
                if str(
                    alert.get("severity", "")
                ).upper() == "CRITICAL"
            ]

        elif "high" in q:
            alerts = [
                alert
                for alert in alerts
                if str(
                    alert.get("severity", "")
                ).upper() == "HIGH"
            ]

        elif "open" in q:
            alerts = [
                alert
                for alert in alerts
                if str(
                    alert.get("status", "")
                ).upper() == "OPEN"
            ]

        elif "resolved" in q:
            alerts = [
                alert
                for alert in alerts
                if str(
                    alert.get("status", "")
                ).upper() == "RESOLVED"
            ]

        return alerts

    # ============================================================
    # LOAD HEALTH
    # ============================================================

    async def _load_health(
        self,
        server_id: str | None
    ):

        if server_id:

            return await self.health_repository.find_by_server(
                server_id
            )

        return await self.health_repository.find_all()

    # ============================================================
    # LOAD REMEDIATION
    # ============================================================

    async def _load_remediation(
        self,
        server_id: str | None
    ):

        if server_id:

            return await self.remediation_repository.find_by_server(
                server_id
            )

        return await self.remediation_repository.find_all()

    # ============================================================
    # LOAD DECISION MEMORY
    # ============================================================

    async def _load_decision_memory(self):

        return await self.decision_memory_repository.find_all()

    # ============================================================
    # LOAD REQUESTS
    # ============================================================

    async def _load_requests(self, current_user: dict | None = None):
        if current_user and str(current_user.get("role", "USER")).upper() != "ADMIN":
            return await self.request_repository.find_by_user(current_user.get("sub"))
        return await self.request_repository.find_all()

    # ============================================================
    # LOAD JOBS
    # ============================================================

    async def _load_jobs(self):

        return await self.job_repository.find_all()

    # ============================================================
    # LOAD AUDIT
    # ============================================================

    async def _load_audit(self):

        return await self.audit_repository.find_all()

    # ============================================================
    # LOAD DASHBOARD / REPORT SUMMARY
    # ============================================================

    async def _load_dashboard(self):

        summary = {
            "total_servers":
                await dashboard_repository.get_total_servers(),

            "properly_allocated":
                await dashboard_repository.get_properly_allocated(),

            "under_allocated":
                await dashboard_repository.get_under_allocated(),

            "over_allocated":
                await dashboard_repository.get_over_allocated(),

            "properly_utilized":
                await dashboard_repository.get_properly_utilized(),

            "under_utilized":
                await dashboard_repository.get_under_utilized(),

            "over_utilized":
                await dashboard_repository.get_over_utilized(),

            "compliant":
                await dashboard_repository.get_compliant(),

            "needs_review":
                await dashboard_repository.get_needs_review()
        }

        return summary

    # ============================================================
    # BUILD CONTEXT
    # ============================================================

    async def _build_context(
        self,
        question: str,
        current_user: dict | None = None
    ):

        server_id = self._extract_server_id(
            question
        )

        data_types = self._get_data_types(
            question
        )

        context = {}

        if "analysis" in data_types:

            context["analysis"] = (
                await self._load_analysis(
                    question,
                    server_id
                )
            )

        if "recommendations" in data_types:

            context["recommendations"] = (
                await self._load_recommendations(
                    server_id
                )
            )

        if "alerts" in data_types:

            context["alerts"] = (
                await self._load_alerts(
                    question,
                    server_id
                )
            )

        if "health" in data_types:

            context["health"] = (
                await self._load_health(
                    server_id
                )
            )

        if "remediation" in data_types:

            context["remediation"] = (
                await self._load_remediation(
                    server_id
                )
            )

        if "decision_memory" in data_types:

            context["decision_memory"] = (
                await self._load_decision_memory()
            )

        if "requests" in data_types:

            context["requests"] = (
                await self._load_requests(current_user)
            )

        if "jobs" in data_types:

            context["jobs"] = (
                await self._load_jobs()
            )

        if "audit" in data_types:

            context["audit"] = (
                await self._load_audit()
            )

        if "dashboard" in data_types:

            context["dashboard"] = (
                await self._load_dashboard()
            )

        return context

    # ============================================================
    # CHAT
    # ============================================================

    def _field_value(self, question: str, names: list[str]):
        for name in names:
            match = re.search(rf"(?:{name})\s*[:=]\s*([^,;\n]+)", question, re.IGNORECASE)
            if match:
                return match.group(1).strip()
        return None

    async def _submit_action_request(self, question: str, current_user: dict):
        """Turn explicit user change intents into approval requests; never mutate infra here."""
        if str(current_user.get("role", "USER")).upper() == "ADMIN":
            return None
        q = question.strip()
        low = q.lower()
        action_words = ("add server", "create server", "register server", "update server", "modify server", "change server", "delete server", "remove server", "delete srv-", "remove srv-", "update memory", "update vcpu", "update disk", "change memory", "change vcpu", "change disk", "generate golden", "create golden", "propose golden", "give golden configuration", "golden configuration from", "golden configuration based on", "resource change")
        if not any(word in low for word in action_words):
            return None

        server_match = re.search(r"SRV[-_ ]?\d+", q, re.IGNORECASE)
        target_id = server_match.group(0).upper().replace(" ", "-").replace("_", "-") if server_match else None

        if any(word in low for word in ("generate golden", "create golden", "propose golden", "give golden configuration", "golden configuration from", "golden configuration based on")):
            instance_type = self._field_value(q, ["instance_type", "instance type", "for instance type"])
            if not instance_type:
                match = re.search(r"(?:for|type)\s+([A-Za-z][A-Za-z0-9 _-]{2,40}?)(?:\s+from inventory|\s+based on|$)", q, re.IGNORECASE)
                instance_type = match.group(1).strip(" .,:;-") if match else None
            if not instance_type:
                return "I can submit that for admin approval. Please specify the instance type, for example: Generate Golden Configuration from inventory for General Purpose."
            payload = {"instance_type": instance_type, "minimum_healthy_servers": 1}
            request = InfrastructureRequestCreate(request_type="GOLDEN_CONFIG_GENERATION", target_id=instance_type, payload=payload, reason=f"User requested Golden Configuration generation from healthy inventory for {instance_type}.")
        elif any(word in low for word in ("delete server", "remove server")):
            if not target_id:
                return "Please include the server ID, for example: Delete server SRV-1001. I will submit it for admin approval."
            request = InfrastructureRequestCreate(request_type="DELETE_SERVER", target_id=target_id, payload={}, reason=f"User requested deletion of server {target_id} through the AI Assistant.")
        elif any(word in low for word in ("update server", "modify server", "change server", "update memory", "update vcpu", "update disk", "change memory", "change vcpu", "change disk", "resource change")):
            if not target_id:
                return "Please include the server ID, for example: Update server SRV-1001 memory to 32 GB."
            field_match = re.search(r"\b(vcpu|cpu|memory|ram|disk|storage|server_name|environment|region|instance_type|os|patch_level)\b\s*(?:to|=|:)?\s*(?:be\s+)?([A-Za-z0-9_. -]+?)(?:\s*(?:,|\band\b|$))", q, re.IGNORECASE)
            if not field_match:
                return "I can submit the change for admin approval. Specify a field and value, e.g. Update server SRV-1001 memory to 32 GB."
            field = field_match.group(1).lower()
            value_text = field_match.group(2).strip().rstrip(".")
            aliases = {"ram": "memory", "storage": "disk", "cpu": "vcpu"}
            field = aliases.get(field, field)
            numeric_fields = {"vcpu", "memory", "disk"}
            numeric = re.search(r"-?\d+(?:\.\d+)?", value_text)
            value = float(numeric.group()) if field in numeric_fields and numeric else value_text
            if field in numeric_fields and value is None:
                return "Please specify a numeric resource value."
            request = InfrastructureRequestCreate(request_type="UPDATE_SERVER", target_id=target_id, payload={field: value}, reason=f"User requested changing {field} for {target_id} through the AI Assistant.")
        elif any(word in low for word in ("add server", "create server", "register server")):
            server_id = self._field_value(q, ["server_id", "server id"]) or target_id
            payload = {
                "server_id": server_id,
                "server_name": self._field_value(q, ["server_name", "server name"]),
                "environment": self._field_value(q, ["environment"]),
                "region": self._field_value(q, ["region"]),
                "instance_type": self._field_value(q, ["instance_type", "instance type"]),
                "vcpu": self._field_value(q, ["vcpu", "vcpus"]),
                "memory": self._field_value(q, ["memory", "ram"]),
                "disk": self._field_value(q, ["disk", "storage"]),
                "os": self._field_value(q, ["os", "operating system"]),
                "patch_level": self._field_value(q, ["patch_level", "patch level"]),
                "cpu_utilization": self._field_value(q, ["cpu_utilization", "cpu utilization"]),
                "memory_utilization": self._field_value(q, ["memory_utilization", "memory utilization"]),
                "disk_utilization": self._field_value(q, ["disk_utilization", "disk utilization"]),
            }
            # Also support compact natural-language values like "4 vCPU, 16 GB memory, 200 GB disk".
            if payload["vcpu"] is None:
                m = re.search(r"(\d+(?:\.\d+)?)\s*vcpus?", q, re.IGNORECASE); payload["vcpu"] = m.group(1) if m else None
            if payload["memory"] is None:
                m = re.search(r"(\d+(?:\.\d+)?)\s*(?:GB|GiB)?\s*(?:memory|RAM)", q, re.IGNORECASE); payload["memory"] = m.group(1) if m else None
            if payload["disk"] is None:
                m = re.search(r"(\d+(?:\.\d+)?)\s*(?:GB|TB)?\s*(?:disk|storage)", q, re.IGNORECASE); payload["disk"] = m.group(1) if m else None
            required = ["server_id", "server_name", "environment", "region", "instance_type", "vcpu", "memory", "disk", "os", "patch_level", "cpu_utilization", "memory_utilization", "disk_utilization"]
            missing = [field for field in required if payload.get(field) in (None, "")]
            if missing:
                return "I can submit a server creation request for admin approval. Please provide all fields in this format: server_id: SRV-1001, server_name: app-01, environment: Production, region: Hyderabad, instance_type: General Purpose, vcpu: 4, memory: 16, disk: 200, os: Ubuntu Linux, patch_level: Latest, cpu_utilization: 45, memory_utilization: 60, disk_utilization: 50."
            for key in ("vcpu", "memory", "disk", "cpu_utilization", "memory_utilization", "disk_utilization"):
                payload[key] = float(re.search(r"-?\d+(?:\.\d+)?", str(payload[key])).group())
            request = InfrastructureRequestCreate(request_type="ADD_SERVER", target_id=server_id, payload=payload, reason=f"User requested adding server {server_id} through the AI Assistant.")
        else:
            return None

        created = await request_service.create(request, current_user)
        return f"Your request {created['request_id']} has been submitted to the administrator for approval. Status: PENDING. No infrastructure data has been changed yet. You can track it in My Requests."

    async def chat(
        self,
        question: str,
        current_user: dict | None = None
    ):

        question = question.strip()

        if not question:
            return "Please enter a question."

        if current_user is not None:
            action_response = await assistant_action_service.handle(
                question,
                current_user
                )
            if action_response is not None:
                return action_response

        context = await self._build_context(
            question, current_user
        )

        if (
            len(context) == 1
            and context.get("analysis") == {
                "error": "Server not found."
            }
        ):

            return "Server not found."

        serialized_context = self._serialize(
            context
        )

        prompt = f"""
You are an Enterprise Infrastructure AI Assistant
for an Agentic AI Infrastructure Resource Management System.

Your job is to answer questions using ONLY the
enterprise infrastructure data provided below.

IMPORTANT RULES:

1. Do not invent servers, alerts, recommendations,
   health scores, requests, jobs, decisions, or other data.

2. If the required information is not available,
   respond exactly with:
   "I could not find that information."

3. Give clear and professional answers.

4. If the user asks for a list, present the information
   in a readable numbered or bullet list.

5. If the user asks about a specific server, focus on
   that server.

6. If the user asks for a count or summary, provide the
   exact count from the provided data.

7. If recommendations exist, explain them clearly.

8. Do not claim that an action was executed merely because
   a recommendation or remediation plan exists.

9. Distinguish between:
   - recommendation
   - alert
   - remediation plan
   - infrastructure request
   - completed action

10. When discussing previous decisions, use only the
    Decision Memory data.

11. When discussing health, use the Health data.

12. When discussing alerts, use the Alerts data.

13. When discussing scheduled jobs, use the Jobs data.

14. When discussing audit activity, use the Audit data.

15. Do not expose internal database implementation details
    unless specifically asked.

ENTERPRISE DATA:

{serialized_context}

USER QUESTION:

{question}
"""

        if client is None:
            return "AI question answering is not configured yet. Set OPENAI_API_KEY in the backend .env file. Infrastructure change requests can still be submitted for admin approval."

        try:
            response = await client.responses.create(
                model=settings.MODEL_NAME or "gpt-4.1-mini",
                input=prompt,
            )
            answer = (response.output_text or "").strip()
            if not answer:
                return "I could not find that information."
            return answer
        except Exception as exc:
            print(f"AI Assistant request failed: {exc}")
            return (
                "The AI Assistant could not complete this request. "
                "Check OPENAI_API_KEY, MODEL_NAME, network access and API quota "
                "in the backend configuration."
            )


chatbot_service = ChatbotService()