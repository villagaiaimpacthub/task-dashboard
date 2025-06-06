from pydantic import BaseModel
from typing import Dict, List
from datetime import datetime


class TaskStats(BaseModel):
    """Task statistics breakdown."""
    total: int
    by_status: Dict[str, int]
    by_priority: Dict[str, int] = {}  # Placeholder for future priority field
    by_category: Dict[str, int] = {}  # Placeholder for future category field


class UserStats(BaseModel):
    """User statistics breakdown."""
    total_users: int
    active_users: int
    online_users: int


class DashboardSummaryResponse(BaseModel):
    """Complete dashboard summary response."""
    tasks: TaskStats
    users: UserStats
    last_updated: datetime
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class LiveStatusResponse(BaseModel):
    """Live status indicators for dashboard."""
    online_users_count: int
    active_tasks_count: int
    recent_activity_count: int
    system_status: str = "operational"


class OnlineUserResponse(BaseModel):
    """Basic online user information for dashboard."""
    id: str
    email: str
    is_online: bool
    last_seen: datetime = None
    
    class Config:
        from_attributes = True