import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, Depends
from sqlalchemy.orm import Session
from uuid import UUID
from typing import Optional

from app.core.auth import verify_access_token
from app.database import get_db
from app.websockets.connection_manager import manager
from app.schemas.websocket import WebSocketMessage, ChatMessage, TaskChatMessage
from app.services.chat_service import ChatService
from app.models.task import Task

router = APIRouter()


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, token: Optional[str] = Query(None)):
    """WebSocket endpoint for real-time communication."""
    if not token:
        await websocket.close(code=4001, reason="Missing token")
        return
    
    # Verify JWT token
    user_id = verify_access_token(token)
    if not user_id:
        await websocket.close(code=4001, reason="Invalid token")
        return
    
    # Connect the user
    await manager.connect(websocket, user_id)
    
    try:
        while True:
            # Receive message from client
            data = await websocket.receive_text()
            
            try:
                message_data = json.loads(data)
                message = WebSocketMessage(**message_data)
                
                # Handle different message types
                if message.type == "chat_message":
                    # Broadcast general chat message to all connected clients
                    chat_message = ChatMessage(
                        message=message.payload.get("message", ""),
                        user_id=user_id
                    )
                    await manager.broadcast(chat_message.model_dump())
                
                elif message.type == "task_chat_message":
                    # Handle task-specific chat messages
                    task_id = message.payload.get("task_id")
                    if task_id:
                        # Get task from database to find participants
                        from app.database import SessionLocal
                        db = SessionLocal()
                        try:
                            task = db.query(Task).filter(Task.id == UUID(task_id)).first()
                            if task:
                                # Send message only to task owner and assignee
                                participants = [task.owner_id]
                                if task.assignee_id and task.assignee_id != task.owner_id:
                                    participants.append(task.assignee_id)
                                
                                task_chat_msg = TaskChatMessage(
                                    task_id=UUID(task_id),
                                    message=message.payload.get("message", ""),
                                    sender_id=user_id,
                                    sender_email=message.payload.get("sender_email", ""),
                                    sender_role=message.payload.get("sender_role")
                                )
                                
                                await manager.send_to_multiple_users(
                                    task_chat_msg.model_dump(mode='json'),
                                    participants
                                )
                        finally:
                            db.close()
                
                elif message.type == "ping":
                    # Respond to ping with pong
                    await manager.send_personal_message(
                        {"type": "pong", "timestamp": message.payload.get("timestamp")},
                        user_id
                    )
                
                # Add more message type handlers as needed
                
            except (json.JSONDecodeError, ValueError) as e:
                # Send error message back to client
                await manager.send_personal_message(
                    {"type": "error", "message": f"Invalid message format: {str(e)}"},
                    user_id
                )
                
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)