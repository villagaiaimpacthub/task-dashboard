from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List

from ...database import get_db
from ...dependencies import get_current_user
from ...models.user import User
from ...schemas.chat import (
    ChatMessageCreate,
    ChatMessageResponse,
    ChatMessageWithSender,
    TaskChatRoom,
    MessageType
)
from ...services.chat_service import ChatService

router = APIRouter()


@router.post("/task/{task_id}/messages", response_model=ChatMessageResponse)
async def send_task_chat_message(
    task_id: UUID,
    request_body: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Send a chat message in a task's chat room."""
    chat_service = ChatService(db)
    
    # Check if user has access to this task's chat
    if not chat_service.can_user_access_task_chat(current_user.id, task_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this task's chat"
        )
    
    content = request_body.get("content", "")
    message = chat_service.create_task_chat_message(task_id, current_user.id, content)
    return message


@router.get("/task/{task_id}/messages", response_model=List[ChatMessageWithSender])
async def get_task_chat_messages(
    task_id: UUID,
    limit: int = Query(50, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get chat messages for a specific task."""
    chat_service = ChatService(db)
    
    # Check if user has access to this task's chat
    if not chat_service.can_user_access_task_chat(current_user.id, task_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this task's chat"
        )
    
    messages = chat_service.get_task_chat_messages(task_id, limit, offset)
    return messages


@router.get("/task-rooms", response_model=List[TaskChatRoom])
async def get_user_task_chat_rooms(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all task chat rooms for the current user."""
    chat_service = ChatService(db)
    chat_rooms = chat_service.get_user_task_chat_rooms(current_user.id)
    return chat_rooms


@router.post("/direct/{recipient_id}/messages", response_model=ChatMessageResponse)
async def send_direct_message(
    recipient_id: UUID,
    request_body: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Send a direct message to another user."""
    if recipient_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot send message to yourself"
        )
    
    chat_service = ChatService(db)
    content = request_body.get("content", "")
    message = chat_service.create_direct_message(current_user.id, recipient_id, content)
    return message


@router.get("/direct/{other_user_id}/messages", response_model=List[ChatMessageWithSender])
async def get_direct_messages(
    other_user_id: UUID,
    limit: int = Query(50, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get direct messages with another user."""
    chat_service = ChatService(db)
    messages = chat_service.get_direct_messages(current_user.id, other_user_id, limit, offset)
    return messages