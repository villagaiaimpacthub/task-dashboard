import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from uuid import UUID
from typing import Optional

from app.core.auth import verify_access_token
from app.websockets.connection_manager import manager
from app.schemas.websocket import WebSocketMessage, ChatMessage

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
                    # Broadcast chat message to all connected clients
                    chat_message = ChatMessage(
                        message=message.payload.get("message", ""),
                        user_id=user_id
                    )
                    await manager.broadcast(chat_message.model_dump())
                
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