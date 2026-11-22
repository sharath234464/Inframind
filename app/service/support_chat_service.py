from fastapi import HTTPException
from app.repository.support_chat_repository import support_chat_repository


class SupportChatService:
    @staticmethod
    def _admin(user: dict) -> bool:
        return str(user.get("role", "")).upper() == "ADMIN"

    async def _authorized_conversation(self, conversation_id: str, user: dict):
        conversation = await support_chat_repository.get_conversation(conversation_id)
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found.")
        if not self._admin(user) and conversation.get("created_by") != str(user.get("sub", "")):
            raise HTTPException(status_code=403, detail="You can only access conversations you created.")
        return conversation

    async def list_conversations(self, user: dict):
        return await support_chat_repository.list_conversations(user)

    async def create_conversation(self, payload, user: dict):
        if self._admin(user):
            raise HTTPException(status_code=400, detail="Admins reply to User conversations. Start a conversation from a User account.")
        return await support_chat_repository.create_conversation(user, payload.subject, payload.message)

    async def list_messages(self, conversation_id: str, user: dict):
        await self._authorized_conversation(conversation_id, user)
        return await support_chat_repository.list_messages(conversation_id)

    async def send_message(self, conversation_id: str, payload, user: dict):
        conversation = await self._authorized_conversation(conversation_id, user)
        if conversation.get("status") == "CLOSED":
            raise HTTPException(status_code=409, detail="This conversation is closed.")
        return await support_chat_repository.add_message(conversation_id, user, payload.message)

    async def update_status(self, conversation_id: str, status: str, user: dict):
        if not self._admin(user):
            raise HTTPException(status_code=403, detail="Only Admin can close or reopen a conversation.")
        await self._authorized_conversation(conversation_id, user)
        return await support_chat_repository.update_status(conversation_id, status)


support_chat_service = SupportChatService()
