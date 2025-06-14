from fastapi import APIRouter
from .auth import router as auth_router
from .users import router as users_router
from .projects import router as projects_router
from .tasks import router as tasks_router
from .websocket import router as websocket_router
from .dashboard import router as dashboard_router
from .comments import router as comments_router
from .chat import router as chat_router
from .import_routes import router as import_router
from .milestones import router as milestones_router
from .files import router as files_router

api_router = APIRouter()
api_router.include_router(auth_router, prefix="/auth", tags=["auth"])
api_router.include_router(users_router, prefix="/users", tags=["users"])
api_router.include_router(projects_router, prefix="/projects", tags=["projects"])
api_router.include_router(tasks_router, prefix="/tasks", tags=["tasks"])
api_router.include_router(dashboard_router, prefix="/dashboard", tags=["dashboard"])
api_router.include_router(websocket_router, tags=["websocket"])
api_router.include_router(comments_router, prefix="/comments", tags=["comments"])
api_router.include_router(chat_router, prefix="/chat", tags=["chat"])
api_router.include_router(import_router, prefix="/import", tags=["import"])
api_router.include_router(milestones_router, prefix="/milestones", tags=["milestones"])
api_router.include_router(files_router, prefix="/files", tags=["files"])