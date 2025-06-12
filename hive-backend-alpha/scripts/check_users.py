#!/usr/bin/env python3
"""Check what users exist in the database."""

import asyncio
import sys
from pathlib import Path

# Add the project root to Python path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from app.database import get_db
from app.models.user import User
from sqlalchemy import select


async def check_users():
    """Check what users exist in the database."""
    # Create a generator and get the session
    async_gen = get_db()
    db = await async_gen.__anext__()
    
    try:
        # Get all users
        result = await db.execute(select(User))
        users = result.scalars().all()
        
        print(f"Found {len(users)} users in the database:")
        for user in users:
            print(f"  - Email: {user.email}")
            print(f"    ID: {user.id}")
            print(f"    Created: {user.created_at}")
            print()
        
        if not users:
            print("No users found in the database.")
            print("You may need to create an admin user.")
        
        return users
    except Exception as e:
        print(f"❌ Error checking users: {e}")
        return []
    finally:
        await db.close()


async def main():
    """Main function."""
    print("🔍 Checking users in the database...")
    print()
    
    await check_users()


if __name__ == "__main__":
    asyncio.run(main())