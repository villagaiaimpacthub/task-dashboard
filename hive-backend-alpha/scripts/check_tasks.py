#!/usr/bin/env python3
"""Check what tasks exist in the database."""

import asyncio
import sys
from pathlib import Path

# Add the project root to Python path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from app.database import get_db
from app.models.task import Task
from sqlalchemy import select


async def check_tasks():
    """Check what tasks exist in the database."""
    # Create a generator and get the session
    async_gen = get_db()
    db = await async_gen.__anext__()
    
    try:
        # Get all tasks
        result = await db.execute(select(Task))
        tasks = result.scalars().all()
        
        print(f"Found {len(tasks)} tasks in the database:")
        for task in tasks:
            print(f"  - Title: {task.title}")
            print(f"    ID: {task.id}")
            print(f"    Status: {task.status}")
            print(f"    Owner ID: {task.owner_id}")
            print()
        
        if not tasks:
            print("No tasks found in the database.")
            print("This explains why the frontend shows 'failed to load tasks'.")
        
        return tasks
    except Exception as e:
        print(f"❌ Error checking tasks: {e}")
        return []
    finally:
        await db.close()


async def main():
    """Main function."""
    print("🔍 Checking tasks in the database...")
    print()
    
    await check_tasks()


if __name__ == "__main__":
    asyncio.run(main())