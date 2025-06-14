#!/usr/bin/env python3
"""Script to create sample projects for testing"""

import asyncio
import sys
import os
from datetime import datetime, timedelta

# Add the project root to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import async_session
from app.models.project import Project
from app.models.user import User
from sqlalchemy import select

async def create_sample_projects():
    """Create sample projects for testing"""
    async with async_session() as db:
        # Get a user to be the owner
        result = await db.execute(select(User).limit(1))
        user = result.scalar_one_or_none()
        
        if not user:
            print("No users found. Please create a user first.")
            return
        
        print(f"Creating projects for user: {user.email}")
        
        # Sample projects
        projects_data = [
            {
                "title": "Ocean Cleanup Initiative",
                "description": "Large-scale ocean cleanup project focusing on plastic waste removal and marine ecosystem restoration",
                "status": "active",
                "priority": "high",
                "category": "Ocean Health",
                "impact_points": 500,
                "budget": "$2.5M",
                "location": "Pacific Ocean",
                "team_size": 15,
                "start_date": datetime.now(),
                "due_date": datetime.now() + timedelta(days=180),
                "required_skills": ["Marine Biology", "Project Management", "Data Analysis", "Environmental Science"],
                "deliverables": ["Waste Collection Report", "Ecosystem Impact Assessment", "Technology Deployment"],
                "success_metrics": ["10 tons plastic removed", "50% marine life recovery", "Technology scalability proven"]
            },
            {
                "title": "Regenerative Farm Network",
                "description": "Building a network of regenerative farms to restore soil health and increase carbon sequestration",
                "status": "planning",
                "priority": "medium",
                "category": "Regenerative Ag",
                "impact_points": 300,
                "budget": "$1.2M",
                "location": "Midwest USA",
                "team_size": 8,
                "start_date": datetime.now() + timedelta(days=30),
                "due_date": datetime.now() + timedelta(days=365),
                "required_skills": ["Sustainable Agriculture", "Community Outreach", "Business Development"],
                "deliverables": ["Network Establishment", "Training Programs", "Impact Metrics"],
                "success_metrics": ["25 farms converted", "30% soil carbon increase", "Community engagement"]
            },
            {
                "title": "Clean Energy Microgrid",
                "description": "Developing renewable energy microgrids for rural communities in developing countries",
                "status": "active",
                "priority": "urgent",
                "category": "Clean Energy",
                "impact_points": 750,
                "budget": "$5M",
                "location": "Sub-Saharan Africa",
                "team_size": 20,
                "start_date": datetime.now() - timedelta(days=30),
                "due_date": datetime.now() + timedelta(days=270),
                "required_skills": ["Electrical Engineering", "Solar Technology", "Community Development"],
                "deliverables": ["Microgrid Installation", "Training Materials", "Maintenance Framework"],
                "success_metrics": ["1000 households powered", "80% uptime", "Local technician training"]
            },
            {
                "title": "Circular Economy Marketplace",
                "description": "Creating a digital platform to facilitate circular economy practices in urban areas",
                "status": "planning",
                "priority": "medium",
                "category": "Circular Economy",
                "impact_points": 400,
                "budget": "$800K",
                "location": "Global",
                "team_size": 12,
                "start_date": datetime.now() + timedelta(days=60),
                "due_date": datetime.now() + timedelta(days=300),
                "required_skills": ["Software Development", "UX Design", "Supply Chain", "Marketing"],
                "deliverables": ["Platform Launch", "User Onboarding", "Partnership Network"],
                "success_metrics": ["10K active users", "1M tons waste diverted", "500 businesses"]
            },
            {
                "title": "Forest Restoration Program",
                "description": "Large-scale reforestation and ecosystem restoration in degraded landscapes",
                "status": "completed",
                "priority": "high",
                "category": "Restoration",
                "impact_points": 600,
                "budget": "$3M",
                "location": "Amazon Basin",
                "team_size": 25,
                "start_date": datetime.now() - timedelta(days=540),
                "due_date": datetime.now() - timedelta(days=180),
                "completed_at": datetime.now() - timedelta(days=180),
                "required_skills": ["Forestry", "Ecology", "GIS Mapping", "Community Relations"],
                "deliverables": ["10,000 hectares restored", "Species monitoring", "Community training"],
                "success_metrics": ["95% tree survival", "Wildlife return", "Carbon sequestration"]
            }
        ]
        
        for project_data in projects_data:
            project = Project(
                **project_data,
                owner_id=user.id
            )
            db.add(project)
        
        await db.commit()
        print(f"Created {len(projects_data)} sample projects")

if __name__ == "__main__":
    asyncio.run(create_sample_projects())
    print("Sample projects created successfully!")