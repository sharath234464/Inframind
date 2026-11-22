from datetime import datetime, timezone

from apscheduler.triggers.cron import CronTrigger

from app.db_handler.mongodb import database


class JobExecutor:

    def __init__(self):
        self.repository = None

        self.analysis_collection = database[
            "analysis_results"
        ]

        self.inventory_collection = database[
            "server_inventory"
        ]

    def set_repository(self, repository):
        self.repository = repository

    async def execute_job(self, job_id: str):

        job = await self.repository.find_by_id(job_id)

        if not job or not job.get("enabled", False):
            return

        try:
            result = await self._run_job(job["job_type"])

            execution = {
                "job_id": job_id,
                "job_type": job["job_type"],
                "status": "SUCCESS",
                "result": result
            }

            await self.repository.save_execution_result(
                execution
            )

            completed_at = datetime.now(timezone.utc)

            trigger = CronTrigger.from_crontab(
                job["cron_expression"],
                timezone="UTC"
            )

            next_run = trigger.get_next_fire_time(
                completed_at,
                completed_at
            )

            await self.repository.update(
                job_id,
                {
                    "last_run_at": completed_at,
                    "next_run_at": next_run,
                }
            )

        except Exception as exc:

            await self.repository.save_execution_result(
                {
                    "job_id": job_id,
                    "job_type": job.get("job_type"),
                    "status": "FAILED",
                    "error": str(exc)
                }
            )

            completed_at = datetime.now(timezone.utc)

            try:
                trigger = CronTrigger.from_crontab(
                    job["cron_expression"],
                    timezone="UTC"
                )

                next_run = trigger.get_next_fire_time(
                    completed_at,
                    completed_at
                )

                await self.repository.update(
                    job_id,
                    {
                        "last_run_at": completed_at,
                        "next_run_at": next_run,
                    }
                )

            except Exception:
                pass

    async def _run_job(self, job_type: str):

        records = await self.analysis_collection.find(
            {}
        ).to_list(length=None)

        if not records:
            raise RuntimeError(
                "No comparison results exist yet. "
                "Run Admin > Analysis before executing this report job."
            )

        if job_type == "OVER_ALLOCATED_COUNT":

            count = sum(
                1
                for row in records
                if self._allocation(row) == "OVER ALLOCATED"
            )

            return {
                "metric": "over_allocated_servers",
                "count": count
            }

        if job_type == "UNDER_ALLOCATED_COUNT":

            count = sum(
                1
                for row in records
                if self._allocation(row) == "UNDER ALLOCATED"
            )

            return {
                "metric": "under_allocated_servers",
                "count": count
            }

        if job_type == "NON_COMPLIANT_COUNT":

            count = sum(
                1
                for row in records
                if self._is_non_compliant(row)
            )

            return {
                "metric": "non_compliant_servers",
                "count": count
            }

        if job_type == "PROBLEM_SERVERS":

            problems = [
                self._safe_server_summary(row)
                for row in records
                if self._is_problem(row)
            ]

            return {
                "metric": "problem_servers",
                "count": len(problems),
                "servers": problems[:100]
            }

        if job_type == "COMPLIANCE_SUMMARY":

            compliant = sum(
                1
                for row in records
                if self._is_compliant(row)
            )

            non_compliant = sum(
                1
                for row in records
                if self._is_non_compliant(row)
            )

            return {
                "total_analyzed": len(records),
                "compliant": compliant,
                "non_compliant": non_compliant
            }

        raise ValueError(
            f"Unsupported job type: {job_type}"
        )

    @staticmethod
    def _normalise(value: object) -> str:

        return " ".join(
            str(value or "")
            .upper()
            .replace("_", " ")
            .replace("-", " ")
            .split()
        )

    @classmethod
    def _allocation(cls, row: dict) -> str:

        if row.get("allocation_status"):
            return cls._normalise(
                row["allocation_status"]
            )

        classification = cls._normalise(
            row.get("classification")
        )

        if "OVER ALLOCATED" in classification:
            return "OVER ALLOCATED"

        if "UNDER ALLOCATED" in classification:
            return "UNDER ALLOCATED"

        if "PROPERLY ALLOCATED" in classification:
            return "PROPERLY ALLOCATED"

        return ""

    @classmethod
    def _utilization(cls, row: dict) -> str:

        if row.get("utilization_status"):
            return cls._normalise(
                row["utilization_status"]
            )

        classification = cls._normalise(
            row.get("classification")
        )

        for state in (
            "OVER UTILIZED",
            "UNDER UTILIZED",
            "PROPERLY UTILIZED"
        ):
            if state in classification:
                return state

        return ""

    @classmethod
    def _is_compliant(cls, row: dict) -> bool:

        value = cls._normalise(
            row.get("compliance_status")
        )

        if value:
            return value == "COMPLIANT"

        return (
            cls._normalise(
                row.get("classification")
            ) == "COMPLIANT"
        )

    @classmethod
    def _is_non_compliant(cls, row: dict) -> bool:

        value = cls._normalise(
            row.get("compliance_status")
        )

        if value:
            return value in {
                "NON COMPLIANT",
                "NONCOMPLIANT"
            }

        classification = cls._normalise(
            row.get("classification")
        )

        return bool(classification) and classification != "COMPLIANT"

    @classmethod
    def _is_problem(cls, row: dict) -> bool:

        return (
            cls._is_non_compliant(row)
            or cls._allocation(row) in {
                "OVER ALLOCATED",
                "UNDER ALLOCATED"
            }
            or cls._utilization(row) in {
                "OVER UTILIZED",
                "UNDER UTILIZED"
            }
        )

    @staticmethod
    def _safe_server_summary(record: dict) -> dict:

        nested = record.get("server") or {}

        return {
            "server_id": (
                record.get("server_id")
                or nested.get("server_id")
            ),

            "server_name": (
                record.get("server_name")
                or nested.get("server_name")
            ),

            "instance_type": (
                record.get("instance_type")
                or nested.get("instance_type")
            ),

            "classification": record.get("classification"),

            "allocation_status": record.get("allocation_status"),

            "utilization_status": record.get("utilization_status"),

            "compliance_status": record.get("compliance_status"),
        }