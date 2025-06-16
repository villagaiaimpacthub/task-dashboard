from sqlalchemy import Column, String, Text, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from .base import BaseModel


class Comment(BaseModel):
    __tablename__ = "comments"
    
    content = Column(Text, nullable=False)
    task_id = Column(UUID(as_uuid=True), ForeignKey("tasks.id"), nullable=False)
    author_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    # Relationships
    task = relationship("Task", backref="comments")
    author = relationship("User", backref="comments")
    
    __table_args__ = (
        Index('idx_comment_task_id', 'task_id'),
        Index('idx_comment_author_id', 'author_id'),
    )