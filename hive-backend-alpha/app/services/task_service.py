from typing import List, Optional
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.models.task import Task
from app.models.user import User
from app.schemas.task import TaskCreate, TaskUpdate
from app.websockets.connection_manager import manager
from app.schemas.websocket import TaskStatusUpdate as WSTaskStatusUpdate


async def create_task(db: AsyncSession, task_create: TaskCreate, owner: User) -> Task:
    task = Task(
        title=task_create.title,
        description=task_create.description,
        priority=task_create.priority,
        category=task_create.category,
        impact_points=task_create.impact_points,
        estimated_hours=task_create.estimated_hours,
        location=task_create.location,
        team_size=task_create.team_size,
        due_date=task_create.due_date,
        required_skills=task_create.required_skills,
        dependencies=task_create.dependencies,
        definition_of_done=task_create.definition_of_done,
        success_metrics=task_create.success_metrics,
        deliverables=task_create.deliverables,
        owner_id=owner.id,
        project_id=task_create.project_id
    )
    db.add(task)
    await db.commit()
    await db.refresh(task)
    return task


async def get_task_by_id(db: AsyncSession, task_id: UUID) -> Optional[Task]:
    result = await db.execute(
        select(Task)
        .options(selectinload(Task.milestones))
        .where(Task.id == task_id)
    )
    return result.scalar_one_or_none()


async def get_tasks(db: AsyncSession, skip: int = 0, limit: int = 100) -> List[Task]:
    result = await db.execute(
        select(Task)
        .offset(skip)
        .limit(limit)
    )
    return result.scalars().all()


async def update_task(db: AsyncSession, task: Task, task_update: TaskUpdate) -> Task:
    old_status = task.status
    update_data = task_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(task, field, value)
    await db.commit()
    await db.refresh(task)
    
    # Trigger real-time event if status changed
    if "status" in update_data and old_status != task.status:
        await broadcast_task_status_update(task)
    
    return task


async def update_task_status(db: AsyncSession, task: Task, new_status: str) -> Task:
    """Update task status and broadcast the change."""
    old_status = task.status
    task.status = new_status
    await db.commit()
    await db.refresh(task)
    
    # Trigger real-time event
    if old_status != new_status:
        await broadcast_task_status_update(task)
    
    return task


async def broadcast_task_status_update(task: Task):
    """Broadcast task status update via WebSocket."""
    try:
        update_message = WSTaskStatusUpdate(
            task_id=task.id,
            new_status=task.status,
            assignee_id=task.assignee_id
        )
        await manager.broadcast(update_message.model_dump())
    except Exception as e:
        # Log error but don't fail the operation
        print(f"Failed to broadcast task status update: {e}")


async def delete_task(db: AsyncSession, task: Task) -> None:
    await db.delete(task)
    await db.commit()