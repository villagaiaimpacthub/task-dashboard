import pytest
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4
from datetime import datetime

from app.services.dashboard_service import (
    get_task_statistics,
    get_user_statistics,
    get_dashboard_summary,
    get_live_status
)
from app.schemas.dashboard import TaskStats, UserStats


class TestTaskStatistics:
    """Test task statistics functionality."""
    
    @pytest.mark.asyncio
    async def test_get_task_statistics_empty_db(self):
        """Test task statistics with empty database."""
        # Mock database session
        mock_db = AsyncMock()
        
        # Mock query results
        mock_total_result = MagicMock()
        mock_total_result.scalar.return_value = 0
        
        mock_status_result = MagicMock()
        mock_status_result.fetchall.return_value = []
        
        mock_db.execute.side_effect = [mock_total_result, mock_status_result]
        
        # Test the function
        stats = await get_task_statistics(mock_db)
        
        assert isinstance(stats, TaskStats)
        assert stats.total == 0
        assert stats.by_status["draft"] == 0
        assert stats.by_status["available"] == 0
        assert stats.by_status["in_progress"] == 0
        assert stats.by_status["completed"] == 0
    
    @pytest.mark.asyncio
    async def test_get_task_statistics_with_data(self):
        """Test task statistics with sample data."""
        # Mock database session
        mock_db = AsyncMock()
        
        # Mock query results
        mock_total_result = MagicMock()
        mock_total_result.scalar.return_value = 10
        
        mock_status_result = MagicMock()
        mock_status_result.fetchall.return_value = [
            ("draft", 3),
            ("available", 2),
            ("in_progress", 3),
            ("completed", 2)
        ]
        
        mock_db.execute.side_effect = [mock_total_result, mock_status_result]
        
        # Test the function
        stats = await get_task_statistics(mock_db)
        
        assert stats.total == 10
        assert stats.by_status["draft"] == 3
        assert stats.by_status["available"] == 2
        assert stats.by_status["in_progress"] == 3
        assert stats.by_status["completed"] == 2


class TestUserStatistics:
    """Test user statistics functionality."""
    
    @pytest.mark.asyncio
    async def test_get_user_statistics_empty_db(self):
        """Test user statistics with empty database."""
        # Mock database session
        mock_db = AsyncMock()
        
        # Mock all count queries to return 0
        mock_result = MagicMock()
        mock_result.scalar.return_value = 0
        mock_db.execute.return_value = mock_result
        
        # Test the function
        stats = await get_user_statistics(mock_db)
        
        assert isinstance(stats, UserStats)
        assert stats.total_users == 0
        assert stats.active_users == 0
        assert stats.online_users == 0
    
    @pytest.mark.asyncio
    async def test_get_user_statistics_with_data(self):
        """Test user statistics with sample data."""
        # Mock database session
        mock_db = AsyncMock()
        
        # Mock different count results
        total_result = MagicMock()
        total_result.scalar.return_value = 100
        
        active_result = MagicMock()
        active_result.scalar.return_value = 85
        
        online_result = MagicMock()
        online_result.scalar.return_value = 15
        
        mock_db.execute.side_effect = [total_result, active_result, online_result]
        
        # Test the function
        stats = await get_user_statistics(mock_db)
        
        assert stats.total_users == 100
        assert stats.active_users == 85
        assert stats.online_users == 15


class TestDashboardSummary:
    """Test dashboard summary functionality."""
    
    @pytest.mark.asyncio
    async def test_get_dashboard_summary(self):
        """Test complete dashboard summary."""
        # Mock database session
        mock_db = AsyncMock()
        
        # Mock all database queries for task and user stats
        mock_db.execute.side_effect = [
            # Task total
            MagicMock(scalar=lambda: 50),
            # Task by status
            MagicMock(fetchall=lambda: [("draft", 10), ("available", 15), ("in_progress", 20), ("completed", 5)]),
            # User total
            MagicMock(scalar=lambda: 200),
            # Active users
            MagicMock(scalar=lambda: 180),
            # Online users
            MagicMock(scalar=lambda: 25)
        ]
        
        # Test the function
        summary = await get_dashboard_summary(mock_db)
        
        assert summary.tasks.total == 50
        assert summary.tasks.by_status["draft"] == 10
        assert summary.users.total_users == 200
        assert summary.users.active_users == 180
        assert summary.users.online_users == 25
        assert isinstance(summary.last_updated, datetime)


class TestLiveStatus:
    """Test live status functionality."""
    
    @pytest.mark.asyncio
    async def test_get_live_status(self):
        """Test live status indicators."""
        # Mock database session
        mock_db = AsyncMock()
        
        # Mock queries for live status
        online_users_result = MagicMock()
        online_users_result.scalar.return_value = 12
        
        active_tasks_result = MagicMock()
        active_tasks_result.scalar.return_value = 8
        
        recent_activity_result = MagicMock()
        recent_activity_result.scalar.return_value = 25
        
        mock_db.execute.side_effect = [
            online_users_result,
            active_tasks_result,
            recent_activity_result
        ]
        
        # Test the function
        status = await get_live_status(mock_db)
        
        assert status.online_users_count == 12
        assert status.active_tasks_count == 8
        assert status.recent_activity_count == 25
        assert status.system_status == "operational"