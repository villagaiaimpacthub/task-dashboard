from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from typing import List

from ...database import get_db
from ...dependencies import get_current_user
from ...models.user import User
from ...schemas.comment import CommentCreate, CommentUpdate, CommentResponse, CommentWithAuthor
from ...services.comment_service import CommentService

router = APIRouter()


@router.post("/", response_model=CommentResponse, status_code=status.HTTP_201_CREATED)
async def create_comment(
    comment_data: CommentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new comment on a task."""
    comment_service = CommentService(db)
    comment = await comment_service.create_comment(comment_data, current_user.id)
    return comment


@router.get("/task/{task_id}", response_model=List[CommentWithAuthor])
async def get_task_comments(
    task_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all comments for a specific task."""
    comment_service = CommentService(db)
    comments = await comment_service.get_task_comments(task_id)
    return comments


@router.put("/{comment_id}", response_model=CommentResponse)
async def update_comment(
    comment_id: UUID,
    comment_data: CommentUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a comment (only by the author)."""
    comment_service = CommentService(db)
    comment = await comment_service.update_comment(comment_id, comment_data, current_user.id)
    
    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found or you don't have permission to update it"
        )
    
    return comment


@router.delete("/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_comment(
    comment_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a comment (only by the author)."""
    comment_service = CommentService(db)
    success = await comment_service.delete_comment(comment_id, current_user.id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found or you don't have permission to delete it"
        )


@router.get("/{comment_id}", response_model=CommentResponse)
async def get_comment(
    comment_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific comment by ID."""
    comment_service = CommentService(db)
    comment = await comment_service.get_comment(comment_id)
    
    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found"
        )
    
    return comment