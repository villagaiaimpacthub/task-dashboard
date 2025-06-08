import pytest
from uuid import uuid4
from unittest.mock import AsyncMock, MagicMock

from app.services.user_service import set_user_online_status, get_online_users
from app.models.user import User


class TestUserOnlineStatus:
    """Test user online status functionality."""
    
    @pytest.mark.asyncio
    async def test_set_user_online_status_success(self):
        """Test setting user online status successfully."""
        # Create a mock user
        user_id = uuid4()
        mock_user = User(id=user_id, email="test@example.com")
        mock_user.is_online = False
        
        # Mock database session
        mock_db = AsyncMock()
        
        # Mock get_user_by_id to return our user
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = mock_user
        mock_db.execute.return_value = mock_result
        
        # Test setting online status
        result = await set_user_online_status(mock_db, user_id, True)
        
        assert result is not None
        assert result.is_online is True
        mock_db.commit.assert_called_once()
        mock_db.refresh.assert_called_once_with(mock_user)
    
    @pytest.mark.asyncio
    async def test_set_user_online_status_user_not_found(self):
        """Test setting online status for non-existent user."""
        user_id = uuid4()
        
        # Mock database session
        mock_db = AsyncMock()
        
        # Mock get_user_by_id to return None
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_db.execute.return_value = mock_result
        
        # Test setting online status
        result = await set_user_online_status(mock_db, user_id, True)
        
        assert result is None
        mock_db.commit.assert_not_called()
    
    @pytest.mark.asyncio
    async def test_get_online_users(self):
        """Test getting list of online users."""
        # Create mock online users
        user1 = User(id=uuid4(), email="user1@example.com", is_online=True, is_active=True)
        user2 = User(id=uuid4(), email="user2@example.com", is_online=True, is_active=True)
        
        # Mock database session
        mock_db = AsyncMock()
        
        # Mock query result
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = [user1, user2]
        mock_db.execute.return_value = mock_result
        
        # Test getting online users
        users = await get_online_users(mock_db, limit=100)
        
        assert len(users) == 2
        assert all(user.is_online for user in users)
        assert all(user.is_active for user in users)
    
    @pytest.mark.asyncio
    async def test_get_online_users_empty(self):
        """Test getting online users when none are online."""
        # Mock database session
        mock_db = AsyncMock()
        
        # Mock empty query result
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = []
        mock_db.execute.return_value = mock_result
        
        # Test getting online users
        users = await get_online_users(mock_db, limit=100)
        
        assert len(users) == 0
    
    @pytest.mark.asyncio
    async def test_get_online_users_with_limit(self):
        """Test getting online users with limit."""
        # Create multiple mock users
        users_list = []
        for i in range(10):
            user = User(
                id=uuid4(), 
                email=f"user{i}@example.com", 
                is_online=True, 
                is_active=True
            )
            users_list.append(user)
        
        # Mock database session
        mock_db = AsyncMock()
        
        # Mock query result (simulate limit of 5)
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = users_list[:5]
        mock_db.execute.return_value = mock_result
        
        # Test getting online users with limit
        users = await get_online_users(mock_db, limit=5)
        
        assert len(users) == 5