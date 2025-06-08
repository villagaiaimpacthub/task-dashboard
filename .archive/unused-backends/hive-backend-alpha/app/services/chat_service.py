from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import desc, and_, or_
from typing import List, Optional
from datetime import datetime

from ..models.chat_message import ChatMessage, MessageType
from ..models.user import User
from ..models.task import Task
from ..schemas.chat import ChatMessageCreate, ChatMessageWithSender, TaskChatRoom


class ChatService:
    def __init__(self, db: Session):
        self.db = db
    
    def create_task_chat_message(self, task_id: UUID, sender_id: UUID, content: str) -> ChatMessage:
        """Create a new chat message for a task."""
        message = ChatMessage(
            content=content,
            message_type=MessageType.TASK_CHAT,
            task_id=task_id,
            sender_id=sender_id
        )
        self.db.add(message)
        self.db.commit()
        self.db.refresh(message)
        return message
    
    def create_direct_message(self, sender_id: UUID, recipient_id: UUID, content: str) -> ChatMessage:
        """Create a direct message between two users."""
        message = ChatMessage(
            content=content,
            message_type=MessageType.DIRECT_MESSAGE,
            sender_id=sender_id,
            recipient_id=recipient_id
        )
        self.db.add(message)
        self.db.commit()
        self.db.refresh(message)
        return message
    
    def get_task_chat_messages(
        self, 
        task_id: UUID, 
        limit: int = 50, 
        offset: int = 0
    ) -> List[ChatMessageWithSender]:
        """Get chat messages for a specific task."""
        messages = (
            self.db.query(
                ChatMessage,
                User.email,
                User.role,
                User.is_online
            )
            .join(User, ChatMessage.sender_id == User.id)
            .filter(
                ChatMessage.task_id == task_id,
                ChatMessage.message_type == MessageType.TASK_CHAT
            )
            .order_by(desc(ChatMessage.created_at))
            .offset(offset)
            .limit(limit)
            .all()
        )
        
        result = []
        for message, sender_email, sender_role, is_online in messages:
            message_dict = {
                "id": message.id,
                "content": message.content,
                "message_type": message.message_type,
                "task_id": message.task_id,
                "sender_id": message.sender_id,
                "created_at": message.created_at,
                "sender_email": sender_email,
                "sender_role": sender_role,
                "sender_is_online": is_online
            }
            result.append(ChatMessageWithSender(**message_dict))
        
        # Reverse to get chronological order (oldest first)
        return list(reversed(result))
    
    def get_direct_messages(
        self,
        user_id: UUID,
        other_user_id: UUID,
        limit: int = 50,
        offset: int = 0
    ) -> List[ChatMessageWithSender]:
        """Get direct messages between two users."""
        messages = (
            self.db.query(
                ChatMessage,
                User.email,
                User.role,
                User.is_online
            )
            .join(User, ChatMessage.sender_id == User.id)
            .filter(
                ChatMessage.message_type == MessageType.DIRECT_MESSAGE,
                or_(
                    and_(
                        ChatMessage.sender_id == user_id,
                        ChatMessage.recipient_id == other_user_id
                    ),
                    and_(
                        ChatMessage.sender_id == other_user_id,
                        ChatMessage.recipient_id == user_id
                    )
                )
            )
            .order_by(desc(ChatMessage.created_at))
            .offset(offset)
            .limit(limit)
            .all()
        )
        
        result = []
        for message, sender_email, sender_role, is_online in messages:
            message_dict = {
                "id": message.id,
                "content": message.content,
                "message_type": message.message_type,
                "recipient_id": message.recipient_id,
                "sender_id": message.sender_id,
                "created_at": message.created_at,
                "sender_email": sender_email,
                "sender_role": sender_role,
                "sender_is_online": is_online
            }
            result.append(ChatMessageWithSender(**message_dict))
        
        # Reverse to get chronological order (oldest first)
        return list(reversed(result))
    
    def get_user_task_chat_rooms(self, user_id: UUID) -> List[TaskChatRoom]:
        """Get all task chat rooms for a user (tasks they own or are assigned to)."""
        # Get tasks where user is owner or assignee
        tasks = self.db.query(Task).filter(
            or_(
                Task.owner_id == user_id,
                Task.assignee_id == user_id
            )
        ).all()
        
        chat_rooms = []
        for task in tasks:
            # Get participants (owner and assignee)
            participants = []
            
            # Add owner
            owner = self.db.query(User).filter(User.id == task.owner_id).first()
            if owner:
                participants.append({
                    "id": str(owner.id),
                    "email": owner.email,
                    "role": owner.role or "Task Owner",
                    "is_online": owner.is_online
                })
            
            # Add assignee if different from owner
            if task.assignee_id and task.assignee_id != task.owner_id:
                assignee = self.db.query(User).filter(User.id == task.assignee_id).first()
                if assignee:
                    participants.append({
                        "id": str(assignee.id),
                        "email": assignee.email,
                        "role": assignee.role or "Assigned",
                        "is_online": assignee.is_online
                    })
            
            # Get last message
            last_message_data = (
                self.db.query(
                    ChatMessage,
                    User.email,
                    User.role,
                    User.is_online
                )
                .join(User, ChatMessage.sender_id == User.id)
                .filter(
                    ChatMessage.task_id == task.id,
                    ChatMessage.message_type == MessageType.TASK_CHAT
                )
                .order_by(desc(ChatMessage.created_at))
                .first()
            )
            
            last_message = None
            if last_message_data:
                message, sender_email, sender_role, is_online = last_message_data
                last_message = ChatMessageWithSender(
                    id=message.id,
                    content=message.content,
                    message_type=message.message_type,
                    task_id=message.task_id,
                    sender_id=message.sender_id,
                    created_at=message.created_at,
                    sender_email=sender_email,
                    sender_role=sender_role,
                    sender_is_online=is_online
                )
            
            chat_rooms.append(TaskChatRoom(
                task_id=task.id,
                task_title=task.title,
                participants=participants,
                last_message=last_message,
                unread_count=0  # TODO: Implement read receipts
            ))
        
        return chat_rooms
    
    def can_user_access_task_chat(self, user_id: UUID, task_id: UUID) -> bool:
        """Check if a user can access a task's chat (owner or assignee)."""
        task = self.db.query(Task).filter(Task.id == task_id).first()
        if not task:
            return False
        
        return task.owner_id == user_id or task.assignee_id == user_id