#!/usr/bin/env python3
"""Database initialization script."""

import asyncio
import subprocess
import sys
import os
from pathlib import Path

# Add the project root to Python path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from app.database import engine
from app.models import Base


async def check_database_connection():
    """Check if database is accessible."""
    try:
        async with engine.begin() as conn:
            await conn.execute("SELECT 1")
        print("✅ Database connection successful")
        return True
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False


async def init_database():
    """Initialize the database by creating tables."""
    print("Initializing database tables...")
    
    try:
        # Create all tables
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        
        print("✅ Database tables created successfully!")
        return True
    except Exception as e:
        print(f"❌ Database initialization failed: {e}")
        return False


def check_alembic_setup():
    """Check if Alembic is properly set up."""
    try:
        # Check if alembic.ini exists
        alembic_ini = project_root / "alembic.ini"
        if not alembic_ini.exists():
            print("❌ alembic.ini not found")
            return False
        
        # Check if migrations directory exists
        migrations_dir = project_root / "migrations"
        if not migrations_dir.exists():
            print("❌ migrations directory not found")
            return False
        
        print("✅ Alembic configuration found")
        return True
    except Exception as e:
        print(f"❌ Alembic setup check failed: {e}")
        return False


def run_alembic_upgrade():
    """Run alembic upgrade to apply migrations."""
    try:
        print("Running alembic upgrade head...")
        
        # Change to project directory for alembic
        os.chdir(project_root)
        
        result = subprocess.run(
            ["alembic", "upgrade", "head"], 
            check=True,
            capture_output=True,
            text=True
        )
        
        if result.stdout:
            print("Alembic output:", result.stdout)
        
        print("✅ Alembic upgrade completed successfully!")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Alembic upgrade failed: {e}")
        if e.stderr:
            print("Error output:", e.stderr)
        return False
    except FileNotFoundError:
        print("❌ Alembic not found. Make sure it's installed: pip install alembic")
        return False


async def main():
    """Main initialization function."""
    print("🚀 Starting HIVE Backend Alpha database initialization...")
    print()
    
    # Check database connection
    if not await check_database_connection():
        print("💡 Make sure PostgreSQL is running and accessible")
        sys.exit(1)
    
    # Check Alembic setup
    if not check_alembic_setup():
        print("💡 Run 'alembic init migrations' to set up Alembic")
        sys.exit(1)
    
    # Initialize database
    if not await init_database():
        sys.exit(1)
    
    # Run migrations
    if not run_alembic_upgrade():
        sys.exit(1)
    
    print()
    print("🎉 Database initialization completed successfully!")
    print("   You can now start the HIVE backend server.")


if __name__ == "__main__":
    asyncio.run(main())