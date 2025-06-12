from sqlalchemy import Column, String, Text, ForeignKey, Integer, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from .base import BaseModel


class Task(BaseModel):
    __tablename__ = "tasks"
    
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String, nullable=False, default="draft")  # draft, available, in_progress, completed
    priority = Column(String, nullable=False, default="medium")  # urgent, high, medium, low
    category = Column(String, nullable=True)  # Regenerative Ag, Clean Energy, etc.
    impact_points = Column(Integer, default=100)
    estimated_hours = Column(String, nullable=True)  # e.g., "2-4 hours"
    location = Column(String, nullable=True)  # e.g., "North America", "Global"
    team_size = Column(String, nullable=True)  # e.g., "3-5"
    due_date = Column(String, nullable=True)  # e.g., "3 days", "1 week"
    required_skills = Column(JSON, default=list)  # List of skill strings
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    assignee_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    
    # Relationships
    owner = relationship("User", foreign_keys=[owner_id], backref="owned_tasks")
    assignee = relationship("User", foreign_keys=[assignee_id], backref="assigned_tasks")