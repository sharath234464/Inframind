import re
from typing import Any

from fastapi import HTTPException

from app.schemas.request_schema import InfrastructureRequestCreate
from app.service.request_service import request_service
from app.service.request_execution_service import RequestExecutionService


class AssistantActionService:
    """
    Admin:
        Executes explicit CRUD commands directly.

    User:
        Creates PENDING infrastructure requests.
        Does not modify inventory or Golden Configuration.
    """

    def __init__(self):
        self.execution_service = RequestExecutionService()

    @staticmethod
    def _server_id(text: str):
        match = re.search(r"\bSRV[-_ ]?\d+\b", text, re.IGNORECASE)
        if not match:
            return None

        return match.group(0).upper().replace("_", "-").replace(" ", "-")

    @staticmethod
    def _field_value(text: str, names: list[str]):
        for name in names:
            match = re.search(
                rf"(?:{name})\s*[:=]\s*([^,;\n]+)",
                text,
                re.IGNORECASE,
            )
            if match:
                return match.group(1).strip()
        return None

    @staticmethod
    def _parse_update(text: str):
        match = re.search(
            r"\b(vcpu|cpu|memory|ram|disk|storage|server_name|environment|region|instance_type|os|patch_level)\b"
            r"\s*(?:to|=|:)\s*([A-Za-z0-9_. -]+)",
            text,
            re.IGNORECASE,
        )

        if not match:
            return None, None

        field = match.group(1).lower()
        value_text = match.group(2).strip().rstrip(" .")

        aliases = {
            "cpu": "vcpu",
            "ram": "memory",
            "storage": "disk",
        }
        field = aliases.get(field, field)

        if field in {"vcpu", "memory", "disk"}:
            number = re.search(r"\d+(?:\.\d+)?", value_text)
            if not number:
                return None, None
            return field, float(number.group())

        return field, value_text

    async def handle(self, question: str, current_user: dict):
        text = question.strip()
        low = text.lower()

        if not text:
            return None

        action_words = (
            "add server",
            "create server",
            "register server",
            "update server",
            "modify server",
            "change server",
            "delete server",
            "remove server",
            "delete srv-",
            "remove srv-",
            "update memory",
            "update vcpu",
            "update disk",
            "change memory",
            "change vcpu",
            "change disk",
        )

        if not any(word in low for word in action_words):
            return None

        role = str(current_user.get("role", "USER")).upper()
        is_admin = role == "ADMIN"

        server_id = self._server_id(text)

        # ---------------- DELETE SERVER ----------------

        if "delete server" in low or "remove server" in low:
            if not server_id:
                return "Please include a valid server ID, for example: Delete server SRV-10001."

            request = InfrastructureRequestCreate(
                request_type="DELETE_SERVER",
                target_id=server_id,
                payload={},
                reason=f"Delete server {server_id} requested through InfraMind AI.",
            )

        # ---------------- UPDATE SERVER ----------------

        elif any(
            word in low
            for word in (
                "update server",
                "modify server",
                "change server",
                "update memory",
                "update vcpu",
                "update disk",
                "change memory",
                "change vcpu",
                "change disk",
            )
        ):
            if not server_id:
                return "Please include a valid server ID, for example: Update server SRV-10001 memory to 32."

            field, value = self._parse_update(text)

            if not field:
                return (
                    "Please specify the field and new value. "
                    "Example: Update server SRV-10001 memory to 32."
                )

            request = InfrastructureRequestCreate(
                request_type="UPDATE_SERVER",
                target_id=server_id,
                payload={field: value},
                reason=f"Update {field} for {server_id} requested through InfraMind AI.",
            )

        # ---------------- ADD SERVER ----------------

        elif any(
            word in low
            for word in ("add server", "create server", "register server")
        ):
            server_id = (
                self._field_value(text, ["server_id", "server id"])
                or server_id
            )

            payload: dict[str, Any] = {
                "server_id": server_id,
                "server_name": self._field_value(text, ["server_name", "server name"]),
                "environment": self._field_value(text, ["environment"]),
                "region": self._field_value(text, ["region"]),
                "instance_type": self._field_value(text, ["instance_type", "instance type"]),
                "vcpu": self._field_value(text, ["vcpu", "vcpus"]),
                "memory": self._field_value(text, ["memory", "ram"]),
                "disk": self._field_value(text, ["disk", "storage"]),
                "os": self._field_value(text, ["os", "operating system"]),
                "patch_level": self._field_value(text, ["patch_level", "patch level"]),
                "cpu_utilization": self._field_value(text, ["cpu_utilization", "cpu utilization"]),
                "memory_utilization": self._field_value(text, ["memory_utilization", "memory utilization"]),
                "disk_utilization": self._field_value(text, ["disk_utilization", "disk utilization"]),
            }

            if not payload["server_id"]:
                return "Please provide a server ID, for example: Add server SRV-10050."

            # Support natural-language values such as "4 vCPU".
            if payload["vcpu"] is None:
                m = re.search(r"(\d+(?:\.\d+)?)\s*vcpus?", text, re.I)
                payload["vcpu"] = m.group(1) if m else None

            if payload["memory"] is None:
                m = re.search(r"(\d+(?:\.\d+)?)\s*(?:GB|GiB)?\s*(?:memory|RAM)", text, re.I)
                payload["memory"] = m.group(1) if m else None

            if payload["disk"] is None:
                m = re.search(r"(\d+(?:\.\d+)?)\s*(?:GB|TB)?\s*(?:disk|storage)", text, re.I)
                payload["disk"] = m.group(1) if m else None

            required = [
                "server_name",
                "environment",
                "region",
                "instance_type",
                "vcpu",
                "memory",
                "disk",
                "os",
                "patch_level",
                "cpu_utilization",
                "memory_utilization",
                "disk_utilization",
            ]

            missing = [key for key in required if payload.get(key) in (None, "")]

            if missing:
                return (
                    "To add a server, provide all required fields: "
                    "server_id, server_name, environment, region, "
                    "instance_type, vcpu, memory, disk, os, patch_level, "
                    "cpu_utilization, memory_utilization and disk_utilization. "
                    f"Missing: {', '.join(missing)}."
                )

            numeric_fields = [
                "vcpu",
                "memory",
                "disk",
                "cpu_utilization",
                "memory_utilization",
                "disk_utilization",
            ]

            try:
                for key in numeric_fields:
                    payload[key] = float(payload[key])
            except (TypeError, ValueError):
                return "Resource and utilization values must be numeric."

            request = InfrastructureRequestCreate(
                request_type="ADD_SERVER",
                target_id=server_id,
                payload=payload,
                reason=f"Add server {server_id} requested through InfraMind AI.",
            )

        else:
            return None

        # ---------------- USER: PENDING APPROVAL ----------------

        if not is_admin:
            created = await request_service.create(request, current_user)

            return (
                f"Your {request.request_type.replace('_', ' ').lower()} "
                f"request has been submitted successfully.\n\n"
                f"Request ID: {created['request_id']}\n"
                f"Status: PENDING\n\n"
                "An administrator must approve this request before "
                "any infrastructure data is changed."
            )

        # ---------------- ADMIN: DIRECT EXECUTION ----------------

        request_data = {
            "request_type": request.request_type,
            "target_id": request.target_id,
            "payload": request.payload,
            "requested_by": current_user.get("sub"),
            "approved_by": current_user.get("sub"),
        }

        result = await self.execution_service.execute(request_data)

        return (
            "Admin operation completed successfully.\n\n"
            f"Operation: {request.request_type}\n"
            f"Server: {request.target_id}\n"
            f"Result: {result.get('message', 'Completed')}\n\n"
            "The operation was executed against the infrastructure database."
        )


assistant_action_service = AssistantActionService()