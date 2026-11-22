from pydantic import BaseModel, EmailStr, Field


class UserRegisterRequest(BaseModel):
    """Public registration always creates a standard USER account."""
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    user_id: str
    name: str
    email: EmailStr
    role: str
    is_active: bool = True
