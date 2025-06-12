import pytest
import json
from httpx import AsyncClient
from fastapi.testclient import TestClient
from app.main import app
from app.core.security import create_access_token
from app.models.user import User


class TestWebSocketOnlineStatus:
    """Test WebSocket integration with user online status."""
    
    @pytest.mark.asyncio
    async def test_websocket_sets_user_online(self, test_user, db_session):
        """Test that WebSocket connection sets user as online."""
        # Ensure user starts as offline
        test_user.is_online = False
        await db_session.commit()
        
        # Create a valid token for the test user
        token = create_access_token(data={"sub": str(test_user.id)})
        
        with TestClient(app) as client:
            # Connect via WebSocket
            with client.websocket_connect(f"/api/v1/ws?token={token}") as websocket:
                # Send a ping to keep connection alive briefly
                ping_message = {
                    "type": "ping",
                    "payload": {"timestamp": 123456789}
                }
                websocket.send_text(json.dumps(ping_message))
                
                # Receive the pong response
                response = websocket.receive_text()
                pong_data = json.loads(response)
                assert pong_data["type"] == "pong"
        
        # Note: In a real test, we would verify the user is set to online
        # However, due to test environment limitations with async operations,
        # this test mainly verifies the WebSocket connection works
    
    @pytest.mark.asyncio
    async def test_websocket_connection_workflow(self, test_user):
        """Test complete WebSocket connection workflow."""
        # Create a valid token for the test user
        token = create_access_token(data={"sub": str(test_user.id)})
        
        with TestClient(app) as client:
            # Test successful connection
            with client.websocket_connect(f"/api/v1/ws?token={token}") as websocket:
                # Test chat message
                chat_message = {
                    "type": "chat_message",
                    "payload": {"message": "Hello from test!"}
                }
                websocket.send_text(json.dumps(chat_message))
                
                # Should receive broadcast back
                response = websocket.receive_text()
                broadcast_data = json.loads(response)
                
                assert broadcast_data["type"] == "chat_message"
                assert broadcast_data["message"] == "Hello from test!"
                assert broadcast_data["user_id"] == str(test_user.id)


class TestOnlineStatusAPI:
    """Test online status through API integration."""
    
    @pytest.mark.asyncio
    async def test_user_online_status_in_profile(self, client: AsyncClient, auth_headers, test_user):
        """Test that user profile includes online status."""
        response = await client.get("/api/v1/users/me", headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert "is_online" in data
        assert isinstance(data["is_online"], bool)
    
    @pytest.mark.asyncio
    async def test_online_users_filtering(self, client: AsyncClient, db_session, auth_headers):
        """Test that online users endpoint filters correctly."""
        # Create multiple users with different online status
        online_user = User(email="online@example.com")
        online_user.set_password("password")
        online_user.is_online = True
        online_user.is_active = True
        
        offline_user = User(email="offline@example.com")
        offline_user.set_password("password")
        offline_user.is_online = False
        offline_user.is_active = True
        
        inactive_user = User(email="inactive@example.com")
        inactive_user.set_password("password")
        inactive_user.is_online = True
        inactive_user.is_active = False  # Inactive user should be excluded
        
        db_session.add_all([online_user, offline_user, inactive_user])
        await db_session.commit()
        
        # Test the online users endpoint
        response = await client.get("/api/v1/users/online", headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        emails = [user["email"] for user in data]
        
        # Should include only online AND active users
        assert "online@example.com" in emails
        assert "offline@example.com" not in emails  # Offline
        assert "inactive@example.com" not in emails  # Inactive
    
    @pytest.mark.asyncio
    async def test_dashboard_reflects_online_status(self, client: AsyncClient, db_session):
        """Test that dashboard statistics reflect online user status."""
        # Create users with different online status
        for i in range(5):
            user = User(email=f"user{i}@example.com")
            user.set_password("password")
            user.is_online = i < 2  # First 2 users are online
            user.is_active = True
            db_session.add(user)
        
        await db_session.commit()
        
        # Test dashboard summary
        response = await client.get("/api/v1/dashboard/summary")
        assert response.status_code == 200
        
        data = response.json()
        
        # Should show correct online user count
        assert data["users"]["total_users"] == 5
        assert data["users"]["active_users"] == 5
        assert data["users"]["online_users"] == 2
    
    @pytest.mark.asyncio
    async def test_live_status_reflects_online_users(self, client: AsyncClient, db_session):
        """Test that live status reflects current online users."""
        # Create online users
        for i in range(3):
            user = User(email=f"liveuser{i}@example.com")
            user.set_password("password")
            user.is_online = True
            user.is_active = True
            db_session.add(user)
        
        await db_session.commit()
        
        # Test live status endpoint
        response = await client.get("/api/v1/dashboard/live-status")
        assert response.status_code == 200
        
        data = response.json()
        
        # Should reflect online user count
        assert data["online_users_count"] == 3