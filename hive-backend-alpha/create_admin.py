#!/usr/bin/env python3
"""Create admin user for testing"""

import asyncio
import sys
import os

# Add the project root to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import async_session
from app.models.user import User
from app.core.security import get_password_hash
from sqlalchemy import select

async def create_admin():
    """Create admin user"""
    async with async_session() as db:
        # Check if admin exists
        result = await db.execute(select(User).where(User.email == "admin@example.com"))
        existing_admin = result.scalar_one_or_none()
        
        if existing_admin:
            print("Admin user already exists")
            return
        
        # Create admin user
        admin = User(
            email="admin@example.com",
            hashed_password=get_password_hash("admin123"),
            is_active=True,
            is_online=True,
            impact_score=0,
            skills=["System Administration", "Project Management"],
            role="Admin",
            status="available"
        )
        
        db.add(admin)
        await db.commit()
        print("Admin user created: admin@example.com / admin123")

if __name__ == "__main__":
    asyncio.run(create_admin())