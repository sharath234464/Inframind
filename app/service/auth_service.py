from fastapi import HTTPException, status

from app.core.security import (
    hash_password,
    verify_password,
    create_access_token
)


class AuthService:

    def __init__(self, user_repository):
        self.user_repository = user_repository

    async def register_user(
        self,
        name: str,
        email: str,
        password: str,
        role: str = "USER"
    ):

        existing_user = await self.user_repository.find_by_email(
            email
        )

        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An account with this email already exists."
            )

        role = role.upper()

        if role not in {"USER", "ADMIN"}:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid account role."
            )

        user = {
            "name": name.strip(),
            "email": email.lower().strip(),
            "password": hash_password(password),
            "role": role,
            "is_active": True
        }

        return await self.user_repository.create_user(user)

    async def login(
        self,
        email: str,
        password: str
    ):

        user = await self.user_repository.find_by_email(
            email
        )

        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )

        if not verify_password(
            password,
            user["password"]
        ):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )

        if not user.get("is_active", True):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is inactive"
            )

        token = create_access_token(
            str(user["_id"]),
            user["role"]
        )

        return {
            "access_token": token,
            "token_type": "bearer"
        }