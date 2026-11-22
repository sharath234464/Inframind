from datetime import datetime, timezone

from app.db_handler.mongodb import database


class JobRepository:

    def __init__(self):

        self.jobs = database["scheduled_jobs"]

        self.execution_results = database[
            "job_execution_results"
        ]

    async def create(self, job_data: dict):

        now = datetime.now(timezone.utc)

        job_data["created_at"] = now
        job_data["updated_at"] = now

        result = await self.jobs.insert_one(
            job_data
        )

        job_data["_id"] = result.inserted_id

        return job_data

    async def find_by_id(
        self,
        job_id: str
    ):

        return await self.jobs.find_one(
            {"job_id": job_id}
        )

    async def find_all(self, created_by=None):

        query = {} if created_by is None else {"created_by": created_by}
        cursor = self.jobs.find(query).sort(
            "created_at",
            -1
        )

        return await cursor.to_list(
            length=None
        )

    async def update(
        self,
        job_id: str,
        update_data: dict
    ):

        update_data["updated_at"] = (
            datetime.now(timezone.utc)
        )

        result = await self.jobs.update_one(
            {"job_id": job_id},
            {"$set": update_data}
        )

        return result.modified_count > 0

    async def delete(
        self,
        job_id: str
    ):

        result = await self.jobs.delete_one(
            {"job_id": job_id}
        )

        return result.deleted_count > 0

    async def save_execution_result(
        self,
        result_data: dict
    ):

        result_data["executed_at"] = (
            datetime.now(timezone.utc)
        )

        await self.execution_results.insert_one(
            result_data
        )

        return result_data

    async def get_execution_history(
        self,
        job_id: str
    ):

        cursor = self.execution_results.find(
            {"job_id": job_id}
        ).sort(
            "executed_at",
            -1
        )

        return await cursor.to_list(
            length=None
        )