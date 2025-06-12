from pydantic import BaseModel
from typing import Dict, Any, Optional
from uuid import UUID


class WebSocketMessage(BaseModel):
    type: str
    payload: Dict[str, Any]


class TaskStatusUpdate(BaseModel):
    type: str = "task_status_update"
    task_id: UUID
    new_status: str
    assignee_id: Optional[UUID] = None


class TaskAssignmentUpdate(BaseModel):
    type: str = "task_assignment_update"
    task_id: UUID
    assignee_id: Optional[UUID]
    assigned_by: UUID


class ChatMessage(BaseModel):
    type: str = "chat_message"
    message: str
    user_id: UUID


class TaskChatMessage(BaseModel):
    type: str = "task_chat_message"
    task_id: UUID
    message: str
    sender_id: UUID
    sender_email: str
    sender_role: Optional[str] = None


class DirectMessage(BaseModel):
    type: str = "direct_message"
    sender_id: UUID
    recipient_id: UUID
    message: str
    sender_email: str