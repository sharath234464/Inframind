from datetime import datetime, timezone

from app.db_handler.mongodb import database
from app.utils.mongo_serialization import serialize_mongo


class GoldenGenerationRepository:

    def __init__(self):
        self.inventory_collection = database[
            "server_inventory"
        ]

        self.golden_collection = database[
            "golden_configuration"
        ]

        self.proposal_collection = database[
            "golden_configuration_proposals"
        ]

    async def get_inventory(
        self,
        instance_type: str | None = None
    ):
        rows = await self.inventory_collection.find(
            {},
            {
                "_id": 0
            }
        ).to_list(length=None)

        if not instance_type:
            return rows

        wanted = str(instance_type).strip().casefold()

        return [
            row
            for row in rows
            if str(
                row.get("instance_type", "")
            ).strip().casefold() == wanted
        ]

    async def create_proposal(self, proposal: dict):
        await self.proposal_collection.insert_one(proposal)

        return await self.get_proposal(
            proposal["proposal_id"]
        )

    async def get_proposal(self, proposal_id: str):
        document = await self.proposal_collection.find_one(
            {
                "proposal_id": proposal_id
            }
        )

        return serialize_mongo(document)

    async def get_proposals(
        self,
        created_by: str | None = None,
        status: str | None = None
    ):
        query = {}

        if created_by is not None:
            query["generated_by"] = created_by

        if status:
            query["status"] = status

        cursor = self.proposal_collection.find(
            query
        ).sort(
            "created_at",
            -1
        )

        return serialize_mongo(
            await cursor.to_list(length=None)
        )

    async def update_proposal(
        self,
        proposal_id: str,
        updates: dict,
        *,
        only_pending: bool = False
    ):
        query = {
            "proposal_id": proposal_id
        }

        if only_pending:
            query["status"] = "PENDING_APPROVAL"

        updates = {
            **updates,
            "updated_at": datetime.now(timezone.utc)
        }

        result = await self.proposal_collection.update_one(
            query,
            {
                "$set": updates
            }
        )

        if result.matched_count == 0:
            return None

        return await self.get_proposal(proposal_id)

    async def activate_golden_configuration(
        self,
        instance_type: str,
        configuration: dict
    ):
        """
        Called only after Admin approves an AI-generated proposal.
        """

        now = datetime.now(timezone.utc)
        requested = str(instance_type).strip()

        existing_rows = await self.golden_collection.find(
            {},
            {
                "_id": 0,
                "instance_type": 1
            }
        ).to_list(length=None)

        matched = next(
            (
                row.get("instance_type")
                for row in existing_rows
                if str(
                    row.get("instance_type", "")
                ).strip().casefold() == requested.casefold()
            ),
            None
        )

        payload = {
            **configuration,
            "instance_type": requested,
            "updated_at": now,
            "source": "approved_ai_inventory_proposal"
        }

        if matched:
            await self.golden_collection.update_one(
                {
                    "instance_type": matched
                },
                {
                    "$set": payload
                }
            )
        else:
            await self.golden_collection.insert_one(payload)

        document = await self.golden_collection.find_one(
            {
                "instance_type": matched or requested
            },
            {
                "_id": 0
            }
        )

        return serialize_mongo(document)


golden_generation_repository = GoldenGenerationRepository()