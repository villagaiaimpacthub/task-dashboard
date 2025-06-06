from datetime import datetime
from uuid import UUID
from pydantic import BaseModel
from typing import Optional


class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None


class TaskAssign(BaseModel):
    user_id: UUID


class TaskStatusUpdate(BaseModel):
    status: str


class TaskResponse(BaseModel):
    id: UUID
    title: str
    description: Optional[str]
    status: str
    owner_id: UUID
    assignee_id: Optional[UUID]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True