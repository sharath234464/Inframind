from app.db_handler.mongodb import database


class OperationsRepository:

    def __init__(self):
        self.inventory = database["server_inventory"]
        self.analysis = database["analysis_results"]
        self.alerts = database["infrastructure_alerts"]
        self.requests = database["infrastructure_requests"]
        self.jobs = database["scheduled_jobs"]
        self.proposals = database[
            "golden_configuration_proposals"
        ]
        self.audit = database["audit_logs"]

    async def get_total_servers(self):

        return await self.inventory.count_documents({})

    async def get_compliant_servers(self):

        return await self.analysis.count_documents(
            {
                "$or": [
                    {
                        "classification": {
                            "$regex": "COMPLIANT",
                            "$options": "i"
                        }
                    },
                    {
                        "compliance_status": "COMPLIANT"
                    }
                ]
            }
        )

    async def get_non_compliant_servers(self):

        return await self.analysis.count_documents(
            {
                "$or": [
                    {
                        "classification": {
                            "$regex": "NON.?COMPLIANT",
                            "$options": "i"
                        }
                    },
                    {
                        "compliance_status": "NON_COMPLIANT"
                    }
                ]
            }
        )

    async def get_open_alerts(self):

        return await self.alerts.count_documents(
            {
                "status": "OPEN"
            }
        )

    async def get_critical_alerts(self):

        return await self.alerts.count_documents(
            {
                "status": "OPEN",
                "severity": "CRITICAL"
            }
        )

    async def get_high_risk_servers(self):

        return await database[
            "server_health_scores"
        ].count_documents(
            {
                "risk_level": {
                    "$in": [
                        "HIGH",
                        "CRITICAL"
                    ]
                }
            }
        )

    async def get_pending_requests(self):

        return await self.requests.count_documents(
            {
                "status": "PENDING"
            }
        )

    async def get_active_jobs(self):

        return await self.jobs.count_documents(
            {
                "enabled": True
            }
        )

    async def get_pending_proposals(self):

        return await self.proposals.count_documents(
            {
                "status": "PENDING_APPROVAL"
            }
        )

    async def get_recent_activity(
        self,
        limit: int = 10
    ):

        cursor = self.audit.find().sort(
            "created_at",
            -1
        ).limit(limit)

        return await cursor.to_list(
            length=limit
        )