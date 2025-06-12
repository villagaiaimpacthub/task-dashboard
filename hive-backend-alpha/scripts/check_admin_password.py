#!/usr/bin/env python3
"""Check admin password and create if needed."""

import asyncio
import sys
from pathlib import Path

# Add the project root to Python path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from app.database import get_db
from app.models.user import User
from app.core.security import verify_password, get_password_hash
from sqlalchemy import select


async def check_admin_password():
    """Check admin password and create if needed."""
    # Create a generator and get the session
    async_gen = get_db()
    db = await async_gen.__anext__()
    
    try:
        # Get admin user
        result = await db.execute(select(User).where(User.email == "admin@example.com"))
        admin_user = result.scalar_one_or_none()
        
        if not admin_user:
            print("❌ No admin user found. Creating one...")
            # Create admin user
            admin_user = User(
                email="admin@example.com",
                role="admin"
            )
            admin_user.set_password("admin123")
            db.add(admin_user)
            await db.commit()
            await db.refresh(admin_user)
            print("✅ Admin user created with password: admin123")
            return
        
        print(f"✅ Admin user found: {admin_user.email}")
        print(f"   User ID: {admin_user.id}")
        print(f"   Has password hash: {'Yes' if admin_user.hashed_password else 'No'}")
        
        # Test common passwords
        test_passwords = ["admin", "admin123", "password", "password123", "testpassword"]
        
        for password in test_passwords:
            if verify_password(password, admin_user.hashed_password):
                print(f"✅ Password found: '{password}'")
                return
        
        print("❌ None of the common passwords work. Resetting to 'admin123'...")
        admin_user.set_password("admin123")
        await db.commit()
        print("✅ Password reset to: admin123")
        
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        await db.close()


async def main():
    """Main function."""
    print("🔍 Checking admin user password...")
    print()
    
    await check_admin_password()


if __name__ == "__main__":
    asyncio.run(main())