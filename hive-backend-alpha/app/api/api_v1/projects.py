from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from typing import List, Optional

from ...database import get_db
from ...dependencies import get_current_user
from ...models.user import User
from ...schemas.project import (
    ProjectCreate, 
    ProjectUpdate, 
    ProjectResponse, 
    ProjectWithTasks,
    ProjectSummary
)
from ...services import project_service

router = APIRouter()


@router.get("/", response_model=List[ProjectWithTasks])
async def get_projects(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    status: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all projects with task counts"""
    projects = await project_service.get_projects(
        db=db, 
        skip=skip, 
        limit=limit,
        status=status
    )
    return projects


@router.get("/my", response_model=List[ProjectWithTasks])
async def get_my_projects(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    status: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get projects owned by current user"""
    projects = await project_service.get_projects(
        db=db, 
        skip=skip, 
        limit=limit,
        owner_id=current_user.id,
        status=status
    )
    return projects


@router.get("/summary", response_model=ProjectSummary)
async def get_projects_summary(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get project summary statistics"""
    summary = await project_service.get_projects_summary(db)
    return summary


@router.post("/", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    project_data: ProjectCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new project"""
    project = await project_service.create_project(
        db=db, 
        project_data=project_data, 
        owner_id=current_user.id
    )
    return project


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific project"""
    project = await project_service.get_project(db, project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    return project


@router.put("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: UUID,
    project_data: ProjectUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a project (only by owner or assignee)"""
    project = await project_service.update_project(
        db=db, 
        project_id=project_id, 
        project_data=project_data,
        user_id=current_user.id
    )
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found or you don't have permission to update it"
        )
    return project


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a project (only by owner)"""
    success = await project_service.delete_project(
        db=db, 
        project_id=project_id, 
        user_id=current_user.id
    )
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found or you don't have permission to delete it"
        )


@router.get("/{project_id}/tasks")
async def get_project_tasks(
    project_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all tasks for a project"""
    # Verify project exists
    project = await project_service.get_project(db, project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    tasks = await project_service.get_project_tasks(db, project_id)
    return tasks