import pytest
from httpx import AsyncClient
from app.models.user import User
from app.models.task import Task


class TestDashboardAPI:
    """Test dashboard API endpoints."""
    
    @pytest.mark.asyncio
    async def test_dashboard_summary_public_access(self, client: AsyncClient):
        """Test that dashboard summary is publicly accessible."""
        response = await client.get("/api/v1/dashboard/summary")
        assert response.status_code == 200
        
        data = response.json()
        assert "tasks" in data
        assert "users" in data
        assert "last_updated" in data
        
        # Check task data structure
        assert "total" in data["tasks"]
        assert "by_status" in data["tasks"]
        assert "by_priority" in data["tasks"]
        assert "by_category" in data["tasks"]
        
        # Check user data structure
        assert "total_users" in data["users"]
        assert "active_users" in data["users"]
        assert "online_users" in data["users"]
    
    @pytest.mark.asyncio
    async def test_dashboard_summary_with_data(self, client: AsyncClient, db_session, test_user):
        """Test dashboard summary with actual data."""
        # Create some test tasks
        task1 = Task(title="Task 1", status="draft", owner_id=test_user.id)
        task2 = Task(title="Task 2", status="available", owner_id=test_user.id)
        task3 = Task(title="Task 3", status="in_progress", owner_id=test_user.id)
        task4 = Task(title="Task 4", status="completed", owner_id=test_user.id)
        
        db_session.add_all([task1, task2, task3, task4])
        
        # Create another user
        user2 = User(email="user2@example.com")
        user2.set_password("password")
        user2.is_online = True
        db_session.add(user2)
        
        await db_session.commit()
        
        # Test the endpoint
        response = await client.get("/api/v1/dashboard/summary")
        assert response.status_code == 200
        
        data = response.json()
        
        # Verify task counts
        assert data["tasks"]["total"] == 4
        assert data["tasks"]["by_status"]["draft"] == 1
        assert data["tasks"]["by_status"]["available"] == 1
        assert data["tasks"]["by_status"]["in_progress"] == 1
        assert data["tasks"]["by_status"]["completed"] == 1
        
        # Verify user counts (test_user + user2)
        assert data["users"]["total_users"] == 2
        assert data["users"]["active_users"] == 2  # Both users are active by default
        assert data["users"]["online_users"] == 1  # Only user2 is online
    
    @pytest.mark.asyncio
    async def test_live_status_endpoint(self, client: AsyncClient):
        """Test live status endpoint."""
        response = await client.get("/api/v1/dashboard/live-status")
        assert response.status_code == 200
        
        data = response.json()
        assert "online_users_count" in data
        assert "active_tasks_count" in data
        assert "recent_activity_count" in data
        assert "system_status" in data
        
        # Check data types
        assert isinstance(data["online_users_count"], int)
        assert isinstance(data["active_tasks_count"], int)
        assert isinstance(data["recent_activity_count"], int)
        assert data["system_status"] == "operational"
    
    @pytest.mark.asyncio
    async def test_live_status_with_data(self, client: AsyncClient, db_session, test_user):
        """Test live status with actual data."""
        # Create tasks with different statuses
        task_in_progress = Task(title="Active Task", status="in_progress", owner_id=test_user.id)
        task_completed = Task(title="Done Task", status="completed", owner_id=test_user.id)
        
        db_session.add_all([task_in_progress, task_completed])
        
        # Set test user as online
        test_user.is_online = True
        
        await db_session.commit()
        
        # Test the endpoint
        response = await client.get("/api/v1/dashboard/live-status")
        assert response.status_code == 200
        
        data = response.json()
        
        # Verify counts
        assert data["online_users_count"] == 1  # test_user is online
        assert data["active_tasks_count"] == 1   # One in_progress task
        assert data["recent_activity_count"] == 2  # Total tasks as placeholder
    
    @pytest.mark.asyncio
    async def test_online_users_endpoint(self, client: AsyncClient, auth_headers):
        """Test online users endpoint requires authentication."""
        response = await client.get("/api/v1/dashboard/online-users", headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
    
    @pytest.mark.asyncio
    async def test_online_users_with_data(self, client: AsyncClient, db_session, auth_headers, test_user):
        """Test online users endpoint with actual data."""
        # Set test user as online
        test_user.is_online = True
        
        # Create another online user
        user2 = User(email="online_user@example.com")
        user2.set_password("password")
        user2.is_online = True
        user2.is_active = True
        db_session.add(user2)
        
        # Create an offline user
        user3 = User(email="offline_user@example.com")
        user3.set_password("password")
        user3.is_online = False
        user3.is_active = True
        db_session.add(user3)
        
        await db_session.commit()
        
        # Test the endpoint
        response = await client.get("/api/v1/dashboard/online-users", headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        
        # Should return only online users
        online_emails = [user["email"] for user in data]
        assert "test@example.com" in online_emails  # test_user
        assert "online_user@example.com" in online_emails  # user2
        assert "offline_user@example.com" not in online_emails  # user3 is offline
        
        # Verify all returned users are online
        for user in data:
            assert user["is_online"] is True
    
    @pytest.mark.asyncio
    async def test_online_users_limit_parameter(self, client: AsyncClient, auth_headers):
        """Test online users endpoint with limit parameter."""
        response = await client.get(
            "/api/v1/dashboard/online-users?limit=5", 
            headers=auth_headers
        )
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        assert len(data) <= 5  # Should respect the limit


class TestUserOnlineEndpoint:
    """Test user online status endpoint in users API."""
    
    @pytest.mark.asyncio
    async def test_users_online_endpoint(self, client: AsyncClient, auth_headers):
        """Test users online endpoint requires authentication."""
        response = await client.get("/api/v1/users/online", headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
    
    @pytest.mark.asyncio
    async def test_users_online_unauthorized(self, client: AsyncClient):
        """Test users online endpoint without authentication."""
        response = await client.get("/api/v1/users/online")
        assert response.status_code == 401