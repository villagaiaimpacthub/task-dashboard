#!/usr/bin/env python3
"""Test API endpoints directly."""

import asyncio
import sys
from pathlib import Path

# Add the project root to Python path
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

from app.database import get_db
from app.services.task_service import get_tasks


async def test_get_tasks():
    """Test get_tasks function directly."""
    try:
        # Create a generator and get the session
        async_gen = get_db()
        db = await async_gen.__anext__()
        
        print("Testing get_tasks function...")
        tasks = await get_tasks(db, skip=0, limit=10)
        print(f"✅ Successfully retrieved {len(tasks)} tasks")
        
        if tasks:
            task = tasks[0]
            print(f"Sample task: {task.title}")
            print(f"Task ID: {task.id}")
            print(f"Task dict: {task.__dict__}")
        
        await db.close()
        
    except Exception as e:
        print(f"❌ Error in get_tasks: {e}")
        import traceback
        traceback.print_exc()


async def main():
    """Main function."""
    print("🔍 Testing task API...")
    await test_get_tasks()


if __name__ == "__main__":
    asyncio.run(main())