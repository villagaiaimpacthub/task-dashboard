import pytest
from uuid import uuid4
from app.models.task import Task
from app.models.user import User
from app.services.assignment_service import can_assign_task, can_update_task_status


def test_task_status_transitions():
    """Test task status field accepts valid statuses."""
    owner_id = uuid4()
    task = Task(
        title="Test Task",
        description="Test Description",
        owner_id=owner_id,
        status="draft"
    )
    
    assert task.status == "draft"
    
    # Test status updates
    task.status = "available"
    assert task.status == "available"
    
    task.status = "in_progress"
    assert task.status == "in_progress"
    
    task.status = "completed"
    assert task.status == "completed"


def test_task_assignment():
    """Test task assignment functionality."""
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


def test_can_assign_task_permissions():
    """Test task assignment permission logic."""
    owner_id = uuid4()
    other_user_id = uuid4()
    
    owner = User(id=owner_id, email="owner@example.com")
    other_user = User(id=other_user_id, email="other@example.com")
    
    task = Task(
        title="Test Task",
        owner_id=owner_id
    )
    
    # Owner can assign
    assert can_assign_task(task, owner) is True
    
    # Other user cannot assign
    assert can_assign_task(task, other_user) is False


def test_can_update_task_status_permissions():
    """Test task status update permission logic."""
    owner_id = uuid4()
    assignee_id = uuid4()
    other_user_id = uuid4()
    
    owner = User(id=owner_id, email="owner@example.com")
    assignee = User(id=assignee_id, email="assignee@example.com")
    other_user = User(id=other_user_id, email="other@example.com")
    
    task = Task(
        title="Test Task",
        owner_id=owner_id,
        assignee_id=assignee_id
    )
    
    # Owner can update status
    assert can_update_task_status(task, owner) is True
    
    # Assignee can update status
    assert can_update_task_status(task, assignee) is True
    
    # Other user cannot update status
    assert can_update_task_status(task, other_user) is False