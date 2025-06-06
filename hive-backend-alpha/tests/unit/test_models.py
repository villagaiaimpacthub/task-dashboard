import pytest
from app.models.user import User
from app.models.task import Task


def test_user_password_hashing():
    """Test user password hashing and verification."""
    user = User(email="test@example.com")
    password = "testpassword123"
    
    user.set_password(password)
    assert user.hashed_password != password
    assert user.verify_password(password) is True
    assert user.verify_password("wrongpassword") is False


def test_user_model_creation():
    """Test basic user model creation."""
    user = User(email="test@example.com")
    user.set_password("password")
    
    assert user.email == "test@example.com"
    assert user.is_active is True
    assert user.hashed_password is not None


def test_task_model_creation():
    """Test basic task model creation."""
    import uuid
    owner_id = uuid.uuid4()
    
    task = Task(
        title="Test Task",
        description="Test Description",
        owner_id=owner_id
    )
    
    assert task.title == "Test Task"
    assert task.description == "Test Description"
    assert task.status == "draft"
    assert task.owner_id == owner_id