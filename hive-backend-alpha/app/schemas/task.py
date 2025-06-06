from datetime import datetime
from uuid import UUID
from pydantic import BaseModel
from typing import Optional, List


class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    priority: Optional[str] = "medium"
    category: Optional[str] = None
    impact_points: Optional[int] = 100
    estimated_hours: Optional[str] = None
    location: Optional[str] = None
    team_size: Optional[str] = None
    due_date: Optional[str] = None
    required_skills: Optional[List[str]] = []


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    category: Optional[str] = None
    impact_points: Optional[int] = None
    estimated_hours: Optional[str] = None
    location: Optional[str] = None
    team_size: Optional[str] = None
    due_date: Optional[str] = None
    required_skills: Optional[List[str]] = None


class TaskAssign(BaseModel):
    user_id: UUID


class TaskStatusUpdate(BaseModel):
    status: str


class TaskResponse(BaseModel):
    id: UUID
    title: str
    description: Optional[str]
    status: str
    priority: str
    category: Optional[str]
    impact_points: int
    estimated_hours: Optional[str]
    location: Optional[str]
    team_size: Optional[str]
    due_date: Optional[str]
    required_skills: List[str]
    owner_id: UUID
    assignee_id: Optional[UUID]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True