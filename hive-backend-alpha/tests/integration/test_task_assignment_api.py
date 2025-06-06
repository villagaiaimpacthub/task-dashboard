import pytest
from httpx import AsyncClient
from app.models.user import User
from app.models.task import Task


@pytest.mark.asyncio
async def test_assign_task_success(client: AsyncClient, db_session, auth_headers, test_user):
    """Test successful task assignment."""
    # Create a task
    task = Task(
        title="Test Task for Assignment",
        description="Test description",
        owner_id=test_user.id
    )
    db_session.add(task)
    await db_session.commit()
    await db_session.refresh(task)
    
    # Create another user to assign
    assignee = User(email="assignee@example.com")
    assignee.set_password("password")
    db_session.add(assignee)
    await db_session.commit()
    await db_session.refresh(assignee)
    
    # Assign the task
    response = await client.post(
        f"/api/v1/tasks/{task.id}/assign",
        json={"user_id": str(assignee.id)},
        headers=auth_headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["assignee_id"] == str(assignee.id)


@pytest.mark.asyncio
async def test_assign_task_not_owner(client: AsyncClient, db_session, test_user):
    """Test task assignment fails when user is not owner."""
    # Create another user who owns the task
    owner = User(email="owner@example.com")
    owner.set_password("password")
    db_session.add(owner)
    await db_session.commit()
    await db_session.refresh(owner)
    
    # Create a task owned by the other user
    task = Task(
        title="Test Task",
        owner_id=owner.id
    )
    db_session.add(task)
    await db_session.commit()
    await db_session.refresh(task)
    
    # Try to assign the task (should fail)
    from app.core.security import create_access_token
    test_user_token = create_access_token(data={"sub": str(test_user.id)})
    headers = {"Authorization": f"Bearer {test_user_token}"}
    
    response = await client.post(
        f"/api/v1/tasks/{task.id}/assign",
        json={"user_id": str(test_user.id)},
        headers=headers
    )
    
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_update_task_status_success(client: AsyncClient, db_session, auth_headers, test_user):
    """Test successful task status update."""
    # Create a task
    task = Task(
        title="Test Task for Status Update",
        owner_id=test_user.id,
        status="draft"
    )
    db_session.add(task)
    await db_session.commit()
    await db_session.refresh(task)
    
    # Update the status
    response = await client.put(
        f"/api/v1/tasks/{task.id}/status",
        json={"status": "available"},
        headers=auth_headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "available"


@pytest.mark.asyncio
async def test_update_task_status_invalid_status(client: AsyncClient, db_session, auth_headers, test_user):
    """Test task status update with invalid status."""
    # Create a task
    task = Task(
        title="Test Task",
        owner_id=test_user.id
    )
    db_session.add(task)
    await db_session.commit()
    await db_session.refresh(task)
    
    # Try to update with invalid status
    response = await client.put(
        f"/api/v1/tasks/{task.id}/status",
        json={"status": "invalid_status"},
        headers=auth_headers
    )
    
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_update_task_status_unauthorized(client: AsyncClient, db_session, test_user):
    """Test task status update fails when user is not authorized."""
    # Create another user who owns the task
    owner = User(email="owner@example.com")
    owner.set_password("password")
    db_session.add(owner)
    await db_session.commit()
    await db_session.refresh(owner)
    
    # Create a task owned by the other user
    task = Task(
        title="Test Task",
        owner_id=owner.id
    )
    db_session.add(task)
    await db_session.commit()
    await db_session.refresh(task)
    
    # Try to update status (should fail)
    from app.core.security import create_access_token
    test_user_token = create_access_token(data={"sub": str(test_user.id)})
    headers = {"Authorization": f"Bearer {test_user_token}"}
    
    response = await client.put(
        f"/api/v1/tasks/{task.id}/status",
        json={"status": "completed"},
        headers=headers
    )
    
    assert response.status_code == 403