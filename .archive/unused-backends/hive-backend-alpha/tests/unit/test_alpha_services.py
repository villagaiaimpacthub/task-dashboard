import pytest
from uuid import uuid4
from unittest.mock import AsyncMock, MagicMock
from app.models.user import User
from app.models.task import Task
from app.services.assignment_service import (
    can_assign_task, 
    can_update_task_status
)
from app.schemas.user import UserCreate, UserUpdate
from app.schemas.task import TaskCreate, TaskUpdate


class TestAssignmentService:
    """Test the assignment service logic."""
    
    def test_can_assign_task_owner(self):
        """Test that task owner can assign tasks."""
        owner_id = uuid4()
        owner = User(id=owner_id, email="owner@example.com")
        task = Task(title="Test Task", owner_id=owner_id)
        
        assert can_assign_task(task, owner) is True
    
    def test_can_assign_task_non_owner(self):
        """Test that non-owners cannot assign tasks."""
        owner_id = uuid4()
        other_user_id = uuid4()
        
        owner = User(id=owner_id, email="owner@example.com")
        other_user = User(id=other_user_id, email="other@example.com")
        task = Task(title="Test Task", owner_id=owner_id)
        
        assert can_assign_task(task, other_user) is False
    
    def test_can_update_task_status_owner(self):
        """Test that task owner can update status."""
        owner_id = uuid4()
        owner = User(id=owner_id, email="owner@example.com")
        task = Task(title="Test Task", owner_id=owner_id)
        
        assert can_update_task_status(task, owner) is True
    
    def test_can_update_task_status_assignee(self):
        """Test that task assignee can update status."""
        owner_id = uuid4()
        assignee_id = uuid4()
        
        assignee = User(id=assignee_id, email="assignee@example.com")
        task = Task(
            title="Test Task", 
            owner_id=owner_id,
            assignee_id=assignee_id
        )
        
        assert can_update_task_status(task, assignee) is True
    
    def test_can_update_task_status_unauthorized(self):
        """Test that unauthorized users cannot update status."""
        owner_id = uuid4()
        assignee_id = uuid4()
        other_user_id = uuid4()
        
        other_user = User(id=other_user_id, email="other@example.com")
        task = Task(
            title="Test Task",
            owner_id=owner_id,
            assignee_id=assignee_id
        )
        
        assert can_update_task_status(task, other_user) is False


class TestUserSchemas:
    """Test user-related Pydantic schemas."""
    
    def test_user_create_schema(self):
        """Test UserCreate schema validation."""
        user_data = {
            "email": "test@example.com",
            "password": "securepassword123"
        }
        
        user_create = UserCreate(**user_data)
        assert user_create.email == "test@example.com"
        assert user_create.password == "securepassword123"
    
    def test_user_update_schema(self):
        """Test UserUpdate schema validation."""
        user_data = {"email": "updated@example.com"}
        
        user_update = UserUpdate(**user_data)
        assert user_update.email == "updated@example.com"
    
    def test_user_update_schema_partial(self):
        """Test UserUpdate schema with partial data."""
        user_update = UserUpdate()
        assert user_update.email is None


class TestTaskSchemas:
    """Test task-related Pydantic schemas."""
    
    def test_task_create_schema(self):
        """Test TaskCreate schema validation."""
        task_data = {
            "title": "Test Task",
            "description": "Test Description"
        }
        
        task_create = TaskCreate(**task_data)
        assert task_create.title == "Test Task"
        assert task_create.description == "Test Description"
    
    def test_task_create_schema_minimal(self):
        """Test TaskCreate schema with minimal data."""
        task_data = {"title": "Test Task"}
        
        task_create = TaskCreate(**task_data)
        assert task_create.title == "Test Task"
        assert task_create.description is None
    
    def test_task_update_schema(self):
        """Test TaskUpdate schema validation."""
        task_data = {
            "title": "Updated Task",
            "status": "in_progress"
        }
        
        task_update = TaskUpdate(**task_data)
        assert task_update.title == "Updated Task"
        assert task_update.status == "in_progress"
        assert task_update.description is None