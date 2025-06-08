import pytest
import json
from httpx import AsyncClient
from fastapi.testclient import TestClient
from app.main import app
from app.core.security import create_access_token


@pytest.mark.asyncio
async def test_websocket_connection_requires_token():
    """Test that WebSocket connection requires a valid token."""
    with TestClient(app) as client:
        # Try to connect without token
        with pytest.raises(Exception):
            with client.websocket_connect("/api/v1/ws"):
                pass


@pytest.mark.asyncio
async def test_websocket_connection_with_invalid_token():
    """Test that WebSocket connection fails with invalid token."""
    with TestClient(app) as client:
        # Try to connect with invalid token
        with pytest.raises(Exception):
            with client.websocket_connect("/api/v1/ws?token=invalid_token"):
                pass


@pytest.mark.asyncio
async def test_websocket_chat_message(test_user):
    """Test basic chat message functionality via WebSocket."""
    # Create a valid token for the test user
    token = create_access_token(data={"sub": str(test_user.id)})
    
    with TestClient(app) as client:
        with client.websocket_connect(f"/api/v1/ws?token={token}") as websocket:
            # Send a chat message
            message = {
                "type": "chat_message",
                "payload": {"message": "Hello, world!"}
            }
            websocket.send_text(json.dumps(message))
            
            # Should receive the broadcast message back
            data = websocket.receive_text()
            received_message = json.loads(data)
            
            assert received_message["type"] == "chat_message"
            assert received_message["message"] == "Hello, world!"
            assert received_message["user_id"] == str(test_user.id)


@pytest.mark.asyncio
async def test_websocket_ping_pong(test_user):
    """Test ping-pong functionality via WebSocket."""
    # Create a valid token for the test user
    token = create_access_token(data={"sub": str(test_user.id)})
    
    with TestClient(app) as client:
        with client.websocket_connect(f"/api/v1/ws?token={token}") as websocket:
            # Send a ping message
            timestamp = 1234567890
            ping_message = {
                "type": "ping",
                "payload": {"timestamp": timestamp}
            }
            websocket.send_text(json.dumps(ping_message))
            
            # Should receive a pong response
            data = websocket.receive_text()
            received_message = json.loads(data)
            
            assert received_message["type"] == "pong"
            assert received_message["timestamp"] == timestamp


@pytest.mark.asyncio
async def test_websocket_invalid_message(test_user):
    """Test WebSocket handling of invalid message format."""
    # Create a valid token for the test user
    token = create_access_token(data={"sub": str(test_user.id)})
    
    with TestClient(app) as client:
        with client.websocket_connect(f"/api/v1/ws?token={token}") as websocket:
            # Send invalid JSON
            websocket.send_text("invalid json")
            
            # Should receive an error message
            data = websocket.receive_text()
            received_message = json.loads(data)
            
            assert received_message["type"] == "error"
            assert "Invalid message format" in received_message["message"]