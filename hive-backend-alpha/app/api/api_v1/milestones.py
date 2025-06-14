from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from uuid import UUID

from app.dependencies import get_current_user, get_db
from app.models.user import User
from app.models.milestone import Milestone
from app.models.task import Task
from app.schemas.milestone import MilestoneCreate, MilestoneUpdate, MilestoneResponse
from app.services.milestone_service import create_milestone, update_milestone, delete_milestone

router = APIRouter()


@router.post("/", response_model=MilestoneResponse)
async def create_milestone_endpoint(
    milestone_data: MilestoneCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new milestone for a task"""
    # Verify the task exists and user has permission
    result = await db.execute(select(Task).where(Task.id == milestone_data.task_id))
    task = result.scalar_one_or_none()
    
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Check if user is the owner or assignee
    if task.owner_id != current_user.id and task.assignee_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to add milestones to this task")
    
    return await create_milestone(db, milestone_data)


@router.get("/task/{task_id}", response_model=List[MilestoneResponse])
async def get_task_milestones(
    task_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all milestones for a specific task"""
    # Verify the task exists and user has permission
    result = await db.execute(select(Task).where(Task.id == task_id))
    task = result.scalar_one_or_none()
    
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Check if user is the owner or assignee
    if task.owner_id != current_user.id and task.assignee_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view milestones for this task")
    
    result = await db.execute(
        select(Milestone)
        .where(Milestone.task_id == task_id)
        .order_by(Milestone.created_at)
    )
    milestones = result.scalars().all()
    
    return milestones


@router.get("/{milestone_id}", response_model=MilestoneResponse)
async def get_milestone(
    milestone_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a specific milestone"""
    result = await db.execute(select(Milestone).where(Milestone.id == milestone_id))
    milestone = result.scalar_one_or_none()
    
    if not milestone:
        raise HTTPException(status_code=404, detail="Milestone not found")
    
    # Check if user has permission to view this milestone
    task_result = await db.execute(select(Task).where(Task.id == milestone.task_id))
    task = task_result.scalar_one_or_none()
    
    if not task or (task.owner_id != current_user.id and task.assignee_id != current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized to view this milestone")
    
    return milestone


@router.put("/{milestone_id}", response_model=MilestoneResponse)
async def update_milestone_endpoint(
    milestone_id: UUID,
    milestone_data: MilestoneUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update a milestone"""
    result = await db.execute(select(Milestone).where(Milestone.id == milestone_id))
    milestone = result.scalar_one_or_none()
    
    if not milestone:
        raise HTTPException(status_code=404, detail="Milestone not found")
    
    # Check if user has permission to update this milestone
    task_result = await db.execute(select(Task).where(Task.id == milestone.task_id))
    task = task_result.scalar_one_or_none()
    
    if not task or (task.owner_id != current_user.id and task.assignee_id != current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized to update this milestone")
    
    return await update_milestone(db, milestone_id, milestone_data)


@router.delete("/{milestone_id}")
async def delete_milestone_endpoint(
    milestone_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a milestone"""
    result = await db.execute(select(Milestone).where(Milestone.id == milestone_id))
    milestone = result.scalar_one_or_none()
    
    if not milestone:
        raise HTTPException(status_code=404, detail="Milestone not found")
    
    # Check if user has permission to delete this milestone
    task_result = await db.execute(select(Task).where(Task.id == milestone.task_id))
    task = task_result.scalar_one_or_none()
    
    if not task or (task.owner_id != current_user.id and task.assignee_id != current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized to delete this milestone")
    
    await delete_milestone(db, milestone_id)
    return {"message": "Milestone deleted successfully"}