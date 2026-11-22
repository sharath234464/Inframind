from apscheduler.schedulers.asyncio import AsyncIOScheduler

from app.repository.job_repository import JobRepository
from app.service.job_executor import JobExecutor
from app.service.job_service import job_service


scheduler = AsyncIOScheduler(timezone="UTC")
repository = JobRepository()
executor = JobExecutor()
executor.set_repository(repository)
job_service.set_scheduler(scheduler)
job_service.executor = executor


async def start_scheduler():
    if scheduler.running:
        return

    # Load each enabled persisted job. A malformed legacy job is logged and
    # skipped instead of preventing the API and frontend from starting.
    jobs = await repository.find_all()
    for job in jobs:
        if not job.get("enabled", False):
            continue
        try:
            await job_service._register_scheduler_job(job)
        except Exception as exc:
            print(f"Skipping invalid scheduled job {job.get('job_id')}: {exc}")

    scheduler.start()


async def stop_scheduler():
    if scheduler.running:
        scheduler.shutdown(wait=False)
