from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, EmailStr
from typing import Optional


class UserCreate(BaseModel):
    email: EmailStr
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None


class UserResponse(BaseModel):
    id: UUID
    email: str
    is_active: bool
    is_online: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True