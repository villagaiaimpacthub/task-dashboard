#!/usr/bin/env python3
"""
Update draft tasks to available status so they can be claimed
"""
import asyncio
import sys
from pathlib import Path

# Add the current directory to Python path
sys.path.insert(0, str(Path(__file__).parent))

from app.database import async_session
from app.models.task import Task
from sqlalchemy import select, update

async def make_tasks_available():
    """Update draft tasks to available status"""
    async with async_session() as session:
        try:
            # Find all draft tasks
            stmt = select(Task).where(Task.status == "draft")
            result = await session.execute(stmt)
            draft_tasks = result.scalars().all()
            
            if not draft_tasks:
                print("✓ No draft tasks found")
                return
            
            print(f"📋 Found {len(draft_tasks)} draft tasks")
            
            # Update draft tasks to available
            update_stmt = update(Task).where(Task.status == "draft").values(status="available")
            await session.execute(update_stmt)
            await session.commit()
            
            # Show updated tasks
            print("✅ Updated tasks to 'available' status:")
            for task in draft_tasks:
                print(f"  • {task.title[:50]}... (ID: {str(task.id)[:8]}...)")
            
            print(f"\n🎯 Now you can claim any of these {len(draft_tasks)} tasks!")
            print("💡 Remember: You can only claim tasks created by other users")
            
        except Exception as e:
            print(f"❌ Error updating tasks: {e}")
            await session.rollback()

if __name__ == "__main__":
    asyncio.run(make_tasks_available())