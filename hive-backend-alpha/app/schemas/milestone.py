from datetime import datetime
from uuid import UUID
from pydantic import BaseModel
from typing import Optional


class MilestoneCreate(BaseModel):
    title: str
    description: Optional[str] = None
    due_date: Optional[str] = None
    task_id: UUID


class MilestoneUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    is_completed: Optional[bool] = None
    due_date: Optional[str] = None


class MilestoneResponse(BaseModel):
    id: UUID
    title: str
    description: Optional[str]
    status: str
    is_completed: bool
    completed_at: Optional[datetime]
    due_date: Optional[str]
    task_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True