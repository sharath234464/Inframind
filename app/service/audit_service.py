from uuid import uuid4

from app.repository.audit_repository import AuditRepository


class AuditService:

    def __init__(self):

        self.repository = AuditRepository()

    async def log_action(
        self,
        user_id: str,
        action: str,
        entity_type: str,
        entity_id: str | None = None,
        description: str | None = None,
        status: str = "SUCCESS"
    ):

        audit_log = {
            "audit_id": (
                f"AUDIT-{uuid4().hex[:8].upper()}"
            ),
            "user_id": user_id,
            "action": action,
            "entity_type": entity_type,
            "entity_id": entity_id,
            "description": description,
            "status": status
        }

        return await self.repository.create(
            audit_log
        )

    async def get_all(self):

        return await self.repository.find_all()

    async def get_user_history(
        self,
        user_id: str
    ):

        return await self.repository.find_by_user(
            user_id
        )

    async def get_entity_history(
        self,
        entity_type: str,
        entity_id: str
    ):

        return await self.repository.find_by_entity(
            entity_type,
            entity_id
        )


audit_service = AuditService()