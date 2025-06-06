import json
from typing import Dict, List
from uuid import UUID
from fastapi import WebSocket
from app.schemas.websocket import WebSocketMessage


class ConnectionManager:
    def __init__(self):
        # Store active connections: user_id -> list of websockets
        self.active_connections: Dict[UUID, List[WebSocket]] = {}
    
    async def connect(self, websocket: WebSocket, user_id: UUID):
        """Accept a new WebSocket connection."""
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)
        
        # Update user online status
        await self._update_user_online_status(user_id, True)
    
    def disconnect(self, websocket: WebSocket, user_id: UUID):
        """Remove a WebSocket connection."""
        if user_id in self.active_connections:
            if websocket in self.active_connections[user_id]:
                self.active_connections[user_id].remove(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
                # Update user offline status when last connection is closed
                import asyncio
                asyncio.create_task(self._update_user_online_status(user_id, False))
    
    async def send_personal_message(self, message: dict, user_id: UUID):
        """Send a message to a specific user."""
        if user_id in self.active_connections:
            # Send to all connections for this user
            for websocket in self.active_connections[user_id].copy():
                try:
                    await websocket.send_text(json.dumps(message))
                except Exception:
                    # Connection is probably closed, remove it
                    self.disconnect(websocket, user_id)
    
    async def broadcast(self, message: dict):
        """Broadcast a message to all connected clients."""
        message_text = json.dumps(message)
        for user_id, websockets in self.active_connections.items():
            for websocket in websockets.copy():
                try:
                    await websocket.send_text(message_text)
                except Exception:
                    # Connection is probably closed, remove it
                    self.disconnect(websocket, user_id)
    
    async def send_to_multiple_users(self, message: dict, user_ids: List[UUID]):
        """Send a message to multiple specific users."""
        for user_id in user_ids:
            await self.send_personal_message(message, user_id)
    
    def get_connected_users(self) -> List[UUID]:
        """Get list of currently connected user IDs."""
        return list(self.active_connections.keys())
    
    async def _update_user_online_status(self, user_id: UUID, is_online: bool):
        """Update user online status in database."""
        try:
            from app.database import async_session
            from app.services import user_service
            
            async with async_session() as db:
                await user_service.set_user_online_status(db, user_id, is_online)
        except Exception as e:
            # Log error but don't fail the connection operation
            print(f"Failed to update user online status: {e}")


# Global connection manager instance
manager = ConnectionManager()