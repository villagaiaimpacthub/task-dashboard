import pytest
from httpx import AsyncClient
from app.models.user import User
from app.models.task import Task


class TestHealthEndpoints:
    """Test health and basic endpoints."""
    
    @pytest.mark.asyncio
    async def test_health_endpoint(self, client: AsyncClient):
        """Test the health check endpoint."""
        response = await client.get("/health")
        assert response.status_code == 200
        assert response.json() == {"status": "ok"}
    
    @pytest.mark.asyncio
    async def test_root_endpoint(self, client: AsyncClient):
        """Test the root endpoint."""
        response = await client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "version" in data


class TestAuthenticationAPI:
    """Test authentication endpoints."""
    
    @pytest.mark.asyncio
    async def test_user_registration_success(self, client: AsyncClient):
        """Test successful user registration."""
        user_data = {
            "email": "newuser@example.com",
            "password": "securepassword123"
        }
        
        response = await client.post("/api/v1/auth/register", json=user_data)
        assert response.status_code == 201
        assert response.json()["message"] == "User created successfully"
    
    @pytest.mark.asyncio
    async def test_user_registration_duplicate_email(self, client: AsyncClient):
        """Test registration with duplicate email."""
        user_data = {
            "email": "duplicate@example.com",
            "password": "password123"
        }
        
        # Register first user
        await client.post("/api/v1/auth/register", json=user_data)
        
        # Try to register again with same email
        response = await client.post("/api/v1/auth/register", json=user_data)
        assert response.status_code == 400
        assert "already exists" in response.json()["detail"]
    
    @pytest.mark.asyncio
    async def test_user_login_success(self, client: AsyncClient):
        """Test successful user login."""
        # First register a user
        user_data = {
            "email": "logintest@example.com",
            "password": "testpassword123"
        }
        await client.post("/api/v1/auth/register", json=user_data)
        
        # Then login
        response = await client.post("/api/v1/auth/login", json=user_data)
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
    
    @pytest.mark.asyncio
    async def test_user_login_invalid_credentials(self, client: AsyncClient):
        """Test login with invalid credentials."""
        user_data = {
            "email": "nonexistent@example.com",
            "password": "wrongpassword"
        }
        
        response = await client.post("/api/v1/auth/login", json=user_data)
        assert response.status_code == 401
        assert "Incorrect email or password" in response.json()["detail"]


