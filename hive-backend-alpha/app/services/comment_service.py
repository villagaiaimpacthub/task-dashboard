from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import desc, select
from typing import List, Optional

from ..models.comment import Comment
from ..models.user import User
from ..schemas.comment import CommentCreate, CommentUpdate, CommentWithAuthor


class CommentService:
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def create_comment(self, comment_data: CommentCreate, author_id: UUID) -> Comment:
        """Create a new comment on a task."""
        comment = Comment(
            content=comment_data.content,
            task_id=comment_data.task_id,
            author_id=author_id
        )
        self.db.add(comment)
        await self.db.commit()
        await self.db.refresh(comment)
        return comment
    
    async def get_task_comments(self, task_id: UUID) -> List[CommentWithAuthor]:
        """Get all comments for a specific task with author information."""
        stmt = (
            select(Comment, User.email, User.role)
            .join(User, Comment.author_id == User.id)
            .where(Comment.task_id == task_id)
            .order_by(desc(Comment.created_at))
        )
        
        result_obj = await self.db.execute(stmt)
        comments = result_obj.all()
        
        result = []
        for comment, author_email, author_role in comments:
            comment_dict = {
                "id": comment.id,
                "content": comment.content,
                "task_id": comment.task_id,
                "author_id": comment.author_id,
                "created_at": comment.created_at,
                "updated_at": comment.updated_at,
                "author_email": author_email,
                "author_role": author_role
            }
            result.append(CommentWithAuthor(**comment_dict))
        
        return result
    
    async def update_comment(self, comment_id: UUID, comment_data: CommentUpdate, author_id: UUID) -> Optional[Comment]:
        """Update a comment (only by the author)."""
        stmt = select(Comment).where(
            Comment.id == comment_id,
            Comment.author_id == author_id
        )
        result = await self.db.execute(stmt)
        comment = result.scalar_one_or_none()
        
        if not comment:
            return None
        
        comment.content = comment_data.content
        await self.db.commit()
        await self.db.refresh(comment)
        return comment
    
    async def delete_comment(self, comment_id: UUID, author_id: UUID) -> bool:
        """Delete a comment (only by the author)."""
        stmt = select(Comment).where(
            Comment.id == comment_id,
            Comment.author_id == author_id
        )
        result = await self.db.execute(stmt)
        comment = result.scalar_one_or_none()
        
        if not comment:
            return False
        
        await self.db.delete(comment)
        await self.db.commit()
        return True
    
    async def get_comment(self, comment_id: UUID) -> Optional[Comment]:
        """Get a specific comment by ID."""
        stmt = select(Comment).where(Comment.id == comment_id)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()