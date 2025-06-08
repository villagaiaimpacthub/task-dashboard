from datetime import datetime
from uuid import UUID
from pydantic import BaseModel
from typing import Optional, List
from enum import Enum


class MessageType(str, Enum):
    TASK_CHAT = "task_chat"
    DIRECT_MESSAGE = "direct_message"
    SYSTEM = "system"


class ChatMessageCreate(BaseModel):
    content: str
    message_type: MessageType = MessageType.TASK_CHAT
    task_id: Optional[UUID] = None
    recipient_id: Optional[UUID] = None


class ChatMessageResponse(BaseModel):
    id: UUID
    content: str
    message_type: MessageType
    task_id: Optional[UUID]
    recipient_id: Optional[UUID]
    sender_id: UUID
    created_at: datetime
    
    class Config:
        from_attributes = True


class ChatMessageWithSender(ChatMessageResponse):
    sender_email: str
    sender_role: Optional[str] = None
    sender_is_online: bool = False


class TaskChatRoom(BaseModel):
    task_id: UUID
    task_title: str
    participants: List[dict]  # List of users in the task
    last_message: Optional[ChatMessageWithSender] = None
    unread_count: int = 0