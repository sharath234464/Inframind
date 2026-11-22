from uuid import uuid4

from app.repository.alert_repository import AlertRepository
from app.utils.mongo_serialization import serialize_mongo


class AlertService:

    def __init__(self):

        self.repository = AlertRepository()

    # ============================================================
    # CREATE ALERT
    # ============================================================

    async def create_alert(
        self,
        server_id: str,
        alert_type: str,
        severity: str,
        title: str,
        message: str,
        recommendation: str | None = None
    ):

        # --------------------------------------------------------
        # Check whether an identical OPEN alert already exists
        # --------------------------------------------------------

        existing_alert = (
            await self.repository.find_open_alert(
                server_id,
                alert_type
            )
        )

        if existing_alert:

            return serialize_mongo(existing_alert)

        # --------------------------------------------------------
        # Create new alert
        # --------------------------------------------------------

        alert = {
            "alert_id": (
                f"ALERT-{uuid4().hex[:8].upper()}"
            ),

            "server_id": server_id,

            "alert_type": alert_type,

            "severity": severity,

            "title": title,

            "message": message,

            "recommendation": recommendation,

            "status": "OPEN"
        }

        created = await self.repository.create(alert)
        return serialize_mongo(created)

    # ============================================================
    # GET ALERT
    # ============================================================

    async def get_alert(
        self,
        alert_id: str
    ):

        return serialize_mongo(await self.repository.find_by_id(alert_id))

    # ============================================================
    # GET ALL ALERTS
    # ============================================================

    async def get_all_alerts(self):

        return serialize_mongo(await self.repository.find_all())

    # ============================================================
    # GET SERVER ALERTS
    # ============================================================

    async def get_server_alerts(
        self,
        server_id: str
    ):

        return serialize_mongo(await self.repository.find_by_server(server_id))

    # ============================================================
    # RESOLVE ALERT
    # ============================================================

    async def resolve_alert(
        self,
        alert_id: str
    ):

        await self.repository.update_status(
            alert_id,
            "RESOLVED"
        )

        return serialize_mongo(await self.repository.find_by_id(alert_id))


alert_service = AlertService()