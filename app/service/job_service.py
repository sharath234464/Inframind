from datetime import datetime, timezone
from uuid import uuid4

from fastapi import HTTPException
from apscheduler.triggers.cron import CronTrigger

from app.repository.job_repository import JobRepository


class JobService:
    def __init__(self):
        self.repository = JobRepository()
        self.scheduler = None
        self.executor = None

    def set_scheduler(self, scheduler):
        self.scheduler = scheduler

    @staticmethod
    def _is_admin(user):
        return str(user.get("role", "")).upper() == "ADMIN"

    @staticmethod
    def _user_id(user):
        return str(user.get("sub", ""))

    def _ensure_access(self, job, current_user):
        if not job:
            raise HTTPException(status_code=404, detail="Scheduled job not found")
        if not self._is_admin(current_user) and str(job.get("created_by")) != self._user_id(current_user):
            raise HTTPException(status_code=403, detail="You can only manage jobs you created")

    async def create_job(self, request, current_user):
        self._validate_cron(request.cron_expression)
        if not self.scheduler:
            raise HTTPException(status_code=503, detail="Scheduler is not initialized")

        job_id = f"JOB-{uuid4().hex[:8].upper()}"
        job_data = {
            "job_id": job_id,
            "name": request.name.strip(),
            "job_type": request.job_type,
            "cron_expression": request.cron_expression.strip(),
            "description": request.description,
            "enabled": request.enabled,
            "created_by": self._user_id(current_user),
            "created_by_role": str(current_user.get("role", "USER")).upper(),
            "last_run_at": None,
            "next_run_at": None,
        }
        created = await self.repository.create(job_data)
        try:
            if request.enabled:
                await self._register_scheduler_job(created)
        except Exception as exc:
            await self.repository.delete(job_id)
            raise HTTPException(status_code=400, detail=f"Could not schedule job: {exc}") from exc
        saved = await self.repository.find_by_id(job_id)
        return self._serialize(saved or created)

    async def get_jobs(self, current_user):
        owner = None if self._is_admin(current_user) else self._user_id(current_user)
        jobs = await self.repository.find_all(created_by=owner)
        return [self._serialize(job) for job in jobs]

    async def get_job(self, job_id, current_user):
        job = await self.repository.find_by_id(job_id)
        self._ensure_access(job, current_user)
        return self._serialize(job)

    async def update_job(self, job_id, request, current_user):
        existing = await self.repository.find_by_id(job_id)
        self._ensure_access(existing, current_user)
        update_data = {}
        if request.name is not None:
            update_data["name"] = request.name.strip()
        if request.cron_expression is not None:
            self._validate_cron(request.cron_expression)
            update_data["cron_expression"] = request.cron_expression.strip()
        if request.description is not None:
            update_data["description"] = request.description
        if request.enabled is not None:
            update_data["enabled"] = request.enabled

        if update_data:
            await self.repository.update(job_id, update_data)
        updated = await self.repository.find_by_id(job_id)
        try:
            await self._sync_scheduler_job(updated)
        except Exception as exc:
            # Keep the record visible and return a useful error instead of silently
            # reporting a successful schedule change.
            raise HTTPException(status_code=400, detail=f"Could not update scheduled job: {exc}") from exc
        return self._serialize(updated)

    async def delete_job(self, job_id, current_user):
        existing = await self.repository.find_by_id(job_id)
        self._ensure_access(existing, current_user)
        if self.scheduler:
            try:
                self.scheduler.remove_job(job_id)
            except Exception:
                pass
        await self.repository.delete(job_id)
        return {"message": "Scheduled job deleted successfully", "job_id": job_id}

    async def get_history(self, job_id, current_user):
        job = await self.repository.find_by_id(job_id)
        self._ensure_access(job, current_user)
        results = await self.repository.get_execution_history(job_id)
        for result in results:
            result["_id"] = str(result["_id"])
        return results

    def _validate_cron(self, expression):
        try:
            CronTrigger.from_crontab(expression)
        except (ValueError, TypeError) as exc:
            raise HTTPException(
                status_code=400,
                detail="Invalid cron expression. Use five fields: minute hour day-of-month month day-of-week. Example: 0 18 * * *",
            ) from exc

    async def _register_scheduler_job(self, job_data):
        if not self.scheduler or not self.executor:
            raise RuntimeError("Scheduler/executor is not initialized")
        trigger = CronTrigger.from_crontab(job_data["cron_expression"], timezone="UTC")
        now = datetime.now(timezone.utc)
        next_run = trigger.get_next_fire_time(None, now)
        self.scheduler.add_job(
            self.executor.execute_job,
            trigger=trigger,
            id=job_data["job_id"],
            args=[job_data["job_id"]],
            replace_existing=True,
            coalesce=True,
            max_instances=1,
        )
        if next_run:
            await self.repository.update(job_data["job_id"], {"next_run_at": next_run})

    async def _sync_scheduler_job(self, job_data):
        if not self.scheduler:
            raise RuntimeError("Scheduler is not initialized")
        try:
            self.scheduler.remove_job(job_data["job_id"])
        except Exception:
            pass
        if job_data.get("enabled", False):
            await self._register_scheduler_job(job_data)

    def _serialize(self, job):
        def iso(value):
            return value.isoformat() if hasattr(value, "isoformat") else value
        return {
            "job_id": job["job_id"],
            "name": job["name"],
            "job_type": job["job_type"],
            "cron_expression": job["cron_expression"],
            "description": job.get("description"),
            "enabled": bool(job.get("enabled", False)),
            "created_by": str(job.get("created_by", "")),
            "created_by_role": job.get("created_by_role"),
            "created_at": iso(job.get("created_at")),
            "last_run_at": iso(job.get("last_run_at")),
            "next_run_at": iso(job.get("next_run_at")),
        }


job_service = JobService()
