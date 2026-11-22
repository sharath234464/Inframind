from fastapi import APIRouter, Depends, File, UploadFile

from app.core.auth_dependency import require_admin

from app.schemas.upload_schema import UploadResponse
from app.schemas.golden_schema import GoldenUploadResponse
from app.service.upload_service import upload_service

router = APIRouter(
    prefix="/upload",
    tags=["Upload"]
)


@router.post(
    "/server",
    response_model=UploadResponse
)
async def upload_server_inventory(
    file: UploadFile = File(...),
    current_admin: dict = Depends(require_admin),
):
    return await upload_service.upload_inventory(file)


@router.post(
    "/golden",
    response_model=GoldenUploadResponse
)
async def upload_golden_configuration(
    file: UploadFile = File(...),
    current_admin: dict = Depends(require_admin),
):
    return await upload_service.upload_golden_configuration(file)