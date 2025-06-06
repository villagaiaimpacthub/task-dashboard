#!/usr/bin/env python3
"""Populate database with rich sample data matching the original template vision."""

import asyncio
import sys
from pathlib import Path

# Add the project root to the path
sys.path.append(str(Path(__file__).parent.parent))

from app.database import async_session
from app.models.user import User
from app.models.task import Task
from sqlalchemy import select


async def create_sample_data():
    """Create users and tasks with rich data from the original template."""
    
    async with async_session() as db:
        # Create sample users with diverse roles and skills
        users_data = [
            {
                'email': 'alice@hive.com',
                'password': 'password123',
                'role': 'Ecosystem Designer',
                'skills': ['Systems Design', 'Permaculture', 'Community Building'],
                'impact_score': 2847,
                'status': 'available'
            },
            {
                'email': 'ana@hive.com', 
                'password': 'password123',
                'role': 'Ecosystem Designer',
                'skills': ['Permaculture', 'Data Analysis', 'Research'],
                'impact_score': 1456,
                'status': 'available'
            },
            {
                'email': 'david@hive.com',
                'password': 'password123', 
                'role': 'Data Analyst',
                'skills': ['Data Analysis', 'Systems Design', 'Research'],
                'impact_score': 987,
                'status': 'busy'
            },
            {
                'email': 'luna@hive.com',
                'password': 'password123',
                'role': 'Community Coordinator', 
                'skills': ['Community Building', 'Project Management', 'Education'],
                'impact_score': 2134,
                'status': 'available'
            }
        ]
        
        users = []
        for user_data in users_data:
            # Check if user exists
            result = await db.execute(select(User).where(User.email == user_data['email']))
            user = result.scalar_one_or_none()
            
            if not user:
                user = User(
                    email=user_data['email'],
                    role=user_data['role'],
                    skills=user_data['skills'],
                    impact_score=user_data['impact_score'],
                    status=user_data['status'],
                    is_online=user_data['status'] == 'available'
                )
                user.set_password(user_data['password'])
                db.add(user)
                users.append(user)
                print(f'Created user: {user_data["email"]} ({user_data["role"]})')
            else:
                users.append(user)
                print(f'User exists: {user_data["email"]}')
        
        await db.commit()
        
        # Refresh to get IDs
        for user in users:
            await db.refresh(user)
        
        # Create rich sample tasks matching the original template
        tasks_data = [
            {
                'title': 'Coordinate Seed Exchange Network',
                'description': 'Link 47 heritage seed collectors across 3 bioregions to prevent genetic erosion and increase crop resilience.',
                'priority': 'urgent',
                'category': 'Regenerative Ag',
                'impact_points': 150,
                'estimated_hours': '2-4 hours',
                'location': 'North America',
                'team_size': '3 collaborators',
                'due_date': 'Today',
                'required_skills': ['Community Building', 'Systems Design'],
                'status': 'available'
            },
            {
                'title': 'Solar Microgrid Design',
                'description': 'Design distributed energy system for rural community of 250 households in partnership with local cooperative.',
                'priority': 'high',
                'category': 'Clean Energy',
                'impact_points': 320,
                'estimated_hours': '6-8 hours',
                'location': 'Guatemala',
                'team_size': '5 collaborators',
                'due_date': '3 days',
                'required_skills': ['Engineering', 'Project Management'],
                'status': 'available'
            },
            {
                'title': 'Marine Plastic Cleanup Protocol',
                'description': 'Develop standardized cleanup methodology that 12 coastal communities can implement simultaneously.',
                'priority': 'medium',
                'category': 'Ocean Health',
                'impact_points': 240,
                'estimated_hours': '4-6 hours',
                'location': 'Global',
                'team_size': '8 collaborators',
                'due_date': '1 week',
                'required_skills': ['Environmental Science', 'Community Building'],
                'status': 'in_progress'
            },
            {
                'title': 'Waste-to-Resource Network',
                'description': 'Map material flows between 23 manufacturers to create closed-loop production cycles eliminating waste.',
                'priority': 'high',
                'category': 'Circular Economy',
                'impact_points': 450,
                'estimated_hours': '8-12 hours',
                'location': 'Europe',
                'team_size': '6 collaborators',
                'due_date': '5 days',
                'required_skills': ['Data Analysis', 'Systems Design'],
                'status': 'available'
            },
            {
                'title': 'Mycorrhizal Network Study',
                'description': 'Document fungal network patterns across restored forest sites to optimize future reforestation efforts.',
                'priority': 'medium',
                'category': 'Restoration',
                'impact_points': 180,
                'estimated_hours': '12-16 hours',
                'location': 'Pacific Northwest',
                'team_size': '4 collaborators',
                'due_date': '2 weeks',
                'required_skills': ['Research', 'Ecology'],
                'status': 'completed'
            },
            {
                'title': 'Bioregional Skill Mapping',
                'description': 'Create visual map of expertise across local watershed to identify collaboration opportunities and knowledge gaps.',
                'priority': 'low',
                'category': 'Community',
                'impact_points': 90,
                'estimated_hours': '3-5 hours',
                'location': 'Your Bioregion',
                'team_size': '12 collaborators',
                'due_date': '3 weeks',
                'required_skills': ['Community Building', 'Data Visualization'],
                'status': 'available'
            },
            {
                'title': 'Carbon Sequestration Monitoring',
                'description': 'Deploy sensor network across 15 regenerative farms to track soil carbon accumulation rates.',
                'priority': 'high',
                'category': 'Regenerative Ag',
                'impact_points': 280,
                'estimated_hours': '6-10 hours',
                'location': 'Midwest USA',
                'team_size': '7 collaborators',
                'due_date': '4 days',
                'required_skills': ['Data Analysis', 'Environmental Science'],
                'status': 'available'
            },
            {
                'title': 'Wind Farm Community Design',
                'description': 'Facilitate community ownership model for 50MW wind installation serving 3 rural towns.',
                'priority': 'medium',
                'category': 'Clean Energy',
                'impact_points': 380,
                'estimated_hours': '10-15 hours',
                'location': 'Denmark',
                'team_size': '9 collaborators',
                'due_date': '10 days',
                'required_skills': ['Engineering', 'Community Building'],
                'status': 'available'
            },
            {
                'title': 'Coral Reef Restoration',
                'description': 'Coordinate volunteers for large-scale coral transplantation across 5 reef sites.',
                'priority': 'urgent',
                'category': 'Ocean Health',
                'impact_points': 420,
                'estimated_hours': '20-30 hours',
                'location': 'Great Barrier Reef',
                'team_size': '15 collaborators',
                'due_date': 'Tomorrow',
                'required_skills': ['Marine Biology', 'Project Management'],
                'status': 'available'
            },
            {
                'title': 'Composting Network Expansion',
                'description': 'Connect urban food waste streams with rural composting operations across metropolitan area.',
                'priority': 'low',
                'category': 'Circular Economy',
                'impact_points': 120,
                'estimated_hours': '5-8 hours',
                'location': 'San Francisco Bay',
                'team_size': '6 collaborators',
                'due_date': '1 month',
                'required_skills': ['Community Building', 'Systems Design'],
                'status': 'draft'
            }
        ]
        
        for i, task_data in enumerate(tasks_data):
            # Check if task exists
            result = await db.execute(select(Task).where(Task.title == task_data['title']))
            task = result.scalar_one_or_none()
            
            if not task:
                owner = users[i % len(users)]
                task = Task(
                    title=task_data['title'],
                    description=task_data['description'],
                    priority=task_data['priority'],
                    category=task_data['category'],
                    impact_points=task_data['impact_points'],
                    estimated_hours=task_data['estimated_hours'],
                    location=task_data['location'],
                    team_size=task_data['team_size'],
                    due_date=task_data['due_date'],
                    required_skills=task_data['required_skills'],
                    status=task_data['status'],
                    owner_id=owner.id
                )
                
                # Assign some tasks
                if task_data['status'] == 'in_progress' and len(users) > 1:
                    task.assignee_id = users[(i + 1) % len(users)].id
                elif task_data['status'] == 'completed' and len(users) > 2:
                    task.assignee_id = users[(i + 2) % len(users)].id
                
                db.add(task)
                print(f'Created task: {task_data["title"]} ({task_data["priority"]}, {task_data["category"]})')
            else:
                print(f'Task exists: {task_data["title"]}')
        
        await db.commit()
        print('\n✅ Sample data creation complete!')
        print(f'Created {len(users_data)} users and {len(tasks_data)} tasks')
        print('\nYou can now login with:')
        for user_data in users_data:
            print(f'  📧 {user_data["email"]} / 🔑 password123 ({user_data["role"]})')


if __name__ == "__main__":
    asyncio.run(create_sample_data())