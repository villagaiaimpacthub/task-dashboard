import pytest
from uuid import uuid4
from unittest.mock import AsyncMock, MagicMock
from app.websockets.connection_manager import ConnectionManager


@pytest.fixture
def connection_manager():
    """Create a fresh connection manager for each test."""
    return ConnectionManager()


@pytest.fixture
def mock_websocket():
    """Create a mock WebSocket."""
    websocket = MagicMock()
    websocket.accept = AsyncMock()
    websocket.send_text = AsyncMock()
    return websocket


@pytest.mark.asyncio
async def test_connection_manager_connect(connection_manager, mock_websocket):
    """Test connecting a WebSocket."""
    user_id = uuid4()
    
    await connection_manager.connect(mock_websocket, user_id)
    
    assert user_id in connection_manager.active_connections
    assert mock_websocket in connection_manager.active_connections[user_id]
    mock_websocket.accept.assert_called_once()


def test_connection_manager_disconnect(connection_manager, mock_websocket):
    """Test disconnecting a WebSocket."""
    user_id = uuid4()
    
    # Manually add connection
    connection_manager.active_connections[user_id] = [mock_websocket]
    
    connection_manager.disconnect(mock_websocket, user_id)
    
    assert user_id not in connection_manager.active_connections


@pytest.mark.asyncio
async def test_send_personal_message(connection_manager, mock_websocket):
    """Test sending a personal message."""
    user_id = uuid4()
    message = {"type": "test", "content": "hello"}
    
    # Manually add connection
    connection_manager.active_connections[user_id] = [mock_websocket]
    
    await connection_manager.send_personal_message(message, user_id)
    
    mock_websocket.send_text.assert_called_once()


@pytest.mark.asyncio
async def test_broadcast_message(connection_manager, mock_websocket):
    """Test broadcasting a message."""
    user_id = uuid4()
    message = {"type": "broadcast", "content": "hello everyone"}
    
    # Manually add connection
    connection_manager.active_connections[user_id] = [mock_websocket]
    
    await connection_manager.broadcast(message)
    
    mock_websocket.send_text.assert_called_once()


def test_get_connected_users(connection_manager, mock_websocket):
    """Test getting connected users."""
    user_id1 = uuid4()
    user_id2 = uuid4()
    
    # Manually add connections
    connection_manager.active_connections[user_id1] = [mock_websocket]
    connection_manager.active_connections[user_id2] = [mock_websocket]
    
    connected_users = connection_manager.get_connected_users()
    
    assert len(connected_users) == 2
    assert user_id1 in connected_users
    assert user_id2 in connected_users