from sqlalchemy import Column, String, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from .base import BaseModel


class Task(BaseModel):
    __tablename__ = "tasks"
    
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String, nullable=False, default="draft")  # draft, available, in_progress, completed
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    assignee_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    
    # Relationships
    owner = relationship("User", foreign_keys=[owner_id], backref="owned_tasks")
    assignee = relationship("User", foreign_keys=[assignee_id], backref="assigned_tasks")