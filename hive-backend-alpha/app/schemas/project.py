from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field
from typing import Optional, List, Any


class ProjectBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    status: str = Field(default="planning")  # planning, active, completed, on_hold
    priority: str = Field(default="medium")  # urgent, high, medium, low
    category: Optional[str] = None
    impact_points: int = Field(default=100, ge=0)
    budget: Optional[str] = None
    location: Optional[str] = None
    team_size: int = Field(default=1, ge=1)
    start_date: Optional[datetime] = None
    due_date: Optional[datetime] = None
    success_metrics: Optional[List[str]] = None
    deliverables: Optional[List[str]] = None
    dependencies: Optional[List[str]] = None
    required_skills: Optional[List[str]] = None
    definition_of_done: Optional[str] = None


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    category: Optional[str] = None
    impact_points: Optional[int] = Field(None, ge=0)
    budget: Optional[str] = None
    location: Optional[str] = None
    team_size: Optional[int] = Field(None, ge=1)
    start_date: Optional[datetime] = None
    due_date: Optional[datetime] = None
    success_metrics: Optional[List[str]] = None
    deliverables: Optional[List[str]] = None
    dependencies: Optional[List[str]] = None
    required_skills: Optional[List[str]] = None
    definition_of_done: Optional[str] = None
    assignee_id: Optional[UUID] = None
    completed_at: Optional[datetime] = None


class ProjectResponse(ProjectBase):
    id: UUID
    owner_id: UUID
    assignee_id: Optional[UUID] = None
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class ProjectWithTasks(ProjectResponse):
    task_count: int = 0
    completed_tasks: int = 0
    
    class Config:
        from_attributes = True


class ProjectSummary(BaseModel):
    total_projects: int
    by_status: dict
    by_priority: dict
    recent_activity: List[dict]