from fastapi import APIRouter, Depends

from app.core.auth_dependency import get_current_user
from app.schemas.support_chat_schema import ConversationCreate, MessageCreate, ConversationStatusUpdate
from app.service.support_chat_service import support_chat_service

router = APIRouter(prefix="/support-chat", tags=["User-Admin Messaging"])


@router.get("/conversations")
async def list_conversations(current_user: dict = Depends(get_current_user)):
    return await support_chat_service.list_conversations(current_user)


@router.post("/conversations")
async def create_conversation(payload: ConversationCreate, current_user: dict = Depends(get_current_user)):
    return await support_chat_service.create_conversation(payload, current_user)


@router.get("/conversations/{conversation_id}/messages")
async def list_messages(conversation_id: str, current_user: dict = Depends(get_current_user)):
    return await support_chat_service.list_messages(conversation_id, current_user)


@router.post("/conversations/{conversation_id}/messages")
async def send_message(conversation_id: str, payload: MessageCreate, current_user: dict = Depends(get_current_user)):
    return await support_chat_service.send_message(conversation_id, payload, current_user)


@router.patch("/conversations/{conversation_id}/status")
async def update_conversation_status(conversation_id: str, payload: ConversationStatusUpdate, current_user: dict = Depends(get_current_user)):
    return await support_chat_service.update_status(conversation_id, payload.status, current_user)
