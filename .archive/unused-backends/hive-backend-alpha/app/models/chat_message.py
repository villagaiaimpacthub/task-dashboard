from sqlalchemy import Column, String, Text, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from .base import BaseModel
import enum


class MessageType(str, enum.Enum):
    TASK_CHAT = "task_chat"
    DIRECT_MESSAGE = "direct_message"
    SYSTEM = "system"


class ChatMessage(BaseModel):
    __tablename__ = "chat_messages"
    
    content = Column(Text, nullable=False)
    message_type = Column(Enum(MessageType), nullable=False, default=MessageType.TASK_CHAT)
    
    # For task chat messages
    task_id = Column(UUID(as_uuid=True), ForeignKey("tasks.id"), nullable=True)
    
    # For direct messages
    recipient_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    
    # Common fields
    sender_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    # Relationships
    task = relationship("Task", backref="chat_messages")
    sender = relationship("User", foreign_keys=[sender_id], backref="sent_messages")
    recipient = relationship("User", foreign_keys=[recipient_id], backref="received_messages")