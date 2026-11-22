from datetime import datetime, timezone
from uuid import uuid4

from app.db_handler.mongodb import database
from app.utils.mongo_serialization import serialize_mongo


class SupportChatRepository:
    def __init__(self):
        self.conversations = database["support_conversations"]
        self.messages = database["support_messages"]

    async def create_conversation(self, user: dict, subject: str, first_message: str):
        now = datetime.now(timezone.utc)
        conversation = {
            "conversation_id": f"CHAT-{uuid4().hex[:10].upper()}",
            "created_by": str(user.get("sub", "")),
            "created_by_role": str(user.get("role", "USER")).upper(),
            "subject": subject.strip(),
            "status": "OPEN",
            "last_message": first_message.strip(),
            "last_message_at": now,
            "created_at": now,
            "updated_at": now,
        }
        await self.conversations.insert_one(conversation)
        await self.add_message(conversation["conversation_id"], user, first_message)
        return serialize_mongo(conversation)

    async def list_conversations(self, user: dict):
        query = {} if str(user.get("role", "")).upper() == "ADMIN" else {"created_by": str(user.get("sub", ""))}
        cursor = self.conversations.find(query).sort("last_message_at", -1)
        return serialize_mongo(await cursor.to_list(length=None))

    async def get_conversation(self, conversation_id: str):
        return serialize_mongo(await self.conversations.find_one({"conversation_id": conversation_id}))

    async def list_messages(self, conversation_id: str):
        cursor = self.messages.find({"conversation_id": conversation_id}).sort("created_at", 1)
        return serialize_mongo(await cursor.to_list(length=None))

    async def add_message(self, conversation_id: str, user: dict, message: str):
        now = datetime.now(timezone.utc)
        record = {
            "message_id": f"MSG-{uuid4().hex[:12].upper()}",
            "conversation_id": conversation_id,
            "sender_id": str(user.get("sub", "")),
            "sender_role": str(user.get("role", "USER")).upper(),
            "message": message.strip(),
            "created_at": now,
        }
        await self.messages.insert_one(record)
        await self.conversations.update_one(
            {"conversation_id": conversation_id},
            {"$set": {"last_message": message.strip(), "last_message_at": now, "updated_at": now}},
        )
        return serialize_mongo(record)

    async def update_status(self, conversation_id: str, status: str):
        await self.conversations.update_one(
            {"conversation_id": conversation_id},
            {"$set": {"status": status, "updated_at": datetime.now(timezone.utc)}},
        )
        return await self.get_conversation(conversation_id)


support_chat_repository = SupportChatRepository()
