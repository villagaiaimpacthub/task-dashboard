from typing import Optional
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.task import Task
from app.models.user import User
from app.models.user_task_association import UserTaskAssociation
from app.websockets.connection_manager import manager
from app.schemas.websocket import TaskAssignmentUpdate


async def assign_task(
    db: AsyncSession, 
    task: Task, 
    assignee: User, 
    assigned_by: User
) -> Task:
    """Assign a user to a task."""
    # Update task assignee
    task.assignee_id = assignee.id
    
    # Update status to in_progress if not already
    if task.status == "available":
        task.status = "in_progress"
    
    # Create association record
    association = UserTaskAssociation(
        user_id=assignee.id,
        task_id=task.id
    )
    db.add(association)
    
    await db.commit()
    await db.refresh(task)
    
    # Broadcast assignment update
    await broadcast_assignment_update(task, assigned_by.id)
    
    return task


async def unassign_task(db: AsyncSession, task: Task) -> Task:
    """Remove assignment from a task."""
    task.assignee_id = None
    
    # Update status back to available if it was in_progress
    if task.status == "in_progress":
        task.status = "available"
    
    await db.commit()
    await db.refresh(task)
    return task


async def can_assign_task(task: Task, user: User) -> bool:
    """Check if a user can assign a task."""
    return task.owner_id == user.id


async def can_update_task_status(task: Task, user: User) -> bool:
    """Check if a user can update task status."""
    return task.owner_id == user.id or task.assignee_id == user.id


async def broadcast_assignment_update(task: Task, assigned_by_id: UUID):
    """Broadcast task assignment update via WebSocket."""
    try:
        update_message = TaskAssignmentUpdate(
            task_id=task.id,
            assignee_id=task.assignee_id,
            assigned_by=assigned_by_id
        )
        await manager.broadcast(update_message.model_dump())
    except Exception as e:
        # Log error but don't fail the operation
        print(f"Failed to broadcast assignment update: {e}")