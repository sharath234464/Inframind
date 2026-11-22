import math
from datetime import datetime, timezone

from fastapi import HTTPException

from app.repository.inventory_repository import inventory_repository
from app.repository.golden_repository import golden_repository
from app.repository.analysis_repository import analysis_repository
from app.repository.recommendation_repository import recommendation_repository

from app.schemas.comparison_schema import ComparisonResponse

from app.graph.classification_helper import classification_helper


class ComparisonService:

    REQUIRED_INVENTORY_FIELDS = (
        "server_id",
        "instance_type",
        "vcpu",
        "memory",
        "disk",
        "cpu_utilization",
        "memory_utilization",
        "disk_utilization",
    )

    REQUIRED_GOLDEN_FIELDS = (
        "instance_type",
        "vcpu",
        "memory",
        "disk",
        "target_cpu_utilization_min",
        "target_cpu_utilization_max",
        "target_memory_utilization_min",
        "target_memory_utilization_max",
    )

    @staticmethod
    def _key(value) -> str:
        return str(value or "").strip().casefold()

    @staticmethod
    def _as_number(value, field: str, record_name: str) -> float:

        try:
            number = float(value)

        except (TypeError, ValueError):
            raise HTTPException(
                status_code=422,
                detail=(
                    f"{record_name} has a missing or "
                    f"non-numeric '{field}' value."
                )
            )

        if not math.isfinite(number):
            raise HTTPException(
                status_code=422,
                detail=f"{record_name} has an invalid '{field}' value."
            )

        return number

    async def compare_servers(self) -> ComparisonResponse:

        # LOAD APPROVED INVENTORY

        inventory = await inventory_repository.get_all_inventory()

        if not inventory:
            raise HTTPException(
                status_code=400,
                detail=(
                    "No approved server inventory exists. "
                    "Submit inventory as User and approve it as Admin first."
                )
            )

        # LOAD ACTIVE GOLDEN CONFIGURATION BASELINES

        golden_rows = (
            await golden_repository.get_all_golden_configurations()
        )

        if not golden_rows:
            raise HTTPException(
                status_code=400,
                detail=(
                    "No active Golden Configuration baselines exist. "
                    "Either upload data/golden_configuration.xlsx from "
                    "the Admin Golden Configuration page, or generate "
                    "AI proposals and approve them first."
                )
            )

        golden_map = {}

        for row in golden_rows:
            key = self._key(row.get("instance_type"))

            if key:
                golden_map[key] = row

        results = []
        unmatched_types = set()
        skipped_missing = []

        compared_at = datetime.now(timezone.utc)

        # COMPARE EACH SERVER

        for server in inventory:

            server_id = str(
                server.get("server_id") or "UNKNOWN"
            )

            instance_type = str(
                server.get("instance_type") or ""
            ).strip()

            baseline = golden_map.get(
                self._key(instance_type)
            )

            if baseline is None:
                unmatched_types.add(
                    instance_type or "<missing instance_type>"
                )
                continue

            missing_inventory = [
                field
                for field in self.REQUIRED_INVENTORY_FIELDS
                if server.get(field) is None
            ]

            missing_golden = [
                field
                for field in self.REQUIRED_GOLDEN_FIELDS
                if baseline.get(field) is None
            ]

            if missing_inventory or missing_golden:
                skipped_missing.append(
                    f"{server_id}: inventory missing {missing_inventory}; "
                    f"baseline missing {missing_golden}"
                )
                continue

            actual = dict(server)
            golden = dict(baseline)

            for field in (
                "vcpu",
                "memory",
                "disk",
                "cpu_utilization",
                "memory_utilization",
                "disk_utilization",
            ):
                actual[field] = self._as_number(
                    actual.get(field),
                    field,
                    f"Server {server_id}"
                )

            for field in (
                "vcpu",
                "memory",
                "disk",
                "target_cpu_utilization_min",
                "target_cpu_utilization_max",
                "target_memory_utilization_min",
                "target_memory_utilization_max",
            ):
                golden[field] = self._as_number(
                    golden.get(field),
                    field,
                    f"Golden baseline {instance_type}"
                )

            # ALLOCATION CLASSIFICATION

            allocation = (
                classification_helper.get_allocation_status(
                    actual,
                    golden
                )
            )

            # UTILIZATION CLASSIFICATION

            utilization = (
                classification_helper.get_utilization_status(
                    actual,
                    golden
                )
            )

            # FINAL NINE-STATE CLASSIFICATION

            classification = (
                classification_helper.get_classification(
                    allocation,
                    utilization
                )
            )

            compliance = (
                "Compliant"
                if classification == "Compliant"
                else "Non-Compliant"
            )

            results.append({
                "server_id": server_id,
                "server_name": server.get("server_name"),
                "environment": server.get("environment"),
                "region": server.get("region"),
                "instance_type": instance_type,

                "allocation_status": allocation,
                "utilization_status": utilization,
                "classification": classification,
                "compliance_status": compliance,

                "actual_vcpu": actual["vcpu"],
                "actual_memory": actual["memory"],
                "actual_disk": actual["disk"],

                "golden_vcpu": golden["vcpu"],
                "golden_memory": golden["memory"],
                "golden_disk": golden["disk"],

                "cpu_utilization": actual["cpu_utilization"],
                "memory_utilization": actual["memory_utilization"],
                "disk_utilization": actual["disk_utilization"],

                "target_cpu_utilization_min": (
                    golden["target_cpu_utilization_min"]
                ),

                "target_cpu_utilization_max": (
                    golden["target_cpu_utilization_max"]
                ),

                "target_memory_utilization_min": (
                    golden["target_memory_utilization_min"]
                ),

                "target_memory_utilization_max": (
                    golden["target_memory_utilization_max"]
                ),

                "created_at": compared_at,
            })

        if skipped_missing:
            raise HTTPException(
                status_code=422,
                detail=(
                    f"Comparison stopped: {len(skipped_missing)} "
                    "matched server(s) or baselines have missing "
                    "required values. Examples: "
                    + "; ".join(skipped_missing[:5])
                )
            )

        if not results:
            missing = (
                ", ".join(sorted(unmatched_types))
                or "unknown instance types"
            )

            raise HTTPException(
                status_code=400,
                detail=(
                    "No servers matched an active Golden Configuration. "
                    f"Inventory instance types without baselines: {missing}. "
                    "Upload/update the Excel baselines or approve matching "
                    "AI proposals."
                )
            )

        # DELETE OLD RESULTS ONLY AFTER A VALID COMPARISON IS READY

        await analysis_repository.delete_previous_results()

        compared = await analysis_repository.insert_analysis_results(
            results
        )

        # Remove stale recommendations from the previous comparison.
        await recommendation_repository.delete_previous_recommendations()

        message = (
            f"Comparison completed for {compared} of "
            f"{len(inventory)} inventory servers."
        )

        if unmatched_types:
            message += (
                " No baseline for: "
                + ", ".join(sorted(unmatched_types))
                + "."
            )

        return ComparisonResponse(
            status=True,
            message=message,
            compared_servers=compared
        )


comparison_service = ComparisonService()