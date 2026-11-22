from fastapi import APIRouter, Depends

from app.core.auth_dependency import get_current_user
from app.schemas.job_schema import JobCreateRequest, JobUpdateRequest
from app.service.job_service import job_service

router = APIRouter(prefix="/jobs", tags=["Infrastructure Jobs"])


@router.post("")
async def create_job(request: JobCreateRequest, current_user: dict = Depends(get_current_user)):
    return await job_service.create_job(request, current_user)


@router.get("")
async def get_jobs(current_user: dict = Depends(get_current_user)):
    return await job_service.get_jobs(current_user)


@router.get("/{job_id}")
async def get_job(job_id: str, current_user: dict = Depends(get_current_user)):
    return await job_service.get_job(job_id, current_user)


@router.put("/{job_id}")
async def update_job(job_id: str, request: JobUpdateRequest, current_user: dict = Depends(get_current_user)):
    return await job_service.update_job(job_id, request, current_user)


@router.delete("/{job_id}")
async def delete_job(job_id: str, current_user: dict = Depends(get_current_user)):
    return await job_service.delete_job(job_id, current_user)


@router.get("/{job_id}/history")
async def get_job_history(job_id: str, current_user: dict = Depends(get_current_user)):
    return await job_service.get_history(job_id, current_user)
