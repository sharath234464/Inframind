from fastapi import HTTPException

from app.repository.simulation_repository import SimulationRepository

from app.graph.classification_helper import classification_helper


class SimulationService:

    def __init__(self):
        self.repository = SimulationRepository()

    @staticmethod
    def _number(value, field: str, label: str) -> float:

        try:
            number = float(value)

        except (TypeError, ValueError):
            raise HTTPException(
                status_code=422,
                detail=f"{label} has a missing or invalid {field} value."
            )

        if number <= 0 and field in {"vcpu", "memory", "disk"}:
            raise HTTPException(
                status_code=422,
                detail=f"{label} {field} must be greater than zero."
            )

        return number

    async def simulate(self, request):

        server = await self.repository.get_server(
            request.server_id
        )

        if not server:
            raise HTTPException(
                status_code=404,
                detail="Server not found in approved inventory."
            )

        golden = await self.repository.get_golden_configuration(
            server.get("instance_type")
        )

        if not golden:
            raise HTTPException(
                status_code=404,
                detail=(
                    f"No active Golden Configuration exists for "
                    f"instance type '{server.get('instance_type')}'. "
                    "Upload the Golden Configuration Excel as Admin "
                    "or approve an AI-generated proposal first."
                )
            )

        server_required = (
            "vcpu",
            "memory",
            "disk",
            "cpu_utilization",
            "memory_utilization",
        )

        golden_required = (
            "vcpu",
            "memory",
            "disk",
            "target_cpu_utilization_min",
            "target_cpu_utilization_max",
            "target_memory_utilization_min",
            "target_memory_utilization_max",
        )

        missing_server = [
            key for key in server_required
            if server.get(key) is None
        ]

        missing_golden = [
            key for key in golden_required
            if golden.get(key) is None
        ]

        if missing_server or missing_golden:
            raise HTTPException(
                status_code=422,
                detail=(
                    f"Required simulation fields are missing. "
                    f"Server: {missing_server}; "
                    f"Golden Configuration: {missing_golden}."
                )
            )

        actual = dict(server)
        baseline = dict(golden)

        for key in (
            "vcpu",
            "memory",
            "disk",
            "cpu_utilization",
            "memory_utilization",
            "disk_utilization",
        ):
            if key in actual and actual[key] is not None:
                actual[key] = float(actual[key])

        for key in (
            "vcpu",
            "memory",
            "disk",
            "target_cpu_utilization_min",
            "target_cpu_utilization_max",
            "target_memory_utilization_min",
            "target_memory_utilization_max",
        ):
            if baseline.get(key) is None:
                raise HTTPException(
                    status_code=422,
                    detail=f"Golden Configuration is missing '{key}'."
                )

            baseline[key] = float(baseline[key])

        current_resources = {
            "vcpu": self._number(
                actual.get("vcpu"), "vcpu", "Server"
            ),
            "memory": self._number(
                actual.get("memory"), "memory", "Server"
            ),
            "disk": self._number(
                actual.get("disk"), "disk", "Server"
            ),
        }

        simulated_resources = {
            "vcpu": (
                float(request.vcpu)
                if request.vcpu is not None
                else current_resources["vcpu"]
            ),
            "memory": (
                float(request.memory)
                if request.memory is not None
                else current_resources["memory"]
            ),
            "disk": (
                float(request.disk)
                if request.disk is not None
                else current_resources["disk"]
            ),
        }

        for key, value in simulated_resources.items():
            self._number(value, key, "Simulated resources")

        current_allocation = (
            classification_helper.get_allocation_status(
                actual,
                baseline
            )
        )

        current_utilization = (
            classification_helper.get_utilization_status(
                actual,
                baseline
            )
        )

        current_classification = (
            classification_helper.get_classification(
                current_allocation,
                current_utilization
            )
        )

        # Estimate utilization after the resource change,
        # assuming workload demand remains constant.

        simulated = dict(actual)
        simulated.update(simulated_resources)

        simulated["cpu_utilization"] = (
            float(actual.get("cpu_utilization", 0))
            * current_resources["vcpu"]
            / simulated_resources["vcpu"]
        )

        simulated["memory_utilization"] = (
            float(actual.get("memory_utilization", 0))
            * current_resources["memory"]
            / simulated_resources["memory"]
        )

        simulated_allocation = (
            classification_helper.get_allocation_status(
                simulated,
                baseline
            )
        )

        simulated_utilization = (
            classification_helper.get_utilization_status(
                simulated,
                baseline
            )
        )

        simulated_classification = (
            classification_helper.get_classification(
                simulated_allocation,
                simulated_utilization
            )
        )

        if simulated_classification == current_classification:
            recommendation = (
                "The proposed resource change does not change "
                "the classification. Review cost and workload "
                "requirements before applying it."
            )
        else:
            recommendation = (
                f"The proposed change moves the server from "
                f"'{current_classification}' to "
                f"'{simulated_classification}'. This is an estimate "
                "assuming workload demand remains constant; "
                "validate with monitoring data before applying it."
            )

        return {
            "server_id": request.server_id,
            "instance_type": server.get("instance_type"),

            "current": {
                "resources": current_resources,
                "allocation_state": current_allocation,
                "utilization_state": current_utilization,
                "classification": current_classification,
            },

            "simulated": {
                "resources": simulated_resources,
                "estimated_cpu_utilization": round(
                    simulated["cpu_utilization"], 2
                ),
                "estimated_memory_utilization": round(
                    simulated["memory_utilization"], 2
                ),
                "allocation_state": simulated_allocation,
                "utilization_state": simulated_utilization,
                "classification": simulated_classification,
            },

            "allocation_change": (
                f"{current_allocation} -> {simulated_allocation}"
            ),

            "utilization_change": (
                f"{current_utilization} -> {simulated_utilization}"
            ),

            "current_classification": current_classification,
            "simulated_classification": simulated_classification,
            "recommendation": recommendation,
            "reason": request.reason,

            "note": (
                "What-if simulation only. "
                "No live server configuration was changed."
            ),
        }


simulation_service = SimulationService()