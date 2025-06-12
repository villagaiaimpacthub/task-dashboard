from datetime import datetime
from uuid import UUID
from pydantic import BaseModel
from typing import Optional


class CommentCreate(BaseModel):
    content: str
    task_id: UUID


class CommentUpdate(BaseModel):
    content: str


class CommentResponse(BaseModel):
    id: UUID
    content: str
    task_id: UUID
    author_id: UUID
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class CommentWithAuthor(CommentResponse):
    author_email: Optional[str] = None
    author_role: Optional[str] = None