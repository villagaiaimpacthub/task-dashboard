import pytest
from uuid import uuid4
from app.models.user import User
from app.models.task import Task
from app.models.user_task_association import UserTaskAssociation


class TestUserModel:
    """Test the User model."""
    
    def test_user_creation(self):
        """Test basic user creation."""
        user = User(email="test@example.com")
        user.set_password("testpassword")
        
        assert user.email == "test@example.com"
        assert user.is_active is True
        assert user.hashed_password is not None
        assert user.hashed_password != "testpassword"
    
    def test_password_hashing(self):
        """Test password hashing and verification."""
        user = User(email="test@example.com")
        password = "secure_password_123"
        
        user.set_password(password)
        
        # Password should be hashed
        assert user.hashed_password != password
        
        # Verification should work
        assert user.verify_password(password) is True
        assert user.verify_password("wrong_password") is False
    
    def test_user_defaults(self):
        """Test user default values."""
        user = User(email="test@example.com")
        
        assert user.is_active is True
        assert user.id is not None
        assert user.created_at is not None
        assert user.updated_at is not None


class TestTaskModel:
    """Test the Task model."""
    
    def test_task_creation(self):
        """Test basic task creation."""
        owner_id = uuid4()
        task = Task(
            title="Test Task",
            description="Test Description",
            owner_id=owner_id
        )
        
        assert task.title == "Test Task"
        assert task.description == "Test Description"
        assert task.owner_id == owner_id
        assert task.status == "draft"
        assert task.assignee_id is None
    
    def test_task_assignment(self):
        """Test task assignment."""
        owner_id = uuid4()
        assignee_id = uuid4()
        
        task = Task(
            title="Test Task",
            owner_id=owner_id
        )
        
        # Initially no assignee
        assert task.assignee_id is None
        
        # Assign user
        task.assignee_id = assignee_id
        assert task.assignee_id == assignee_id
    
    def test_task_status_values(self):
        """Test task status field accepts valid values."""
        owner_id = uuid4()
        task = Task(title="Test Task", owner_id=owner_id)
        
        # Test all valid statuses
        valid_statuses = ["draft", "available", "in_progress", "completed"]
        for status in valid_statuses:
            task.status = status
            assert task.status == status
    
    def test_task_defaults(self):
        """Test task default values."""
        owner_id = uuid4()
        task = Task(title="Test Task", owner_id=owner_id)
        
        assert task.status == "draft"
        assert task.assignee_id is None
        assert task.id is not None
        assert task.created_at is not None
        assert task.updated_at is not None


class TestUserTaskAssociation:
    """Test the UserTaskAssociation model."""
    
    def test_association_creation(self):
        """Test creating a user-task association."""
        user_id = uuid4()
        task_id = uuid4()
        
        association = UserTaskAssociation(
            user_id=user_id,
            task_id=task_id
        )
        
        assert association.user_id == user_id
        assert association.task_id == task_id
        assert association.assigned_at is not None
        assert association.id is not None