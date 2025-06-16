#!/usr/bin/env python3
"""
Create a test user for demonstrating task claiming functionality
"""
import asyncio
import sys
import uuid
from pathlib import Path

# Add the current directory to Python path
sys.path.insert(0, str(Path(__file__).parent))

from app.database import async_session
from app.models.user import User
from sqlalchemy import select

async def create_test_user():
    """Create a test user for claiming tasks"""
    async with async_session() as session:
        try:
            # Check if test user already exists by email
            stmt = select(User).where(User.email == "testuser@example.com")
            result = await session.execute(stmt)
            existing_user = result.scalar_one_or_none()
            
            if existing_user:
                print("✓ Test user already exists")
                print(f"  Email: {existing_user.email}")
                print(f"  ID: {existing_user.id}")
                return existing_user
            
            # Create new test user with proper UUID
            test_user_id = uuid.UUID("12345678-1234-5678-9abc-123456789012")
            test_user = User(
                id=test_user_id,
                email="testuser@example.com",
                is_active=True,
                impact_score=50,
                skills=["JavaScript", "Python", "Testing"],
                is_online=True,
                role="Developer",
                status="available"
            )
            test_user.set_password("testpass123")
            
            session.add(test_user)
            await session.commit()
            await session.refresh(test_user)
            
            print("✅ Test user created successfully!")
            print(f"  Email: {test_user.email}")
            print(f"  Password: testpass123")
            print(f"  ID: {test_user.id}")
            print(f"  Skills: {test_user.skills}")
            
            return test_user
            
        except Exception as e:
            print(f"❌ Error creating test user: {e}")
            await session.rollback()
            return None

if __name__ == "__main__":
    asyncio.run(create_test_user())