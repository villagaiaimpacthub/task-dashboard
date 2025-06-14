#!/usr/bin/env python3
"""Script to manually create projects table and add project_id to tasks"""

import asyncio
import sys
import os

# Add the project root to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import engine
from sqlalchemy import text

async def create_projects_table():
    """Create projects table and add project_id to tasks table"""
    async with engine.begin() as conn:
        # Check if projects table exists
        result = await conn.execute(text("""
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name='projects'
        """))
        if result.fetchone():
            print("Projects table already exists")
        else:
            # Create projects table
            await conn.execute(text("""
                CREATE TABLE projects (
                    id TEXT NOT NULL,
                    title VARCHAR NOT NULL,
                    description TEXT,
                    status VARCHAR NOT NULL,
                    priority VARCHAR NOT NULL,
                    owner_id TEXT NOT NULL,
                    assignee_id TEXT,
                    team_size INTEGER,
                    start_date DATETIME,
                    due_date DATETIME,
                    completed_at DATETIME,
                    category VARCHAR,
                    impact_points INTEGER,
                    budget VARCHAR,
                    location VARCHAR,
                    success_metrics JSON,
                    deliverables JSON,
                    dependencies JSON,
                    required_skills JSON,
                    definition_of_done JSON,
                    created_at DATETIME DEFAULT (CURRENT_TIMESTAMP),
                    updated_at DATETIME DEFAULT (CURRENT_TIMESTAMP),
                    PRIMARY KEY (id),
                    FOREIGN KEY(assignee_id) REFERENCES users (id),
                    FOREIGN KEY(owner_id) REFERENCES users (id)
                )
            """))
            print("Created projects table")
        
        # Check if project_id column exists in tasks table
        result = await conn.execute(text("PRAGMA table_info(tasks)"))
        columns = [row[1] for row in result.fetchall()]
        
        if 'project_id' not in columns:
            # Add project_id column to tasks table
            await conn.execute(text("""
                ALTER TABLE tasks ADD COLUMN project_id TEXT
            """))
            print("Added project_id column to tasks table")
        else:
            print("project_id column already exists in tasks table")

if __name__ == "__main__":
    asyncio.run(create_projects_table())
    print("Database setup complete")