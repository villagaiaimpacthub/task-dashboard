from sqlalchemy import Column, String, Text, DateTime, Boolean, Integer, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from .base import BaseModel


class Project(BaseModel):
    __tablename__ = "projects"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String, nullable=False)
    description = Column(Text)
    status = Column(String, nullable=False, default="planning")  # planning, active, completed, on_hold
    priority = Column(String, nullable=False, default="medium")  # urgent, high, medium, low
    
    # Ownership and team
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    assignee_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    team_size = Column(Integer, default=1)
    
    # Timeline
    start_date = Column(DateTime, nullable=True)
    due_date = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    
    # Scope and impact
    category = Column(String, nullable=True)
    impact_points = Column(Integer, default=100)
    budget = Column(String, nullable=True)  # Can be "$5000" or "Volunteer"
    location = Column(String, nullable=True)
    
    # Project details
    success_metrics = Column(JSON, nullable=True)  # List of success criteria
    deliverables = Column(JSON, nullable=True)  # List of expected deliverables
    dependencies = Column(JSON, nullable=True)  # List of dependencies
    required_skills = Column(JSON, nullable=True)  # List of required skills
    
    # Definition of Done
    definition_of_done = Column(JSON, nullable=True)  # List of DoD items
    
    # Timestamps
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relationships
    owner = relationship("User", foreign_keys=[owner_id], back_populates="owned_projects")
    assignee = relationship("User", foreign_keys=[assignee_id], back_populates="assigned_projects")
    tasks = relationship("Task", back_populates="project", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Project(id={self.id}, title='{self.title}', status='{self.status}')>"