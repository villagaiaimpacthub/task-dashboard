from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime
from uuid import UUID

from app.models.milestone import Milestone
from app.schemas.milestone import MilestoneCreate, MilestoneUpdate


async def create_milestone(db: AsyncSession, milestone_data: MilestoneCreate) -> Milestone:
    """Create a new milestone"""
    milestone = Milestone(
        title=milestone_data.title,
        description=milestone_data.description,
        due_date=milestone_data.due_date,
        task_id=milestone_data.task_id
    )
    
    db.add(milestone)
    await db.commit()
    await db.refresh(milestone)
    return milestone


async def update_milestone(db: AsyncSession, milestone_id: UUID, milestone_data: MilestoneUpdate) -> Milestone:
    """Update an existing milestone"""
    result = await db.execute(select(Milestone).where(Milestone.id == milestone_id))
    milestone = result.scalar_one()
    
    # Update fields if provided
    if milestone_data.title is not None:
        milestone.title = milestone_data.title
    if milestone_data.description is not None:
        milestone.description = milestone_data.description
    if milestone_data.status is not None:
        milestone.status = milestone_data.status
    if milestone_data.is_completed is not None:
        milestone.is_completed = milestone_data.is_completed
        if milestone_data.is_completed and not milestone.completed_at:
            milestone.completed_at = datetime.utcnow()
        elif not milestone_data.is_completed:
            milestone.completed_at = None
    if milestone_data.due_date is not None:
        milestone.due_date = milestone_data.due_date
    
    await db.commit()
    await db.refresh(milestone)
    return milestone


async def delete_milestone(db: AsyncSession, milestone_id: UUID) -> None:
    """Delete a milestone"""
    result = await db.execute(select(Milestone).where(Milestone.id == milestone_id))
    milestone = result.scalar_one()
    
    await db.delete(milestone)
    await db.commit()