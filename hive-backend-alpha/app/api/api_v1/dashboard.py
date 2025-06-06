from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.dashboard import DashboardSummaryResponse, LiveStatusResponse
from app.schemas.user import UserResponse
from app.services import dashboard_service, user_service

router = APIRouter()


@router.get("/summary", response_model=DashboardSummaryResponse)
async def get_dashboard_summary(db: AsyncSession = Depends(get_db)):
    """Get comprehensive dashboard summary with task and user statistics."""
    return await dashboard_service.get_dashboard_summary(db)


@router.get("/live-status", response_model=LiveStatusResponse)
async def get_live_status(db: AsyncSession = Depends(get_db)):
    """Get real-time status indicators for dashboard."""
    return await dashboard_service.get_live_status(db)


@router.get("/online-users", response_model=List[UserResponse])
async def get_online_users(
    limit: int = 50,
    db: AsyncSession = Depends(get_db)
):
    """Get list of currently online users for team coordination section."""
    users = await user_service.get_online_users(db, limit=limit)
    return users