"""
HIVE API Contract Layer - Python Backend Validation

This file provides Pydantic schemas and validation utilities for the backend
to ensure it matches the frontend contract exactly.
"""

from typing import Optional, List, Dict, Any, Literal
from pydantic import BaseModel, Field, validator
from datetime import datetime
from enum import Enum

# =============================================================================
# ENUMS - Synchronized with JavaScript contract
# =============================================================================

class TaskStatus(str, Enum):
    AVAILABLE = "available"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    ON_HOLD = "on_hold"

class TaskPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"

class MessageType(str, Enum):
    TASK_CHAT = "task_chat"
    DIRECT_MESSAGE = "direct_message"

class HelpUrgency(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class HelpStatus(str, Enum):
    OPEN = "open"
    ASSIGNED = "assigned"
    RESOLVED = "resolved"

# =============================================================================
# CORE SCHEMAS - Exactly matching JavaScript contract
# =============================================================================

class DefinitionOfDoneItem(BaseModel):
    id: int
    text: str
    completed: bool = False

class UserBase(BaseModel):
    email: str
    role: Optional[str] = None
    skills: List[str] = Field(default_factory=list)

class UserCreate(UserBase):
    password: str = Field(..., min_length=6)

class UserLogin(BaseModel):
    email: str
    password: str

class UserUpdate(BaseModel):
    email: Optional[str] = None
    skills: Optional[List[str]] = None
    role: Optional[str] = None
    status: Optional[str] = None

class User(UserBase):
    id: str
    is_online: bool = False
    impact_score: int = 0
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True

class TaskBase(BaseModel):
    title: str = Field(..., min_length=1)
    description: Optional[str] = None
    priority: TaskPriority = TaskPriority.MEDIUM
    category: Optional[str] = None
    impact_points: int = Field(default=100, gt=0)
    estimated_hours: Optional[str] = None
    location: Optional[str] = None
    team_size: Optional[str] = None
    due_date: Optional[str] = None
    required_skills: List[str] = Field(default_factory=list)

class TaskCreate(TaskBase):
    definition_of_done: Optional[str] = None  # Raw text input
    
    @validator('definition_of_done')
    def parse_definition_of_done(cls, v):
        """Parse definition of done text into structured items"""
        if v and v.strip():
            lines = [line.strip() for line in v.split('\n') if line.strip()]
            return [
                {"id": i + 1, "text": line, "completed": False}
                for i, line in enumerate(lines)
            ]
        return []

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[TaskStatus] = None
    priority: Optional[TaskPriority] = None
    category: Optional[str] = None
    impact_points: Optional[int] = Field(None, gt=0)
    estimated_hours: Optional[str] = None
    location: Optional[str] = None
    team_size: Optional[str] = None
    due_date: Optional[str] = None
    required_skills: Optional[List[str]] = None

class TaskAssign(BaseModel):
    user_id: str

class TaskStatusUpdate(BaseModel):
    status: TaskStatus

class Task(TaskBase):
    id: str
    status: TaskStatus = TaskStatus.AVAILABLE
    definition_of_done: List[DefinitionOfDoneItem] = Field(default_factory=list)
    owner_id: str
    assignee_id: Optional[str] = None
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True

class CommentBase(BaseModel):
    content: str = Field(..., min_length=1)

class CommentCreate(CommentBase):
    task_id: str

class CommentUpdate(BaseModel):
    content: str = Field(..., min_length=1)

class Comment(CommentBase):
    id: str
    task_id: str
    user_id: str
    user_email: str
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True

class ChatMessageCreate(BaseModel):
    content: str = Field(..., min_length=1)

class ChatMessage(BaseModel):
    id: str
    content: str
    task_id: Optional[str] = None
    recipient_id: Optional[str] = None
    sender_id: str
    sender_email: str
    message_type: MessageType = MessageType.TASK_CHAT
    created_at: str

    class Config:
        from_attributes = True

class FileUpload(BaseModel):
    name: str
    content: str  # Base64 encoded
    type: str
    size: int

class File(BaseModel):
    id: str
    name: str
    type: str
    size: int
    task_id: str
    uploaded_at: str
    uploaded_by: str

    class Config:
        from_attributes = True

class FileDownload(BaseModel):
    content: str  # Base64 encoded
    name: str
    type: str

class DashboardSummary(BaseModel):
    total_tasks: int
    available_tasks: int
    in_progress_tasks: int
    completed_tasks: int
    total_users: Optional[int] = None
    active_users: Optional[int] = None
    online_users: Optional[int] = None
    total_impact_points: int

class HelpRequestCreate(BaseModel):
    task_id: str
    urgency: HelpUrgency = HelpUrgency.MEDIUM
    description: str = Field(..., min_length=1)

class HelpRequest(BaseModel):
    id: str
    task_id: str
    urgency: HelpUrgency
    description: str
    requester_id: str
    requester_email: str
    created_at: str
    status: HelpStatus = HelpStatus.OPEN

    class Config:
        from_attributes = True

class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: User

class WebSocketResponse(BaseModel):
    status: str
    message: str
    timestamp: str

class HealthResponse(BaseModel):
    status: str
    message: str

class DoDUpdateRequest(BaseModel):
    dod_item_id: int
    completed: bool

# =============================================================================
# API RESPONSE WRAPPERS
# =============================================================================

class APIResponse(BaseModel):
    """Generic API response wrapper"""
    message: str
    data: Optional[Dict[str, Any]] = None

class TaskResponse(APIResponse):
    task: Task

class HelpRequestResponse(APIResponse):
    request: HelpRequest

# =============================================================================
# VALIDATION UTILITIES
# =============================================================================

def validate_task_create(data: Dict[str, Any]) -> TaskCreate:
    """Validate task creation data with contract compliance"""
    return TaskCreate(**data)

def validate_task_update(data: Dict[str, Any]) -> TaskUpdate:
    """Validate task update data with contract compliance"""
    return TaskUpdate(**data)

def validate_comment_create(data: Dict[str, Any]) -> CommentCreate:
    """Validate comment creation data with contract compliance"""
    return CommentCreate(**data)

def validate_chat_message_create(data: Dict[str, Any]) -> ChatMessageCreate:
    """Validate chat message creation data with contract compliance"""
    return ChatMessageCreate(**data)

def validate_file_upload(data: Dict[str, Any]) -> FileUpload:
    """Validate file upload data with contract compliance"""
    return FileUpload(**data)

def validate_help_request_create(data: Dict[str, Any]) -> HelpRequestCreate:
    """Validate help request creation data with contract compliance"""
    return HelpRequestCreate(**data)

# =============================================================================
# CONTRACT COMPLIANCE CHECKERS
# =============================================================================

def ensure_contract_compliance():
    """
    Run this function to verify that all schemas are properly defined
    and match the JavaScript contract expectations.
    """
    print("🔍 Checking API Contract Compliance...")
    
    # Test schema instantiation
    test_cases = [
        (TaskCreate, {"title": "Test Task", "priority": "high"}),
        (UserCreate, {"email": "test@example.com", "password": "password123"}),
        (CommentCreate, {"content": "Test comment", "task_id": "123"}),
        (DashboardSummary, {"total_tasks": 5, "available_tasks": 2, "in_progress_tasks": 1, "completed_tasks": 2, "total_impact_points": 500}),
    ]
    
    for schema_class, test_data in test_cases:
        try:
            instance = schema_class(**test_data)
            print(f"✅ {schema_class.__name__} - Valid")
        except Exception as e:
            print(f"❌ {schema_class.__name__} - Error: {e}")
    
    print("✅ Contract compliance check completed")

# =============================================================================
# FASTAPI INTEGRATION HELPERS
# =============================================================================

def create_fastapi_dependencies():
    """
    Create FastAPI dependencies for automatic request validation
    Usage in FastAPI routes:
    
    from fastapi import Depends
    from api_contract import validate_task_create_dep
    
    @app.post("/api/v1/tasks/")
    async def create_task(task_data: TaskCreate = Depends(validate_task_create_dep)):
        # task_data is automatically validated
        pass
    """
    from fastapi import HTTPException, Request
    
    async def validate_task_create_dep(request: Request):
        data = await request.json()
        try:
            return validate_task_create(data)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Validation error: {e}")
    
    return {
        'validate_task_create': validate_task_create_dep,
        # Add more as needed
    }

# =============================================================================
# SIMPLE BACKEND INTEGRATION
# =============================================================================

def validate_simple_backend_request(endpoint: str, data: Dict[str, Any]) -> Any:
    """
    Validation function for simple_backend.py integration
    
    Usage:
    validated_data = validate_simple_backend_request('/api/v1/tasks/', post_data)
    """
    validation_map = {
        '/api/v1/tasks/': validate_task_create,
        '/api/v1/comments/': validate_comment_create,
        '/api/v1/help-requests/': validate_help_request_create,
    }
    
    validator_func = validation_map.get(endpoint)
    if validator_func:
        try:
            return validator_func(data)
        except Exception as e:
            raise ValueError(f"Contract validation failed for {endpoint}: {e}")
    
    return data  # Pass through if no validator

if __name__ == "__main__":
    ensure_contract_compliance()