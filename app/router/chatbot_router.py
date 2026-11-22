from fastapi import APIRouter, Depends

from app.core.auth_dependency import get_current_user

from app.schemas.chatbot_schema import ChatRequest, ChatResponse
from app.service.chatbot_service import chatbot_service

router = APIRouter(
    prefix="/chatbot",
    tags=["AI Chatbot"]
)


@router.post(
    "/chat",
    response_model=ChatResponse
)
async def chat(request: ChatRequest, current_user: dict = Depends(get_current_user)):

    answer = await chatbot_service.chat(request.question, current_user)

    return ChatResponse(
        answer=answer
    )