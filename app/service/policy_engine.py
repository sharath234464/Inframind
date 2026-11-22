class PolicyEngine:

    def evaluate_server(self, server: dict):

        alerts = []

        server_id = server.get("server_id")

        cpu = float(
            server.get("cpu_utilization", 0)
        )

        memory = float(
            server.get("memory_utilization", 0)
        )

        disk = float(
            server.get("disk_utilization", 0)
        )

        classification = str(
            server.get("classification", "")
        ).upper()

        compliance_status = str(
            server.get("compliance_status", "")
        ).upper()

        # ========================================================
        # POLICY 1 — HIGH CPU
        # ========================================================

        if cpu > 90:

            alerts.append({
                "server_id": server_id,
                "alert_type": "HIGH_CPU",
                "severity": "CRITICAL",
                "title": "High CPU Utilization",
                "message": (
                    f"CPU utilization is {cpu}%, "
                    "which exceeds the critical threshold of 90%."
                ),
                "recommendation": (
                    "Increase CPU capacity or investigate "
                    "the workload causing excessive utilization."
                )
            })

        # ========================================================
        # POLICY 2 — HIGH MEMORY
        # ========================================================

        if memory > 90:

            alerts.append({
                "server_id": server_id,
                "alert_type": "HIGH_MEMORY",
                "severity": "CRITICAL",
                "title": "High Memory Utilization",
                "message": (
                    f"Memory utilization is {memory}%, "
                    "which exceeds the critical threshold of 90%."
                ),
                "recommendation": (
                    "Increase memory allocation or investigate "
                    "memory-intensive workloads."
                )
            })

        # ========================================================
        # POLICY 3 — HIGH DISK
        # ========================================================

        if disk > 90:

            alerts.append({
                "server_id": server_id,
                "alert_type": "HIGH_DISK",
                "severity": "CRITICAL",
                "title": "High Disk Utilization",
                "message": (
                    f"Disk utilization is {disk}%, "
                    "which exceeds the critical threshold of 90%."
                ),
                "recommendation": (
                    "Increase disk capacity or remove "
                    "unnecessary data."
                )
            })

        # ========================================================
        # POLICY 4 — UNDER ALLOCATED + OVER UTILIZED
        # ========================================================

        if (
            "UNDER ALLOCATED" in classification
            and
            "OVER UTILIZED" in classification
        ):

            alerts.append({
                "server_id": server_id,
                "alert_type": "RESOURCE_SHORTAGE",
                "severity": "HIGH",
                "title": "Resource Shortage Detected",
                "message": (
                    "The server is under-allocated and "
                    "over-utilized."
                ),
                "recommendation": (
                    "Increase the server's CPU, memory, "
                    "or other required resources."
                )
            })

        # ========================================================
        # POLICY 5 — OVER ALLOCATED + UNDER UTILIZED
        # ========================================================

        if (
            "OVER ALLOCATED" in classification
            and
            "UNDER UTILIZED" in classification
        ):

            alerts.append({
                "server_id": server_id,
                "alert_type": "RESOURCE_WASTAGE",
                "severity": "MEDIUM",
                "title": "Resource Wastage Detected",
                "message": (
                    "The server is over-allocated but "
                    "under-utilized."
                ),
                "recommendation": (
                    "Consider reducing allocated resources "
                    "to improve resource efficiency."
                )
            })

        # ========================================================
        # POLICY 6 — NON-COMPLIANT
        # ========================================================

        if (
            compliance_status == "NON-COMPLIANT"
            or
            compliance_status == "NON COMPLIANT"
        ):

            alerts.append({
                "server_id": server_id,
                "alert_type": "NON_COMPLIANCE",
                "severity": "HIGH",
                "title": "Golden Configuration Violation",
                "message": (
                    "The server does not comply with "
                    "the approved Golden Configuration."
                ),
                "recommendation": (
                    "Review the Golden Configuration "
                    "requirements and remediate the server."
                )
            })

        return alerts


policy_engine = PolicyEngine()