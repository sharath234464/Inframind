from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, Depends, HTTPException, status

from app.core.auth_dependency import get_current_user, require_admin
from app.repository.user_repository import UserRepository
from app.schemas.auth_schema import LoginRequest, TokenResponse, UserRegisterRequest
from app.service.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["Authentication"])


def get_auth_service() -> AuthService:
    return AuthService(user_repository=UserRepository())


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(
    request: UserRegisterRequest,
    service: AuthService = Depends(get_auth_service),
):
    # Never accept a role from public registration payloads.
    user = await service.register_user(
        name=request.name,
        email=str(request.email),
        password=request.password,
        role="USER",
    )
    return {
        "message": "User registered successfully",
        "user_id": str(user["_id"]),
        "role": "USER",
    }


@router.post("/login", response_model=TokenResponse)
async def login(
    request: LoginRequest,
    service: AuthService = Depends(get_auth_service),
):
    return await service.login(email=str(request.email), password=request.password)


@router.get("/me")
async def get_my_profile(current_user=Depends(get_current_user)):
    """Return the actual account profile from MongoDB, not only JWT claims."""
    try:
        user_id = ObjectId(current_user.get("sub", ""))
    except (InvalidId, TypeError):
        raise HTTPException(status_code=401, detail="Invalid user session")

    user = await UserRepository().find_by_id(user_id)
    if not user or not user.get("is_active", True):
        raise HTTPException(status_code=401, detail="User account not found or inactive")

    return {
        "user_id": str(user["_id"]),
        "name": user.get("name", "User"),
        "email": user.get("email", ""),
        "role": user.get("role", "USER"),
        "is_active": user.get("is_active", True),
    }


@router.post("/admin/register", status_code=status.HTTP_201_CREATED)
async def register_admin(
    request: UserRegisterRequest,
    current_admin=Depends(require_admin),
    service: AuthService = Depends(get_auth_service),
):
    """Only an already-authenticated administrator can create another admin."""
    user = await service.register_user(
        name=request.name,
        email=str(request.email),
        password=request.password,
        role="ADMIN",
    )
    return {
        "message": "Admin account created successfully",
        "user_id": str(user["_id"]),
        "role": "ADMIN",
        "created_by": current_admin.get("sub"),
    }
