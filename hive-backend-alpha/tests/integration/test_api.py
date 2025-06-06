import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_health_endpoint(client: AsyncClient):
    """Test the health check endpoint."""
    response = await client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


@pytest.mark.asyncio
async def test_root_endpoint(client: AsyncClient):
    """Test the root endpoint."""
    response = await client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert "version" in data


@pytest.mark.asyncio
async def test_user_registration(client: AsyncClient):
    """Test user registration."""
    user_data = {
        "email": "newuser@example.com",
        "password": "testpassword123"
    }
    
    response = await client.post("/api/v1/auth/register", json=user_data)
    assert response.status_code == 201
    assert response.json()["message"] == "User created successfully"


@pytest.mark.asyncio
async def test_user_login(client: AsyncClient):
    """Test user login."""
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
async def test_get_current_user(client: AsyncClient, auth_headers):
    """Test getting current user profile."""
    response = await client.get("/api/v1/users/me", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "email" in data
    assert "id" in data


@pytest.mark.asyncio
async def test_create_task(client: AsyncClient, auth_headers):
    """Test creating a new task."""
    task_data = {
        "title": "Test Task",
        "description": "Test task description"
    }
    
    response = await client.post("/api/v1/tasks/", json=task_data, headers=auth_headers)
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Test Task"
    assert data["description"] == "Test task description"
    assert data["status"] == "draft"


@pytest.mark.asyncio
async def test_get_tasks(client: AsyncClient, auth_headers):
    """Test getting tasks list."""
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