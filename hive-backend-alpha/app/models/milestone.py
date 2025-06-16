from sqlalchemy import Column, String, Text, ForeignKey, Boolean, DateTime, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from .base import BaseModel


class Milestone(BaseModel):
    __tablename__ = "milestones"
    
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String, nullable=False, default="pending")  # pending, in_progress, completed
    is_completed = Column(Boolean, default=False)
    completed_at = Column(DateTime, nullable=True)
    due_date = Column(String, nullable=True)  # e.g., "3 days", "1 week"
    task_id = Column(UUID(as_uuid=True), ForeignKey("tasks.id"), nullable=False)
    
    # Relationships
    task = relationship("Task", back_populates="milestones")
    
    __table_args__ = (
        Index('idx_milestone_status', 'status'),
        Index('idx_milestone_task_id', 'task_id'),
        Index('idx_milestone_is_completed', 'is_completed'),
    )