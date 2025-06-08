from datetime import datetime
from typing import Dict, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.models.user import User
from app.models.task import Task
from app.schemas.dashboard import (
    DashboardSummaryResponse, 
    TaskStats, 
    UserStats, 
    LiveStatusResponse
)


async def get_task_statistics(db: AsyncSession) -> TaskStats:
    """Get task statistics and breakdowns."""
    # Get total tasks
    total_tasks_result = await db.execute(select(func.count(Task.id)))
    total_tasks = total_tasks_result.scalar() or 0
    
    # Get tasks by status
    status_result = await db.execute(
        select(Task.status, func.count(Task.id))
        .group_by(Task.status)
    )
    status_breakdown = {status: count for status, count in status_result.fetchall()}
    
    # Ensure all status types are represented
    all_statuses = ["draft", "available", "in_progress", "completed"]
    for status in all_statuses:
        if status not in status_breakdown:
            status_breakdown[status] = 0
    
    return TaskStats(
        total=total_tasks,
        by_status=status_breakdown,
        by_priority={},  # Placeholder for future implementation
        by_category={}   # Placeholder for future implementation
    )


async def get_user_statistics(db: AsyncSession) -> UserStats:
    """Get user statistics and breakdowns."""
    # Get total users
    total_users_result = await db.execute(select(func.count(User.id)))
    total_users = total_users_result.scalar() or 0
    
    # Get active users
    active_users_result = await db.execute(
        select(func.count(User.id)).where(User.is_active == True)
    )
    active_users = active_users_result.scalar() or 0
    
    # Get online users
    online_users_result = await db.execute(
        select(func.count(User.id)).where(User.is_online == True)
    )
    online_users = online_users_result.scalar() or 0
    
    return UserStats(
        total_users=total_users,
        active_users=active_users,
        online_users=online_users
    )


async def get_dashboard_summary(db: AsyncSession) -> DashboardSummaryResponse:
    """Get complete dashboard summary with all statistics."""
    task_stats = await get_task_statistics(db)
    user_stats = await get_user_statistics(db)
    
    return DashboardSummaryResponse(
        tasks=task_stats,
        users=user_stats,
        last_updated=datetime.utcnow()
    )


async def get_live_status(db: AsyncSession) -> LiveStatusResponse:
    """Get live status indicators for real-time dashboard updates."""
    # Get online users count
    online_users_result = await db.execute(
        select(func.count(User.id)).where(User.is_online == True)
    )
    online_users = online_users_result.scalar() or 0
    
    # Get active tasks (in_progress status)
    active_tasks_result = await db.execute(
        select(func.count(Task.id)).where(Task.status == "in_progress")
    )
    active_tasks = active_tasks_result.scalar() or 0
    
    # Get recent activity count (tasks updated in last hour - placeholder)
    # For alpha, we'll just count total tasks as "recent activity"
    recent_activity_result = await db.execute(select(func.count(Task.id)))
    recent_activity = recent_activity_result.scalar() or 0
    
    return LiveStatusResponse(
        online_users_count=online_users,
        active_tasks_count=active_tasks,
        recent_activity_count=recent_activity,
        system_status="operational"
    )


async def get_online_users(db: AsyncSession, limit: int = 100) -> List[User]:
    """Get list of currently online users."""
    result = await db.execute(
        select(User)
        .where(User.is_online == True)
        .limit(limit)
        .order_by(User.updated_at.desc())
    )
    return result.scalars().all()