class TestUserAPI:
    """Test user-related endpoints."""
    
    @pytest.mark.asyncio
    async def test_get_current_user(self, client: AsyncClient, auth_headers):
        """Test getting current user profile."""
        response = await client.get("/api/v1/users/me", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "email" in data
        assert "id" in data
        assert "is_active" in data
        assert "created_at" in data
        assert "updated_at" in data
    
    @pytest.mark.asyncio
    async def test_update_current_user(self, client: AsyncClient, auth_headers):
        """Test updating current user profile."""
        update_data = {"email": "updated@example.com"}
        
        response = await client.put(
            "/api/v1/users/me", 
            json=update_data, 
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "updated@example.com"
    
    @pytest.mark.asyncio
    async def test_user_endpoints_require_auth(self, client: AsyncClient):
        """Test that user endpoints require authentication."""
        # Without auth headers
        response = await client.get("/api/v1/users/me")
        assert response.status_code == 401


class TestTaskAPI:
    """Test task-related endpoints."""
    
    @pytest.mark.asyncio
    async def test_create_task_success(self, client: AsyncClient, auth_headers):
        """Test successful task creation."""
        task_data = {
            "title": "Test Task",
            "description": "Test task description"
        }
        
        response = await client.post(
            "/api/v1/tasks/", 
            json=task_data, 
            headers=auth_headers
        )
        assert response.status_code == 201
        data = response.json()
        assert data["title"] == "Test Task"
        assert data["description"] == "Test task description"
        assert data["status"] == "draft"
        assert "id" in data
        assert "owner_id" in data
    
    @pytest.mark.asyncio
    async def test_list_tasks(self, client: AsyncClient, auth_headers):
        """Test listing tasks."""
        # Create a task first
        task_data = {
            "title": "Test Task for List",
            "description": "Test description"
        }
        await client.post("/api/v1/tasks/", json=task_data, headers=auth_headers)
        
        # Get tasks
        response = await client.get("/api/v1/tasks/", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
    
    @pytest.mark.asyncio
    async def test_get_task_by_id(self, client: AsyncClient, auth_headers):
        """Test getting a specific task."""
        # Create a task first
        task_data = {"title": "Specific Task"}
        create_response = await client.post(
            "/api/v1/tasks/", 
            json=task_data, 
            headers=auth_headers
        )
        task_id = create_response.json()["id"]
        
        # Get the specific task
        response = await client.get(f"/api/v1/tasks/{task_id}", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "Specific Task"
        assert data["id"] == task_id
    
    @pytest.mark.asyncio
    async def test_update_task(self, client: AsyncClient, auth_headers):
        """Test updating a task."""
        # Create a task first
        task_data = {"title": "Original Task"}
        create_response = await client.post(
            "/api/v1/tasks/", 
            json=task_data, 
            headers=auth_headers
        )
        task_id = create_response.json()["id"]
        
        # Update the task
        update_data = {"title": "Updated Task", "status": "available"}
        response = await client.put(
            f"/api/v1/tasks/{task_id}", 
            json=update_data, 
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "Updated Task"
        assert data["status"] == "available"
    
    @pytest.mark.asyncio
    async def test_delete_task(self, client: AsyncClient, auth_headers):
        """Test deleting a task."""
        # Create a task first
        task_data = {"title": "Task to Delete"}
        create_response = await client.post(
            "/api/v1/tasks/", 
            json=task_data, 
            headers=auth_headers
        )
        task_id = create_response.json()["id"]
        
        # Delete the task
        response = await client.delete(f"/api/v1/tasks/{task_id}", headers=auth_headers)
        assert response.status_code == 200
        assert "deleted successfully" in response.json()["message"]
        
        # Verify task is deleted
        get_response = await client.get(f"/api/v1/tasks/{task_id}", headers=auth_headers)
        assert get_response.status_code == 404
    
    @pytest.mark.asyncio
    async def test_task_endpoints_require_auth(self, client: AsyncClient):
        """Test that task endpoints require authentication."""
        # Without auth headers
        response = await client.get("/api/v1/tasks/")
        assert response.status_code == 401
        
        response = await client.post("/api/v1/tasks/", json={"title": "Test"})
        assert response.status_code == 401


class TestTaskWorkflowAPI:
    """Test task assignment and status update endpoints."""
    
    @pytest.mark.asyncio
    async def test_assign_task(self, client: AsyncClient, db_session, auth_headers, test_user):
        """Test task assignment."""
        # Create a task
        task_data = {"title": "Task for Assignment"}
        create_response = await client.post(
            "/api/v1/tasks/", 
            json=task_data, 
            headers=auth_headers
        )
        task_id = create_response.json()["id"]
        
        # Create another user to assign
        assignee = User(email="assignee@example.com")
        assignee.set_password("password")
        db_session.add(assignee)
        await db_session.commit()
        await db_session.refresh(assignee)
        
        # Assign the task
        assign_data = {"user_id": str(assignee.id)}
        response = await client.post(
            f"/api/v1/tasks/{task_id}/assign",
            json=assign_data,
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["assignee_id"] == str(assignee.id)
    
    @pytest.mark.asyncio
    async def test_update_task_status(self, client: AsyncClient, auth_headers):
        """Test task status update."""
        # Create a task
        task_data = {"title": "Task for Status Update"}
        create_response = await client.post(
            "/api/v1/tasks/", 
            json=task_data, 
            headers=auth_headers
        )
        task_id = create_response.json()["id"]
        
        # Update status
        status_data = {"status": "available"}
        response = await client.put(
            f"/api/v1/tasks/{task_id}/status",
            json=status_data,
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "available"
    
    @pytest.mark.asyncio
    async def test_update_task_status_invalid(self, client: AsyncClient, auth_headers):
        """Test task status update with invalid status."""
        # Create a task
        task_data = {"title": "Task for Invalid Status"}
        create_response = await client.post(
            "/api/v1/tasks/", 
            json=task_data, 
            headers=auth_headers
        )
        task_id = create_response.json()["id"]
        
        # Try invalid status
        status_data = {"status": "invalid_status"}
        response = await client.put(
            f"/api/v1/tasks/{task_id}/status",
            json=status_data,
            headers=auth_headers
        )
        assert response.status_code == 400