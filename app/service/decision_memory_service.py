from uuid import uuid4

from app.repository.decision_memory_repository import (
    DecisionMemoryRepository
)


class DecisionMemoryService:

    def __init__(self):

        self.repository = (
            DecisionMemoryRepository()
        )

    async def store_decision(
        self,
        request,
        current_user
    ):

        memory_id = (
            f"MEM-{uuid4().hex[:8].upper()}"
        )

        memory = {
            "memory_id": memory_id,

            "server_id":
                request.server_id,

            "issue_type":
                request.issue_type,

            "classification":
                request.classification,

            "decision":
                request.decision,

            "action":
                request.action,

            "reason":
                request.reason,

            "outcome":
                request.outcome,

            "created_by":
                current_user["sub"]
        }

        created = await self.repository.create(
            memory
        )

        return {
            "memory_id":
                created["memory_id"],

            "message":
                "Decision stored successfully"
        }

    async def find_similar_decisions(
        self,
        issue_type: str,
        classification: str | None = None
    ):

        memories = (
            await self.repository.find_similar(
                issue_type,
                classification
            )
        )

        for memory in memories:

            memory["_id"] = str(
                memory["_id"]
            )

        return memories

    async def get_all(self):

        memories = (
            await self.repository.find_all()
        )

        for memory in memories:

            memory["_id"] = str(
                memory["_id"]
            )

        return memories


decision_memory_service = (
    DecisionMemoryService()
)