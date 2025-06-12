#!/usr/bin/env python3
"""Delete all tasks from the database."""

import asyncio
import sys
from pathlib import Path

# Add the project root to Python path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from app.database import get_db
from app.models.task import Task
from sqlalchemy import delete
from sqlalchemy.ext.asyncio import AsyncSession


async def delete_all_tasks():
    """Delete all tasks from the database."""
    # Create a generator and get the session
    async_gen = get_db()
    db = await async_gen.__anext__()
    
    try:
        try:
            # Delete all tasks
            result = await db.execute(delete(Task))
            await db.commit()
            
            count = result.rowcount
            print(f"✅ Successfully deleted {count} tasks from the database")
            return True
        except Exception as e:
            print(f"❌ Error deleting tasks: {e}")
            await db.rollback()
            return False
    finally:
        await db.close()


async def main():
    """Main function."""
    print("🗑️  Deleting all tasks from the database...")
    
    success = await delete_all_tasks()
    
    if success:
        print("✨ Database is now ready for fresh task import")
    else:
        print("💥 Failed to delete tasks")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())