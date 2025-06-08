from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List, Optional

from ..models.comment import Comment
from ..models.user import User
from ..schemas.comment import CommentCreate, CommentUpdate, CommentWithAuthor


class CommentService:
    def __init__(self, db: Session):
        self.db = db
    
    def create_comment(self, comment_data: CommentCreate, author_id: UUID) -> Comment:
        """Create a new comment on a task."""
        comment = Comment(
            content=comment_data.content,
            task_id=comment_data.task_id,
            author_id=author_id
        )
        self.db.add(comment)
        self.db.commit()
        self.db.refresh(comment)
        return comment
    
    def get_task_comments(self, task_id: UUID) -> List[CommentWithAuthor]:
        """Get all comments for a specific task with author information."""
        comments = (
            self.db.query(Comment, User.email, User.role)
            .join(User, Comment.author_id == User.id)
            .filter(Comment.task_id == task_id)
            .order_by(desc(Comment.created_at))
            .all()
        )
        
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
    
    def update_comment(self, comment_id: UUID, comment_data: CommentUpdate, author_id: UUID) -> Optional[Comment]:
        """Update a comment (only by the author)."""
        comment = self.db.query(Comment).filter(
            Comment.id == comment_id,
            Comment.author_id == author_id
        ).first()
        
        if not comment:
            return None
        
        comment.content = comment_data.content
        self.db.commit()
        self.db.refresh(comment)
        return comment
    
    def delete_comment(self, comment_id: UUID, author_id: UUID) -> bool:
        """Delete a comment (only by the author)."""
        comment = self.db.query(Comment).filter(
            Comment.id == comment_id,
            Comment.author_id == author_id
        ).first()
        
        if not comment:
            return False
        
        self.db.delete(comment)
        self.db.commit()
        return True
    
    def get_comment(self, comment_id: UUID) -> Optional[Comment]:
        """Get a specific comment by ID."""
        return self.db.query(Comment).filter(Comment.id == comment_id).first()