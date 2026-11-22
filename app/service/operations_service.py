from app.repository.operations_repository import (
    OperationsRepository
)


class OperationsService:

    def __init__(self):

        self.repository = OperationsRepository()

    async def get_summary(self):

        total_servers = (
            await self.repository.get_total_servers()
        )

        compliant_servers = (
            await self.repository.get_compliant_servers()
        )

        non_compliant_servers = (
            await self.repository.get_non_compliant_servers()
        )

        open_alerts = (
            await self.repository.get_open_alerts()
        )

        critical_alerts = (
            await self.repository.get_critical_alerts()
        )

        high_risk_servers = (
            await self.repository.get_high_risk_servers()
        )

        pending_requests = (
            await self.repository.get_pending_requests()
        )

        active_jobs = (
            await self.repository.get_active_jobs()
        )

        pending_proposals = (
            await self.repository.get_pending_proposals()
        )

        recent_activity = (
            await self.repository.get_recent_activity()
        )

        return {
            "total_servers": total_servers,
            "compliant_servers": compliant_servers,
            "non_compliant_servers": non_compliant_servers,
            "open_alerts": open_alerts,
            "critical_alerts": critical_alerts,
            "high_risk_servers": high_risk_servers,
            "pending_requests": pending_requests,
            "active_scheduled_jobs": active_jobs,
            "pending_golden_proposals": pending_proposals,
            "recent_activity": recent_activity
        }


operations_service = OperationsService()