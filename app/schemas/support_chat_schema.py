from typing import Literal
from pydantic import BaseModel, Field


class ConversationCreate(BaseModel):
    subject: str = Field(min_length=3, max_length=140)
    message: str = Field(min_length=1, max_length=5000)


class MessageCreate(BaseModel):
    message: str = Field(min_length=1, max_length=5000)


class ConversationStatusUpdate(BaseModel):
    status: Literal["OPEN", "CLOSED"]
