from datetime import datetime, timezone

from app.db_handler.mongodb import database


class AlertRepository:

    def __init__(self):
        self.collection = database["infrastructure_alerts"]

    # ============================================================
    # CREATE ALERT
    # ============================================================

    async def create(
        self,
        alert: dict
    ):

        alert["created_at"] = datetime.now(
            timezone.utc
        )

        result = await self.collection.insert_one(
            alert
        )

        alert["_id"] = result.inserted_id

        return alert

    # ============================================================
    # FIND ALERT BY ID
    # ============================================================

    async def find_by_id(
        self,
        alert_id: str
    ):

        return await self.collection.find_one(
            {
                "alert_id": alert_id
            }
        )

    # ============================================================
    # FIND EXISTING OPEN ALERT
    # ============================================================

    async def find_open_alert(
        self,
        server_id: str,
        alert_type: str
    ):

        return await self.collection.find_one(
            {
                "server_id": server_id,
                "alert_type": alert_type,
                "status": "OPEN"
            }
        )

    # ============================================================
    # FIND ALL ALERTS
    # ============================================================

    async def find_all(self):

        cursor = self.collection.find(
            {}
        ).sort(
            "created_at",
            -1
        )

        return await cursor.to_list(
            length=500
        )

    # ============================================================
    # FIND ALERTS FOR A SERVER
    # ============================================================

    async def find_by_server(
        self,
        server_id: str
    ):

        cursor = self.collection.find(
            {
                "server_id": server_id
            }
        ).sort(
            "created_at",
            -1
        )

        return await cursor.to_list(
            length=100
        )

    # ============================================================
    # UPDATE ALERT STATUS
    # ============================================================

    async def update_status(
        self,
        alert_id: str,
        status: str
    ):

        return await self.collection.update_one(
            {
                "alert_id": alert_id
            },
            {
                "$set": {
                    "status": status,
                    "updated_at": datetime.now(
                        timezone.utc
                    )
                }
            }
        )


alert_repository = AlertRepository()