from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, EmailStr
from typing import Optional, List


class UserCreate(BaseModel):
    email: EmailStr
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    skills: Optional[List[str]] = None
    role: Optional[str] = None
    status: Optional[str] = None


class UserResponse(BaseModel):
    id: UUID
    email: str
    is_active: bool
    is_online: bool
    impact_score: int
    skills: List[str]
    role: Optional[str]
    status: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True