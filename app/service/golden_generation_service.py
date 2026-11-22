from datetime import datetime, timezone
from statistics import median
from uuid import uuid4

from openai import AsyncOpenAI

from app.core.config import settings
from app.repository.golden_generation_repository import GoldenGenerationRepository
from app.service.audit_service import audit_service


class GoldenGenerationService:
    def __init__(self):
        self.repository = GoldenGenerationRepository()
        self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY) if settings.OPENAI_API_KEY else None

    @staticmethod
    def _number(row: dict, field: str):
        try:
            value = float(row.get(field))
            if value != value or value in (float("inf"), float("-inf")):
                return None
            return value
        except (TypeError, ValueError):
            return None

    @staticmethod
    def _percentile(values: list[float], fraction: float) -> float:
        ordered = sorted(values)
        index = min(len(ordered) - 1, max(0, round((len(ordered) - 1) * fraction)))
        return float(ordered[index])

    async def _reasoning(self, instance_type: str, servers: list[dict], baseline: dict, telemetry: dict) -> str:
        if self.client is None:
            raise ValueError("OPENAI_API_KEY is not configured. Add it to the backend .env file to generate an AI-assisted proposal.")

        prompt = f"""You are an enterprise infrastructure capacity-planning assistant.
Explain the proposed Golden Configuration using only the measurements supplied below.
Do not change, invent, or calculate alternative numeric values. Do not claim the proposal is approved.
Explain the source evidence, sizing rationale, utilization ranges, risks, and what an administrator should review.
State clearly that the configuration is pending administrator approval.

Instance type: {instance_type}
Healthy source server count: {len(servers)}
Proposed baseline (calculated from inventory statistics): {baseline}
Observed utilization summary: {telemetry}

Return a concise, professional explanation with headings."""

        try:
            response = await self.client.responses.create(
                model=settings.MODEL_NAME or "gpt-4.1-mini",
                input=prompt,
            )
        except Exception as exc:
            raise ValueError(
                f"OpenAI could not generate the Golden Configuration explanation for {instance_type}. "
                "Check OPENAI_API_KEY, model access and API quota."
            ) from exc
        text = (response.output_text or "").strip()
        if not text:
            raise ValueError(f"AI returned an empty explanation for {instance_type}.")
        return text

    async def generate(self, instance_type: str | None, minimum_healthy_servers: int, created_by: str):
        if minimum_healthy_servers < 1:
            raise ValueError("minimum_healthy_servers must be at least 1.")

        inventory = await self.repository.get_inventory(instance_type)
        if not inventory:
            raise ValueError("No approved server inventory was found. Upload inventory and obtain Admin approval first.")

        grouped: dict[str, list[dict]] = {}
        skipped_invalid = 0
        for row in inventory:
            values = {field: self._number(row, field) for field in (
                "vcpu", "memory", "disk", "cpu_utilization", "memory_utilization", "disk_utilization"
            )}
            if any(value is None for value in values.values()):
                skipped_invalid += 1
                continue
            cpu = values["cpu_utilization"]
            mem = values["memory_utilization"]
            disk = values["disk_utilization"]
            if 20 <= cpu <= 70 and 20 <= mem <= 75 and 20 <= disk <= 80:
                kind = str(row.get("instance_type", "")).strip()
                if kind:
                    grouped.setdefault(kind, []).append({**row, **values})

        if instance_type:
            grouped = {key: value for key, value in grouped.items() if key == instance_type}

        eligible = {key: rows for key, rows in grouped.items() if len(rows) >= minimum_healthy_servers}
        if not eligible:
            eligible_counts = {key: len(rows) for key, rows in grouped.items()}
            raise ValueError(
                f"No instance type has the required {minimum_healthy_servers} healthy servers. "
                f"Healthy counts by type: {eligible_counts or 'none'}. "
                "Try a lower minimum or verify utilization fields."
            )

        proposals = []
        for kind, servers in sorted(eligible.items()):
            baseline = {
                "vcpu": median([row["vcpu"] for row in servers]),
                "memory": median([row["memory"] for row in servers]),
                "disk": median([row["disk"] for row in servers]),
                "target_cpu_utilization_min": round(self._percentile([row["cpu_utilization"] for row in servers], 0.10), 2),
                "target_cpu_utilization_max": round(self._percentile([row["cpu_utilization"] for row in servers], 0.90), 2),
                "target_memory_utilization_min": round(self._percentile([row["memory_utilization"] for row in servers], 0.10), 2),
                "target_memory_utilization_max": round(self._percentile([row["memory_utilization"] for row in servers], 0.90), 2),
            }
            telemetry = {
                "cpu_median": round(median([row["cpu_utilization"] for row in servers]), 2),
                "memory_median": round(median([row["memory_utilization"] for row in servers]), 2),
                "disk_median": round(median([row["disk_utilization"] for row in servers]), 2),
            }
            reasoning = await self._reasoning(kind, servers, baseline, telemetry)
            proposal = {
                "proposal_id": f"GOLDEN-{uuid4().hex[:8].upper()}",
                "instance_type": kind,
                **baseline,
                "source_server_count": len(servers),
                "source_inventory_count": len(inventory),
                "skipped_invalid_inventory_rows": skipped_invalid,
                "status": "PENDING_APPROVAL",
                "generation_method": "inventory_statistics_with_llm_reasoning",
                "generated_by": str(created_by),
                "ai_reasoning": reasoning,
                "created_at": datetime.now(timezone.utc),
            }
            proposals.append(await self.repository.create_proposal(proposal))

        try:
            await audit_service.log_action(
                user_id=str(created_by),
                action="GOLDEN_CONFIGURATION_PROPOSED",
                entity_type="GOLDEN_CONFIGURATION_PROPOSAL",
                entity_id=proposals[0]["proposal_id"] if proposals else None,
                description=f"Generated {len(proposals)} AI-assisted Golden Configuration proposal(s).",
                status="SUCCESS",
            )
        except Exception:
            pass
        return proposals

    async def get_proposal(self, proposal_id: str):
        return await self.repository.get_proposal(proposal_id)

    async def get_proposals(self, status: str | None = None, created_by: str | None = None):
        return await self.repository.get_proposals(created_by=created_by, status=status)

    async def approve_proposal(self, proposal_id: str, approved_by: str):
        proposal = await self.repository.get_proposal(proposal_id)
        if not proposal:
            raise ValueError("Golden Configuration proposal not found.")
        if proposal.get("status") != "PENDING_APPROVAL":
            raise ValueError("Only pending proposals can be approved.")

        config_fields = (
            "vcpu", "memory", "disk", "target_cpu_utilization_min",
            "target_cpu_utilization_max", "target_memory_utilization_min",
            "target_memory_utilization_max",
        )
        configuration = {key: proposal[key] for key in config_fields}
        configuration.update({
            "approved_by": str(approved_by),
            "approved_at": datetime.now(timezone.utc),
            "source": "approved_ai_inventory_proposal",
            "ai_reasoning": proposal.get("ai_reasoning"),
        })

        active = await self.repository.activate_golden_configuration(
            proposal["instance_type"], configuration
        )
        updated = await self.repository.update_proposal(
            proposal_id,
            {"status": "APPROVED", "approved_by": str(approved_by), "approved_at": datetime.now(timezone.utc)},
            only_pending=True,
        )
        if not updated:
            raise ValueError("This proposal was already reviewed. Refresh the proposal list.")
        try:
            await audit_service.log_action(
                user_id=str(approved_by), action="GOLDEN_CONFIGURATION_APPROVED",
                entity_type="GOLDEN_CONFIGURATION", entity_id=proposal["instance_type"],
                description=f"Approved proposal {proposal_id}.", status="SUCCESS",
            )
        except Exception:
            pass
        return {"proposal": updated, "golden_configuration": active}

    async def reject_proposal(self, proposal_id: str, rejected_by: str, reason: str | None = None):
        proposal = await self.repository.get_proposal(proposal_id)
        if not proposal:
            raise ValueError("Golden Configuration proposal not found.")
        if proposal.get("status") != "PENDING_APPROVAL":
            raise ValueError("Only pending proposals can be rejected.")
        updated = await self.repository.update_proposal(
            proposal_id,
            {
                "status": "REJECTED",
                "rejected_by": str(rejected_by),
                "rejected_at": datetime.now(timezone.utc),
                "rejection_reason": reason,
            },
            only_pending=True,
        )
        if not updated:
            raise ValueError("This proposal was already reviewed. Refresh the proposal list.")
        try:
            await audit_service.log_action(
                user_id=str(rejected_by), action="GOLDEN_CONFIGURATION_REJECTED",
                entity_type="GOLDEN_CONFIGURATION", entity_id=proposal["instance_type"],
                description=f"Rejected proposal {proposal_id}. Reason: {reason or 'Not provided'}",
                status="SUCCESS",
            )
        except Exception:
            pass
        return updated


golden_generation_service = GoldenGenerationService()
