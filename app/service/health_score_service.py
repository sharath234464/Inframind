from app.repository.health_repository import HealthRepository
from app.repository.inventory_repository import InventoryRepository


class HealthScoreService:

    def __init__(self):

        self.repository = HealthRepository()
        self.inventory_repository = InventoryRepository()

    # ============================================================
    # CALCULATE HEALTH SCORE
    # ============================================================

    def calculate_health_score(
        self,
        server: dict
    ):

        score = 100.0

        risk_factors = []

        # --------------------------------------------------------
        # RESOURCE UTILIZATION
        # --------------------------------------------------------

        cpu = float(
            server.get("cpu_utilization", 0)
        )

        memory = float(
            server.get("memory_utilization", 0)
        )

        disk = float(
            server.get("disk_utilization", 0)
        )

        # --------------------------------------------------------
        # CLASSIFICATION
        # --------------------------------------------------------

        classification = str(
            server.get("classification", "")
        ).upper()

        compliance_status = str(
            server.get("compliance_status", "")
        ).upper()

        # ========================================================
        # CPU RISK
        # ========================================================

        if cpu > 90:

            score -= 25

            risk_factors.append(
                "Critical CPU utilization"
            )

        elif cpu > 80:

            score -= 15

            risk_factors.append(
                "High CPU utilization"
            )

        elif cpu > 70:

            score -= 8

            risk_factors.append(
                "Elevated CPU utilization"
            )

        # ========================================================
        # MEMORY RISK
        # ========================================================

        if memory > 90:

            score -= 25

            risk_factors.append(
                "Critical memory utilization"
            )

        elif memory > 80:

            score -= 15

            risk_factors.append(
                "High memory utilization"
            )

        elif memory > 70:

            score -= 8

            risk_factors.append(
                "Elevated memory utilization"
            )

        # ========================================================
        # DISK RISK
        # ========================================================

        if disk > 90:

            score -= 20

            risk_factors.append(
                "Critical disk utilization"
            )

        elif disk > 80:

            score -= 12

            risk_factors.append(
                "High disk utilization"
            )

        elif disk > 70:

            score -= 5

            risk_factors.append(
                "Elevated disk utilization"
            )

        # ========================================================
        # CLASSIFICATION RISK
        # ========================================================

        if (
            "UNDER ALLOCATED" in classification
            and
            "OVER UTILIZED" in classification
        ):

            score -= 20

            risk_factors.append(
                "Under-allocated and over-utilized"
            )

        elif (
            "OVER ALLOCATED" in classification
            and
            "UNDER UTILIZED" in classification
        ):

            score -= 10

            risk_factors.append(
                "Over-allocated and under-utilized"
            )

        # ========================================================
        # COMPLIANCE RISK
        # ========================================================

        if (
            compliance_status == "NON-COMPLIANT"
            or
            compliance_status == "NON COMPLIANT"
        ):

            score -= 15

            risk_factors.append(
                "Golden Configuration non-compliance"
            )

        # ========================================================
        # KEEP SCORE BETWEEN 0 AND 100
        # ========================================================

        score = max(
            0,
            min(100, score)
        )

        # ========================================================
        # RISK LEVEL
        # ========================================================

        if score >= 80:

            risk_level = "LOW"

        elif score >= 60:

            risk_level = "MEDIUM"

        elif score >= 40:

            risk_level = "HIGH"

        else:

            risk_level = "CRITICAL"

        # ========================================================
        # RECOMMENDATION
        # ========================================================

        if risk_level == "CRITICAL":

            recommendation = (
                "Immediate infrastructure review "
                "and remediation are recommended."
            )

        elif risk_level == "HIGH":

            recommendation = (
                "Review resource allocation and "
                "resolve the identified infrastructure risks."
            )

        elif risk_level == "MEDIUM":

            recommendation = (
                "Monitor the server and consider "
                "resource optimization."
            )

        else:

            recommendation = (
                "Infrastructure is currently operating "
                "within acceptable risk levels."
            )

        return {
            "server_id": server.get("server_id"),
            "server_name": server.get("server_name"),
            "instance_type": server.get("instance_type"),
            "environment": server.get("environment"),
            "region": server.get("region"),
            "vcpu": server.get("vcpu"),
            "memory": server.get("memory"),
            "disk": server.get("disk"),
            "os": server.get("os"),
            "patch_level": server.get("patch_level"),
            "cpu_utilization": server.get("cpu_utilization"),
            "memory_utilization": server.get("memory_utilization"),
            "disk_utilization": server.get("disk_utilization"),
            "allocation_status": server.get("allocation_status"),
            "utilization_status": server.get("utilization_status"),
            "classification": server.get("classification"),
            "compliance_status": server.get("compliance_status"),
            "health_score": round(score, 2),
            "risk_level": risk_level,
            "risk_factors": risk_factors,
            "recommendation": recommendation,
        }

    # ============================================================
    # CALCULATE AND SAVE
    # ============================================================

    async def calculate_and_save(
        self,
        server: dict
    ):

        result = self.calculate_health_score(
            server
        )

        return await self.repository.save(
            result
        )

    # ============================================================
    # GET SERVER HEALTH
    # ============================================================

    async def get_server_health(self, server_id: str):
        server = await self.inventory_repository.find_by_server_id(server_id)
        if not server:
            return None
        existing = await self.repository.find_by_server(server_id)
        if not existing:
            existing = await self.calculate_and_save(server)
        return {**server, **(existing or {})}

    # ============================================================
    # GET ALL HEALTH SCORES / SERVER INVENTORY VIEW
    # ============================================================

    async def get_all_health_scores(self):
        # The Servers and Health pages need to show uploaded inventory even
        # before a comparison/AI run has materialized derived health records.
        inventory = await self.inventory_repository.get_all_inventory()
        if not inventory:
            return []

        existing = await self.repository.find_all()
        by_server = {item.get("server_id"): item for item in existing if item.get("server_id")}
        missing = [row for row in inventory if row.get("server_id") not in by_server]

        import asyncio
        for offset in range(0, len(missing), 40):
            batch = missing[offset:offset + 40]
            await asyncio.gather(*(self.calculate_and_save(row) for row in batch))

        refreshed = await self.repository.find_all()
        by_server = {item.get("server_id"): item for item in refreshed if item.get("server_id")}

        merged = []
        for server in inventory:
            health = by_server.get(server.get("server_id"), {})
            merged.append({**server, **health})
        return merged



health_score_service = HealthScoreService()