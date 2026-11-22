from typing import List

from app.db_handler.mongodb import database


class GoldenRepository:
    def __init__(self):
        self.collection = database["golden_configuration"]

    async def insert_golden_configuration(
        self,
        golden_configuration: List[dict]
    ):
        if not golden_configuration:
            return 0

        result = await self.collection.insert_many(
            golden_configuration
        )

        return len(result.inserted_ids)

    async def get_existing_instance_types(
        self,
        instance_types: list[str]
    ):
        wanted = {
            str(value).strip().casefold()
            for value in instance_types
            if value
        }

        if not wanted:
            return []

        existing = await self.collection.find(
            {},
            {
                "_id": 0,
                "instance_type": 1
            }
        ).to_list(length=None)

        return [
            row.get("instance_type")
            for row in existing
            if str(
                row.get("instance_type", "")
            ).strip().casefold() in wanted
        ]

    async def upsert_golden_configurations(
        self,
        configurations: List[dict]
    ):
        """
        Insert new instance types and update existing ones
        case-insensitively.
        """

        if not configurations:
            return 0

        existing = await self.collection.find(
            {},
            {
                "_id": 0,
                "instance_type": 1
            }
        ).to_list(length=None)

        existing_by_key = {
            str(row.get("instance_type", "")).strip().casefold():
                row.get("instance_type")
            for row in existing
            if row.get("instance_type")
        }

        processed = 0

        for raw in configurations:
            document = dict(raw)

            instance_type = str(
                document.get("instance_type", "")
            ).strip()

            if not instance_type:
                raise ValueError(
                    "Every baseline must contain an instance_type."
                )

            document["instance_type"] = instance_type

            key = instance_type.casefold()
            stored_spelling = existing_by_key.get(key)

            if stored_spelling:
                await self.collection.update_one(
                    {
                        "instance_type": stored_spelling
                    },
                    {
                        "$set": document
                    }
                )
            else:
                await self.collection.insert_one(document)
                existing_by_key[key] = instance_type

            processed += 1

        return processed

    async def get_all_golden_configurations(self):
        return await self.collection.find(
            {},
            {
                "_id": 0
            }
        ).to_list(length=None)


golden_repository = GoldenRepository()