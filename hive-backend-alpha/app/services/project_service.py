from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, case
from typing import List, Optional

from ..models.project import Project
from ..models.task import Task
from ..models.user import User
from ..schemas.project import ProjectCreate, ProjectUpdate, ProjectWithTasks, ProjectSummary


async def get_projects(
    db: AsyncSession, 
    skip: int = 0, 
    limit: int = 100,
    owner_id: Optional[UUID] = None,
    status: Optional[str] = None
) -> List[ProjectWithTasks]:
    """Get projects with task counts"""
    stmt = select(
        Project,
        func.count(Task.id).label('task_count'),
        func.sum(case((Task.status == 'completed', 1), else_=0)).label('completed_tasks')
    ).outerjoin(Task).group_by(Project.id)
    
    if owner_id:
        stmt = stmt.where(Project.owner_id == owner_id)
    if status:
        stmt = stmt.where(Project.status == status)
    
    stmt = stmt.order_by(desc(Project.updated_at)).offset(skip).limit(limit)
    
    result = await db.execute(stmt)
    projects_data = result.all()
    
    projects = []
    for project, task_count, completed_tasks in projects_data:
        project_dict = {
            "id": project.id,
            "title": project.title,
            "description": project.description,
            "status": project.status,
            "priority": project.priority,
            "category": project.category,
            "impact_points": project.impact_points,
            "budget": project.budget,
            "location": project.location,
            "team_size": project.team_size,
            "start_date": project.start_date,
            "due_date": project.due_date,
            "success_metrics": project.success_metrics,
            "deliverables": project.deliverables,
            "dependencies": project.dependencies,
            "required_skills": project.required_skills,
            "definition_of_done": project.definition_of_done,
            "owner_id": project.owner_id,
            "assignee_id": project.assignee_id,
            "completed_at": project.completed_at,
            "created_at": project.created_at,
            "updated_at": project.updated_at,
            "task_count": task_count or 0,
            "completed_tasks": completed_tasks or 0
        }
        projects.append(ProjectWithTasks(**project_dict))
    
    return projects


async def get_project(db: AsyncSession, project_id: UUID) -> Optional[Project]:
    """Get a single project by ID"""
    stmt = select(Project).where(Project.id == project_id)
    result = await db.execute(stmt)
    return result.scalar_one_or_none()


async def create_project(db: AsyncSession, project_data: ProjectCreate, owner_id: UUID) -> Project:
    """Create a new project"""
    project = Project(
        **project_data.model_dump(),
        owner_id=owner_id
    )
    db.add(project)
    await db.commit()
    await db.refresh(project)
    return project


async def update_project(
    db: AsyncSession, 
    project_id: UUID, 
    project_data: ProjectUpdate,
    user_id: UUID
) -> Optional[Project]:
    """Update a project (only by owner or assignee)"""
    stmt = select(Project).where(Project.id == project_id)
    result = await db.execute(stmt)
    project = result.scalar_one_or_none()
    
    if not project:
        return None
    
    # Check if user has permission to update
    # Allow joining unassigned projects (setting assignee_id when it's currently None)
    is_joining = 'assignee_id' in project_data.model_dump(exclude_unset=True) and project.assignee_id is None
    is_owner_or_assignee = project.owner_id == user_id or project.assignee_id == user_id
    
    if not (is_owner_or_assignee or is_joining):
        return None
    
    # Update fields
    update_data = project_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(project, field, value)
    
    await db.commit()
    await db.refresh(project)
    return project


async def delete_project(db: AsyncSession, project_id: UUID, user_id: UUID) -> bool:
    """Delete a project (only by owner)"""
    stmt = select(Project).where(Project.id == project_id)
    result = await db.execute(stmt)
    project = result.scalar_one_or_none()
    
    if not project or project.owner_id != user_id:
        return False
    
    await db.delete(project)
    await db.commit()
    return True


async def get_project_tasks(db: AsyncSession, project_id: UUID) -> List[Task]:
    """Get all tasks for a project"""
    stmt = select(Task).where(Task.project_id == project_id).order_by(desc(Task.updated_at))
    result = await db.execute(stmt)
    return result.scalars().all()


async def get_projects_summary(db: AsyncSession) -> ProjectSummary:
    """Get summary statistics for projects"""
    # Total projects
    total_stmt = select(func.count(Project.id))
    total_result = await db.execute(total_stmt)
    total_projects = total_result.scalar()
    
    # By status
    status_stmt = select(Project.status, func.count(Project.id)).group_by(Project.status)
    status_result = await db.execute(status_stmt)
    by_status = dict(status_result.all())
    
    # By priority
    priority_stmt = select(Project.priority, func.count(Project.id)).group_by(Project.priority)
    priority_result = await db.execute(priority_stmt)
    by_priority = dict(priority_result.all())
    
    # Recent activity (last 5 updated projects)
    recent_stmt = select(Project.title, Project.status, Project.updated_at).order_by(desc(Project.updated_at)).limit(5)
    recent_result = await db.execute(recent_stmt)
    recent_activity = [
        {
            "title": title,
            "status": status,
            "updated_at": updated_at.isoformat() if updated_at else None
        }
        for title, status, updated_at in recent_result.all()
    ]
    
    return ProjectSummary(
        total_projects=total_projects,
        by_status=by_status,
        by_priority=by_priority,
        recent_activity=recent_activity
    )