#!/usr/bin/env python3
"""
Simple backend server for HIVE Task Dashboard
Uses only Python standard library for basic functionality

Now includes API Contract validation for data consistency
"""

import json
import http.server
import socketserver
import urllib.parse
from http import HTTPStatus
import threading
import time
from datetime import datetime
import os
import base64
import mimetypes

# Import contract validation (if available)
try:
    from api_contract import validate_simple_backend_request
    CONTRACT_VALIDATION_ENABLED = True
    print("✅ API Contract validation enabled")
except ImportError:
    CONTRACT_VALIDATION_ENABLED = False
    print("⚠️ API Contract validation not available (install pydantic for full validation)")

# Simple in-memory storage

# TaskMaster Enhanced Data Structures
# Protocol Development - Enhanced model matching Notion structure
protocols = [
    {
        "id": "protocol-1",
        "name": "VOX",
        "status": "In Progress", 
        "current_version": "0.3",
        "next_release": "",
        "steward_id": "user-1",
        "steward_name": "Alex Chen",
        "purpose": "Conversational knowledge retrieval system",
        "description": "Voice-enabled blockchain interaction protocol for seamless conversational knowledge access",
        "hive_clients": [
            {
                "name": "World of Wisdom Podcast",
                "url": "https://www.notion.so/World-of-Wisdom-Podcast-20d91ddc1d268071a612cf501a7f4360?pvs=21",
                "status": "active"
            },
            {
                "name": "Metaluck 0.2", 
                "url": "https://www.notion.so/Metaluck-0-2-20d91ddc1d268035a6caf4e8a808ff92?pvs=21",
                "status": "active"
            },
            {
                "name": "Coherence AI",
                "url": "https://www.notion.so/Coherence-AI-20d91ddc1d26802999b8f2c686d7af03?pvs=21", 
                "status": "active"
            }
        ],
        "health_score": "green",
        "development_priority": "high",
        "created_at": "2025-01-15T10:00:00Z",
        "updated_at": "2025-06-09T14:30:00Z"
    },
    {
        "id": "protocol-2",
        "name": "DB Expert", 
        "status": "In Progress",
        "current_version": "0.3",
        "next_release": "",
        "steward_id": "user-2",
        "steward_name": "Sarah Green",
        "purpose": "Smart database interaction and retrieval system",
        "description": "Intelligent database querying and context-aware data retrieval protocol",
        "hive_clients": [
            {
                "name": "Metaluck 0.2",
                "url": "https://www.notion.so/Metaluck-0-2-20d91ddc1d268035a6caf4e8a808ff92?pvs=21",
                "status": "active"
            },
            {
                "name": "VISCO",
                "url": "https://www.notion.so/VISCO-20d91ddc1d2680cab2bcf3b7108c41e9?pvs=21",
                "status": "active" 
            }
        ],
        "health_score": "yellow",
        "development_priority": "medium",
        "created_at": "2025-02-01T10:00:00Z",
        "updated_at": "2025-06-09T14:30:00Z"
    },
    {
        "id": "protocol-3",
        "name": "TaskMaster",
        "status": "In Progress", 
        "current_version": "0.1",
        "next_release": "0.2",
        "steward_id": "user-1",
        "steward_name": "Alex Chen",
        "purpose": "AI-assisted task assignment and optimization system",
        "description": "Intelligent task coordination with AI-powered assignment suggestions and workload optimization",
        "hive_clients": [],
        "health_score": "green",
        "development_priority": "high",
        "created_at": "2025-06-01T10:00:00Z",
        "updated_at": "2025-06-09T14:30:00Z"
    },
    {
        "id": "protocol-4", 
        "name": "Business Intelligence (BI)",
        "status": "Not Started",
        "current_version": "",
        "next_release": "0.1",
        "steward_id": "",
        "steward_name": "",
        "purpose": "Cross-document context awareness and analytics system",
        "description": "Advanced analytics and cross-platform intelligence for organizational decision-making",
        "hive_clients": [],
        "health_score": "red",
        "development_priority": "low",
        "created_at": "2025-06-09T10:00:00Z",
        "updated_at": "2025-06-09T14:30:00Z"
    },
    {
        "id": "protocol-5",
        "name": "HIVE",
        "status": "Production",
        "current_version": "2.1.4",
        "next_release": "2.2.0",
        "steward_id": "user-2",
        "steward_name": "Sarah Green",
        "purpose": "Collaborative task management and coordination protocol",
        "description": "Core task coordination platform with real-time collaboration and milestone tracking",
        "hive_clients": [
            {
                "name": "EcoVillage Network",
                "url": "https://ecovillage.org",
                "status": "implementation"
            }
        ],
        "health_score": "green",
        "development_priority": "medium",
        "created_at": "2024-12-01T10:00:00Z",
        "updated_at": "2025-06-09T14:30:00Z"
    }
]

# Client Projects - Enhanced model matching example structure
client_projects = [
    {
        "id": "project-1",
        "title": "Agree on next steps for WoW",
        "client_name": "World of Wisdom Podcast",
        "client_url": "https://www.notion.so/World-of-Wisdom-Podcast-20d91ddc1d268071a612cf501a7f4360",
        "status": "in_progress",
        "type": "Client Implementation", 
        "finish_date": "2025-06-11",
        "protocols": [
            {
                "name": "VOX",
                "url": "https://www.notion.so/VOX-20d91ddc1d268014b887db26ffca1e99"
            }
        ],
        "scope_skills_needed": [
            "Talk to Nils and Amit about next steps for WoW PodAI",
            "Determine which features to build out next",
            "Assess funding availability for the project", 
            "Define operational cost coverage strategy"
        ],
        "inputs_needed": [
            "VOX component overview",
            "Current feature priorities from stakeholders",
            "Budget and funding information"
        ],
        "definition_of_done": [
            {"id": 1, "text": "Clear agreements around next features", "completed": False},
            {"id": 2, "text": "Coverage of operational cost established", "completed": False},
            {"id": 3, "text": "Contract/terms clarified and documented", "completed": False}
        ],
        "output_usage": [
            "WoW PodAI development roadmap",
            "VOX / Meeting Assistant enhancement",
            "Coherence platform integration",
            "Koherent system updates",
            "Metaluck feature expansion"
        ],
        "revenue_potential": "high",
        "primary_contacts": ["nils@wow.com", "amit@wow.com"],
        "assigned_team": ["user-1", "user-2"],
        "created_at": "2025-06-09T10:00:00Z",
        "updated_at": "2025-06-09T14:30:00Z"
    },
    {
        "id": "project-2", 
        "title": "EcoVillage HIVE Implementation",
        "client_name": "EcoVillage Network",
        "client_url": "https://ecovillage.org",
        "status": "building",
        "type": "Platform Implementation",
        "finish_date": "2025-08-15",
        "protocols": [
            {
                "name": "HIVE", 
                "url": "https://www.notion.so/HIVE-protocol"
            }
        ],
        "scope_skills_needed": [
            "Deploy HIVE task coordination system",
            "Train community coordinators",
            "Integrate with existing permaculture planning tools",
            "Setup regenerative agriculture tracking"
        ],
        "inputs_needed": [
            "Community structure mapping",
            "Current coordination tools audit",
            "Training materials for coordinators"
        ],
        "definition_of_done": [
            {"id": 1, "text": "HIVE platform deployed and configured", "completed": True},
            {"id": 2, "text": "Team trained on coordination workflows", "completed": False},
            {"id": 3, "text": "Integration with permaculture tools complete", "completed": False},
            {"id": 4, "text": "Go-live testing completed successfully", "completed": False}
        ],
        "output_usage": [
            "Community task coordination",
            "Regenerative project management", 
            "Resource allocation optimization",
            "Impact measurement and reporting"
        ],
        "revenue_potential": "high",
        "primary_contacts": ["sarah@ecovillage.org"],
        "assigned_team": ["user-2"],
        "created_at": "2025-03-01T10:00:00Z",
        "updated_at": "2025-06-09T14:30:00Z"
    }
]

# Client Implementations - Protocol deployments at client sites
client_implementations = [
    {
        "id": "impl-1",
        "name": "World of Wisdom Podcast",
        "hive_protocols": [
            {
                "name": "VOX",
                "url": "https://www.notion.so/VOX-20d91ddc1d268014b887db26ffca1e99?pvs=21",
                "version_deployed": "0.3",
                "integration_status": "active"
            }
        ],
        "status": "Testing",
        "go_live_date": "",
        "primary_contact": "Nils von Heijne",
        "contact_email": "nils@worldofwisdom.com",
        "implementation_type": "voice_interface",
        "deployment_environment": "production",
        "technical_requirements": [
            "Voice recognition integration",
            "Knowledge retrieval API",
            "Podcast content indexing"
        ],
        "success_metrics": [
            "User engagement with voice queries",
            "Knowledge retrieval accuracy",
            "Response time < 2 seconds"
        ],
        "created_at": "2025-05-01T10:00:00Z",
        "updated_at": "2025-06-09T14:30:00Z"
    },
    {
        "id": "impl-2", 
        "name": "Metaluck 0.2",
        "hive_protocols": [
            {
                "name": "VOX",
                "url": "https://www.notion.so/VOX-20d91ddc1d268014b887db26ffca1e99?pvs=21",
                "version_deployed": "0.3",
                "integration_status": "active"
            },
            {
                "name": "DB Expert",
                "url": "https://www.notion.so/DB-Expert-20d91ddc1d26801ebc04ec5588e60f0e?pvs=21",
                "version_deployed": "0.3",
                "integration_status": "in_progress"
            }
        ],
        "status": "In Progress",
        "go_live_date": "",
        "primary_contact": "Marco Canzian",
        "contact_email": "marco@metaluck.com",
        "implementation_type": "multi_protocol",
        "deployment_environment": "staging",
        "technical_requirements": [
            "Database query optimization",
            "Voice command processing",
            "Multi-modal interaction support"
        ],
        "success_metrics": [
            "Query response accuracy > 95%",
            "Multi-protocol coordination efficiency",
            "User workflow completion rate"
        ],
        "created_at": "2025-04-15T10:00:00Z",
        "updated_at": "2025-06-09T14:30:00Z"
    },
    {
        "id": "impl-3",
        "name": "Coherence AI", 
        "hive_protocols": [
            {
                "name": "VOX",
                "url": "https://www.notion.so/VOX-20d91ddc1d268014b887db26ffca1e99?pvs=21",
                "version_deployed": "",
                "integration_status": "proposed"
            }
        ],
        "status": "Potential Client",
        "go_live_date": "",
        "primary_contact": "Bart Hoorweg",
        "contact_email": "bart@coherence.ai",
        "implementation_type": "ai_integration",
        "deployment_environment": "evaluation",
        "technical_requirements": [
            "AI model integration assessment",
            "Voice interface evaluation",
            "Coherence AI system compatibility"
        ],
        "success_metrics": [
            "Technical feasibility confirmation",
            "ROI projection validation",
            "Integration complexity assessment"
        ],
        "created_at": "2025-06-05T10:00:00Z",
        "updated_at": "2025-06-09T14:30:00Z"
    },
    {
        "id": "impl-4",
        "name": "VISCO",
        "hive_protocols": [
            {
                "name": "DB Expert",
                "url": "https://www.notion.so/DB-Expert-20d91ddc1d26801ebc04ec5588e60f0e?pvs=21",
                "version_deployed": "",
                "integration_status": "planning"
            }
        ],
        "status": "Project Kick-Off",
        "go_live_date": "",
        "primary_contact": "Andrew Peck",
        "contact_email": "andrew@visco.com",
        "implementation_type": "database_optimization",
        "deployment_environment": "development",
        "technical_requirements": [
            "Database schema analysis",
            "Query optimization setup",
            "Performance monitoring integration"
        ],
        "success_metrics": [
            "Query performance improvement > 50%",
            "Database efficiency metrics",
            "User experience enhancement"
        ],
        "created_at": "2025-06-01T10:00:00Z",
        "updated_at": "2025-06-09T14:30:00Z"
    }
]

# Legacy clients structure (kept for backward compatibility)
clients = [
    {
        "id": "client-1",
        "name": "EcoVillage Network",
        "implementation_status": "building",
        "go_live_date": "2025-08-15",
        "revenue_potential": "high",
        "primary_contact": "sarah@ecovillage.org",
        "protocols_used": ["HIVE"],
        "created_at": "2025-03-01T10:00:00Z",
        "updated_at": "2025-06-09T14:30:00Z"
    },
    {
        "id": "client-2",
        "name": "Conscious AI Collective", 
        "implementation_status": "scoping",
        "go_live_date": "2025-10-01",
        "revenue_potential": "medium",
        "primary_contact": "alex@conscious-ai.org",
        "protocols_used": ["VOX", "HIVE"],
        "created_at": "2025-04-15T10:00:00Z",
        "updated_at": "2025-06-09T14:30:00Z"
    }
]

okrs = [
    {
        "id": "okr-1",
        "objective": "Regenerative Systems - Building sustainable ecosystems",
        "key_results": [
            {"text": "Launch 3 permaculture protocols", "progress": 0.67},
            {"text": "Onboard 50+ regenerative projects", "progress": 0.34},
            {"text": "Achieve carbon negative operations", "progress": 0.89}
        ],
        "priority_weight": 0.85,
        "quarter": "2025-Q2",
        "status": "active",
        "created_at": "2025-04-01T10:00:00Z",
        "updated_at": "2025-06-09T14:30:00Z"
    },
    {
        "id": "okr-2",
        "objective": "Community Impact - Expanding positive influence",
        "key_results": [
            {"text": "Reach 10,000 active community members", "progress": 0.45},
            {"text": "Launch community governance protocol", "progress": 0.78},
            {"text": "Establish 20 local impact hubs", "progress": 0.12}
        ],
        "priority_weight": 0.75,
        "quarter": "2025-Q2", 
        "status": "active",
        "created_at": "2025-04-01T10:00:00Z",
        "updated_at": "2025-06-09T14:30:00Z"
    }
]

# User Management System for Admin
users_database = [
    {
        "id": "admin-1",
        "email": "admin@hive.com", 
        "role": "TaskMaster Admin",
        "permissions": ["view_protocols", "manage_protocols", "view_implementations", "manage_implementations", "view_projects", "manage_projects", "view_analytics", "manage_team", "view_baselines", "full_access"],
        "status": "active",
        "created_at": "2025-01-01T10:00:00Z",
        "last_login": "2025-06-09T14:30:00Z"
    },
    {
        "id": "steward-1",
        "email": "steward@hive.com",
        "role": "Protocol Steward", 
        "permissions": ["view_protocols", "manage_assigned_protocols", "view_implementations", "view_projects"],
        "status": "active",
        "created_at": "2025-02-01T10:00:00Z",
        "last_login": "2025-06-08T09:15:00Z"
    },
    {
        "id": "user-1",
        "email": "demo@hive.com",
        "role": "Ecosystem Designer",
        "permissions": ["view_tasks", "create_tasks", "view_own_work"],
        "status": "active", 
        "created_at": "2025-03-01T10:00:00Z",
        "last_login": "2025-06-09T12:00:00Z"
    },
    {
        "id": "user-2",
        "email": "contributor@hive.com",
        "role": "Community Member",
        "permissions": ["view_tasks", "create_tasks"],
        "status": "active",
        "created_at": "2025-04-01T10:00:00Z", 
        "last_login": "2025-06-07T16:45:00Z"
    }
]

# Role definitions with permission templates
role_templates = {
    "TaskMaster Admin": {
        "permissions": ["view_protocols", "manage_protocols", "view_implementations", "manage_implementations", "view_projects", "manage_projects", "view_analytics", "manage_team", "view_baselines", "full_access"],
        "description": "Full system access including user management"
    },
    "Protocol Steward": {
        "permissions": ["view_protocols", "manage_assigned_protocols", "view_implementations", "view_projects"],
        "description": "Manage assigned protocols and view client implementations"
    },
    "Network Manager": {
        "permissions": ["view_implementations", "manage_implementations", "view_projects", "manage_projects", "view_analytics"],
        "description": "Manage client implementations and projects"
    },
    "Ecosystem Designer": {
        "permissions": ["view_tasks", "create_tasks", "view_own_work", "view_projects"],
        "description": "Create and manage tasks, view project information"
    },
    "Community Member": {
        "permissions": ["view_tasks", "create_tasks"],
        "description": "Basic task access for community contributors"
    }
}

# Enhanced team members with capacity tracking
team_members = [
    {
        "id": "user-1",
        "name": "Alex Chen",
        "email": "alex@hive.example.com",
        "role": "Senior Developer",
        "skills": ["react", "vector-search", "ai", "optimization", "permaculture"],
        "skill_levels": {"react": 9, "vector-search": 7, "ai": 8, "optimization": 6, "permaculture": 5},
        "capacity_hours": 40,
        "current_workload": 32,
        "is_online": True,
        "impact_score": 1250,
        "availability": {
            "timezone": "UTC-7",
            "working_hours": {"start": "09:00", "end": "17:00"},
            "available_days": ["monday", "tuesday", "wednesday", "thursday", "friday"]
        },
        "created_at": "2025-01-15T10:00:00Z",
        "updated_at": "2025-06-09T14:30:00Z"
    },
    {
        "id": "user-2",
        "name": "Sarah Green",
        "email": "sarah@hive.example.com", 
        "role": "Product Manager",
        "skills": ["project-management", "community-building", "regenerative-ag", "systems-thinking"],
        "skill_levels": {"project-management": 9, "community-building": 8, "regenerative-ag": 7, "systems-thinking": 8},
        "capacity_hours": 40,
        "current_workload": 28,
        "is_online": True,
        "impact_score": 890,
        "availability": {
            "timezone": "UTC-5",
            "working_hours": {"start": "08:00", "end": "16:00"},
            "available_days": ["monday", "tuesday", "wednesday", "thursday", "friday"]
        },
        "created_at": "2025-02-01T10:00:00Z",
        "updated_at": "2025-06-09T14:30:00Z"
    }
]

# Baseline measurements for TaskMaster analytics
baselines = [
    {
        "id": "baseline-1",
        "metric_name": "assignment_decision_time_minutes",
        "baseline_value": 25,
        "current_value": 25,  # Will be updated as we implement features
        "measurement_date": "2025-06-09",
        "measurement_method": "manual_tracking",
        "notes": "Average time in sprint planning to assign tasks"
    },
    {
        "id": "baseline-2", 
        "metric_name": "sprint_completion_rate",
        "baseline_value": 0.73,
        "current_value": 0.73,
        "measurement_date": "2025-06-09", 
        "measurement_method": "notion_analysis",
        "notes": "Last 4 sprints average completion rate"
    },
    {
        "id": "baseline-3",
        "metric_name": "meeting_hours_per_week", 
        "baseline_value": 8.5,
        "current_value": 8.5,
        "measurement_date": "2025-06-09",
        "measurement_method": "calendar_analysis",
        "notes": "Coordination meetings only"
    }
]
tasks = [
    {
        "id": "1",
        "title": "Design Permaculture Garden",
        "description": "Create a comprehensive design for a 2-acre permaculture garden focusing on food forest principles",
        "status": "available",
        "priority": "high",
        "category": "Regenerative Ag",
        "impact_points": 150,
        "estimated_hours": "8-12 hours",
        "location": "North America",
        "team_size": "3-5",
        "due_date": "2 weeks",
        "required_skills": ["Permaculture Design", "Ecological Systems", "CAD"],
        # TaskMaster enhanced fields
        "type": "protocol_core",
        "protocol_id": "protocol-2",  # HIVE protocol
        "client_id": "client-1",     # EcoVillage Network
        "sprint_goal": "Establish regenerative agriculture foundations for Q2",
        "okr_alignment_score": 0.85,  # High alignment with Regenerative Systems OKR
        "estimated_hours_numeric": 10,  # For capacity calculations
        "definition_of_done": [
            {"id": 1, "text": "Site analysis completed with soil and water assessments", "completed": True},
            {"id": 2, "text": "Plant guild relationships mapped out", "completed": True}, 
            {"id": 3, "text": "CAD drawings finalized with measurements", "completed": False},
            {"id": 4, "text": "Cost estimate and timeline provided", "completed": False},
            {"id": 5, "text": "Sustainability impact assessment completed", "completed": False}
        ],
        "milestones": [
            {
                "id": "m1",
                "task_id": "1",
                "title": "Site Analysis & Research",
                "description": "Complete comprehensive site analysis including soil testing, water assessment, and microclimate evaluation",
                "dod_alignment": "High Alignment",
                "okr_alignment": "High Alignment", 
                "prime_directive_alignment": "High Alignment",
                "deadline": "2025-06-14",
                "acceptance_criteria": [
                    "Soil pH tested at 5+ locations across site",
                    "Water table depth and quality assessed",
                    "Existing vegetation cataloged with native species identified",
                    "Sun patterns mapped for all seasons",
                    "Slope and drainage patterns documented"
                ],
                "completed": True,
                "files": [
                    {"id": "f1", "name": "soil-analysis.pdf", "type": "application/pdf", "size": 234567},
                    {"id": "f2", "name": "site-photos.zip", "type": "application/zip", "size": 1234567}
                ],
                "help_requests": [],
                "created_at": "2025-06-07T10:00:00Z",
                "updated_at": "2025-06-09T14:30:00Z"
            },
            {
                "id": "m2", 
                "task_id": "1",
                "title": "Design Guild Relationships",
                "description": "Map out plant guild relationships that support biodiversity and natural ecosystem functions",
                "dod_alignment": "High Alignment",
                "okr_alignment": "Medium Alignment",
                "prime_directive_alignment": "High Alignment", 
                "deadline": "2025-06-18",
                "acceptance_criteria": [
                    "Primary guilds designed around fruit trees",
                    "Nitrogen-fixing plants integrated throughout",
                    "Beneficial insect habitat zones planned",
                    "Companion planting relationships documented",
                    "Succession planning for 10+ year timeline"
                ],
                "completed": True,
                "files": [
                    {"id": "f3", "name": "guild-map.pdf", "type": "application/pdf", "size": 445678}
                ],
                "help_requests": [],
                "created_at": "2025-06-07T10:00:00Z",
                "updated_at": "2025-06-09T16:45:00Z"
            },
            {
                "id": "m3",
                "task_id": "1", 
                "title": "CAD Design & Technical Documentation",
                "description": "Create detailed CAD drawings with precise measurements and technical specifications",
                "dod_alignment": "Medium Alignment",
                "okr_alignment": "High Alignment",
                "prime_directive_alignment": "Medium Alignment",
                "deadline": "2025-06-21",
                "acceptance_criteria": [
                    "Scale drawings completed at 1:100 and 1:500",
                    "All plantings positioned with GPS coordinates", 
                    "Infrastructure elements (paths, water, structures) detailed",
                    "Planting timeline and phases documented",
                    "Material quantities and sourcing specified"
                ],
                "completed": False,
                "files": [],
                "help_requests": [
                    {
                        "id": "hr1",
                        "requester_id": "user1",
                        "requester_name": "Alice",
                        "reason": "Need help with CAD software - looking for someone experienced with AutoCAD or similar for technical drawings",
                        "status": "open",
                        "urgency": "medium",
                        "created_at": "2025-06-09T09:30:00Z"
                    }
                ],
                "created_at": "2025-06-07T10:00:00Z",
                "updated_at": "2025-06-09T09:30:00Z"
            }
        ],
        "owner_id": "user1",
        "assignee_id": None,
        "created_at": "2025-06-07T10:00:00Z",
        "updated_at": "2025-06-07T10:00:00Z"
    },
    {
        "id": "2", 
        "title": "Solar Panel Efficiency Analysis",
        "description": "Analyze efficiency data from 50 solar installations to identify optimization opportunities",
        "status": "in_progress",
        "priority": "urgent",
        "category": "Clean Energy",
        "impact_points": 200,
        "estimated_hours": "4-6 hours",
        "location": "Global",
        "team_size": "2-3",
        "due_date": "3 days",
        "required_skills": ["Data Analysis", "Solar Technology", "Python"],
        "owner_id": "user2",
        "assignee_id": "user1",
        "created_at": "2025-06-06T14:30:00Z",
        "updated_at": "2025-06-07T09:15:00Z"
    },
    {
        "id": "3",
        "title": "Ocean Plastic Cleanup Strategy",
        "description": "Develop a community-based strategy for coastal plastic cleanup and prevention",
        "status": "available",
        "priority": "medium",
        "category": "Ocean Health",
        "impact_points": 120,
        "estimated_hours": "6-8 hours",
        "location": "Coastal Regions",
        "team_size": "4-6",
        "due_date": "1 week",
        "required_skills": ["Environmental Science", "Community Organizing", "Project Management"],
        "owner_id": "user3",
        "assignee_id": None,
        "created_at": "2025-06-05T16:45:00Z",
        "updated_at": "2025-06-05T16:45:00Z"
    }
]

users = [
    {
        "id": "user1",
        "email": "alice@example.com",
        "role": "Ecosystem Designer",
        "is_online": True,
        "impact_score": 350,
        "skills": ["Permaculture Design", "Data Analysis", "Python"]
    },
    {
        "id": "user2", 
        "email": "bob@example.com",
        "role": "Clean Energy Specialist",
        "is_online": True,
        "impact_score": 280,
        "skills": ["Solar Technology", "Data Analysis", "Project Management"]
    },
    {
        "id": "user3",
        "email": "carol@example.com", 
        "role": "Ocean Advocate",
        "is_online": False,
        "impact_score": 195,
        "skills": ["Environmental Science", "Community Organizing"]
    }
]

comments = []
chat_messages = []
file_uploads = {}  # {file_id: {name, content, type, size, task_id, uploaded_at}}
help_requests = {}  # {request_id: {id, milestone_id, task_id, requester_id, reason, status, created_at}}

# Create uploads directory if it doesn't exist
UPLOAD_DIR = "uploads"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

class CORSHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        parsed_url = urllib.parse.urlparse(self.path)
        path = parsed_url.path
        
        # API endpoints
        if path == '/health':
            self.send_json_response({"status": "healthy", "message": "HIVE Backend Simple"})
        elif path == '/api/v1/tasks/':
            self.send_json_response(tasks)
        elif path.startswith('/api/v1/tasks/') and path != '/api/v1/tasks/':
            # Get individual task
            task_id = path.split('/')[-1]
            task = next((t for t in tasks if t["id"] == task_id), None)
            if task:
                self.send_json_response(task)
            else:
                self.send_error(404, "Task not found")
        elif path == '/api/v1/dashboard/summary':
            summary = {
                "total_tasks": len(tasks),
                "available_tasks": len([t for t in tasks if t["status"] == "available"]),
                "in_progress_tasks": len([t for t in tasks if t["status"] == "in_progress"]),
                "completed_tasks": len([t for t in tasks if t["status"] == "completed"]),
                "total_users": len(users),
                "online_users": len([u for u in users if u["is_online"]]),
                "total_impact_points": sum(t["impact_points"] for t in tasks)
            }
            self.send_json_response(summary)
        elif path == '/api/v1/users/online':
            online_users = [u for u in users if u["is_online"]]
            self.send_json_response(online_users)
        elif path.startswith('/api/v1/dashboard/online-users'):
            # Get online users for dashboard
            query_components = urllib.parse.parse_qs(parsed_url.query)
            limit = int(query_components.get('limit', [20])[0])
            
            online_users = [u for u in users if u.get('is_online', False)][:limit]
            self.send_json_response(online_users)
        elif path.startswith('/api/v1/ws'):
            # WebSocket endpoint simulation (returns connection info)
            self.send_json_response({
                "status": "connected",
                "message": "WebSocket simulation - real-time features active",
                "timestamp": datetime.now().isoformat() + "Z"
            })
        elif path == '/api/v1/users/me':
            # Return current user info (simplified auth)
            current_user = {
                "id": "user1",
                "email": "alice@example.com",
                "role": "Ecosystem Designer",
                "is_active": True,
                "is_online": True,
                "impact_score": 350,
                "skills": ["Permaculture Design", "Data Analysis", "Python"],
                "status": "available"
            }
            self.send_json_response(current_user)
        elif path.startswith('/api/v1/comments/task/'):
            task_id = path.split('/')[-1]
            task_comments = [c for c in comments if c.get("task_id") == task_id]
            self.send_json_response(task_comments)
        elif path.startswith('/api/v1/chat/task/') and path.endswith('/messages'):
            task_id = path.split('/')[-2]
            task_chat = [m for m in chat_messages if m.get("task_id") == task_id]
            self.send_json_response(task_chat)
        elif path.startswith('/api/v1/files/task/'):
            # List files for a specific task
            task_id = path.split('/')[-1]
            task_files = [
                {
                    "id": file_id,
                    "name": file_data["name"],
                    "size": file_data["size"],
                    "type": file_data["type"],
                    "uploaded_at": file_data["uploaded_at"]
                }
                for file_id, file_data in file_uploads.items()
                if file_data.get("task_id") == task_id
            ]
            self.send_json_response(task_files)
        elif path.startswith('/api/v1/files/download/'):
            # Download a specific file
            file_id = path.split('/')[-1]
            if file_id in file_uploads:
                file_data = file_uploads[file_id]
                self.send_response(200)
                self.send_header('Content-Type', file_data["type"])
                self.send_header('Content-Disposition', f'attachment; filename="{file_data["name"]}"')
                self.end_headers()
                self.wfile.write(base64.b64decode(file_data["content"]))
            else:
                self.send_error(404, "File not found")
        # TaskMaster API endpoints
        elif path == '/api/v1/protocols':
            self.send_json_response(protocols)
        elif path == '/api/v1/clients':
            self.send_json_response(clients)
        elif path == '/api/v1/client-projects':
            self.send_json_response(client_projects)
        elif path == '/api/v1/client-implementations':
            self.send_json_response(client_implementations)
        elif path == '/api/v1/okrs':
            self.send_json_response(okrs)
        elif path == '/api/v1/team-members':
            self.send_json_response(team_members)
        elif path == '/api/v1/baselines':
            self.send_json_response(baselines)
        elif path == '/api/v1/team-capacity/summary':
            # Get team capacity summary (GET version)
            capacity_summary = {
                "total_members": len(team_members),
                "total_capacity": sum(m["capacity_hours"] for m in team_members),
                "total_workload": sum(m["current_workload"] for m in team_members),
                "average_utilization": 0,
                "overloaded_members": [],
                "underutilized_members": []
            }
            
            if capacity_summary["total_capacity"] > 0:
                capacity_summary["average_utilization"] = round(
                    (capacity_summary["total_workload"] / capacity_summary["total_capacity"]) * 100, 1
                )
            
            # Find overloaded (>90%) and underutilized (<60%) members
            for member in team_members:
                utilization = (member["current_workload"] / member["capacity_hours"]) * 100 if member["capacity_hours"] > 0 else 0
                if utilization > 90:
                    capacity_summary["overloaded_members"].append({
                        "id": member["id"],
                        "name": member["name"],
                        "utilization": round(utilization, 1)
                    })
                elif utilization < 60:
                    capacity_summary["underutilized_members"].append({
                        "id": member["id"],
                        "name": member["name"],
                        "utilization": round(utilization, 1)
                    })
            
            self.send_json_response(capacity_summary)
        elif path.startswith('/api/v1/tasks/') and path.endswith('/suggest-assignment'):
            # AI assignment suggestion
            task_id = path.split('/')[4]
            task = next((t for t in tasks if t["id"] == task_id), None)
            if not task:
                self.send_error(404, "Task not found")
                return
                
            suggestions = []
            task_skills = task.get("required_skills", [])
            task_hours = task.get("estimated_hours_numeric", 0)
            
            for member in team_members:
                # Calculate skill match score
                member_skills = member.get("skills", [])
                matching_skills = set(task_skills) & set(member_skills)
                skill_score = len(matching_skills) / len(task_skills) if task_skills else 0
                
                # Calculate workload factor (prefer less loaded members)
                current_utilization = (member["current_workload"] / member["capacity_hours"]) * 100 if member["capacity_hours"] > 0 else 100
                workload_factor = max(0, (100 - current_utilization) / 100)
                
                # Calculate skill level factor
                skill_level_factor = 0
                if matching_skills:
                    skill_levels = member.get("skill_levels", {})
                    avg_skill_level = sum(skill_levels.get(skill, 5) for skill in matching_skills) / len(matching_skills)
                    skill_level_factor = avg_skill_level / 10  # Normalize to 0-1
                
                # Overall score
                overall_score = (skill_score * 0.5) + (workload_factor * 0.3) + (skill_level_factor * 0.2)
                
                # Check if member can take on more work
                can_take_work = (member["current_workload"] + task_hours) <= (member["capacity_hours"] * 1.1)  # Allow 10% overflow
                
                suggestions.append({
                    "member_id": member["id"],
                    "member_name": member["name"],
                    "score": round(overall_score, 3),
                    "skill_match": round(skill_score, 3),
                    "workload_factor": round(workload_factor, 3),
                    "skill_level_factor": round(skill_level_factor, 3),
                    "current_utilization": round(current_utilization, 1),
                    "matching_skills": list(matching_skills),
                    "can_take_work": can_take_work,
                    "reason": f"{'Strong' if skill_score > 0.6 else 'Moderate' if skill_score > 0.3 else 'Basic'} skill match, {'low' if current_utilization < 60 else 'moderate' if current_utilization < 90 else 'high'} workload"
                })
            
            # Sort by score, filter available members
            suggestions = [s for s in suggestions if s["can_take_work"]]
            suggestions.sort(key=lambda x: x["score"], reverse=True)
            
            self.send_json_response({
                "task_id": task_id,
                "task_title": task["title"],
                "required_skills": task_skills,
                "suggestions": suggestions[:5]  # Top 5 suggestions
            })
        elif path.startswith('/api/v1/tasks/') and path.endswith('/calculate-okr-alignment'):
            # Calculate OKR alignment score for a task
            task_id = path.split('/')[4]
            task = next((t for t in tasks if t["id"] == task_id), None)
            if not task:
                self.send_error(404, "Task not found")
                return
            
            alignment_results = []
            task_keywords = (task.get("title", "") + " " + task.get("description", "")).lower()
            
            for okr in okrs:
                # Check objective alignment
                objective_keywords = okr["objective"].lower()
                objective_score = 0
                
                # Simple keyword matching for objective alignment
                common_words = ["sustainable", "regenerative", "community", "impact", "ecosystem", "protocol", "innovation"]
                for word in common_words:
                    if word in task_keywords and word in objective_keywords:
                        objective_score += 0.2
                
                # Check key results alignment
                kr_scores = []
                for kr in okr["key_results"]:
                    kr_text = kr["text"].lower()
                    kr_score = 0
                    
                    # Protocol-related tasks align with protocol KRs
                    if task.get("type") == "protocol_core" and "protocol" in kr_text:
                        kr_score += 0.4
                    
                    # Client-related tasks align with client/community KRs
                    if task.get("type") == "client_project" and ("client" in kr_text or "community" in kr_text):
                        kr_score += 0.4
                    
                    # Category-based alignment
                    task_category = task.get("category", "").lower()
                    if task_category in kr_text:
                        kr_score += 0.3
                    
                    kr_scores.append(min(kr_score, 1.0))
                
                # Calculate overall alignment score
                avg_kr_score = sum(kr_scores) / len(kr_scores) if kr_scores else 0
                overall_score = (objective_score * 0.3) + (avg_kr_score * 0.7)
                overall_score = min(overall_score, 1.0)
                
                alignment_results.append({
                    "okr_id": okr["id"],
                    "objective": okr["objective"],
                    "alignment_score": round(overall_score, 3),
                    "objective_score": round(objective_score, 3),
                    "key_results_score": round(avg_kr_score, 3),
                    "priority_weight": okr["priority_weight"]
                })
            
            # Sort by alignment score
            alignment_results.sort(key=lambda x: x["alignment_score"], reverse=True)
            
            # Update task with best alignment score
            if alignment_results:
                best_alignment = alignment_results[0]["alignment_score"]
                task["okr_alignment_score"] = best_alignment
                task["updated_at"] = datetime.now().isoformat() + "Z"
            
            self.send_json_response({
                "task_id": task_id,
                "task_title": task["title"],
                "alignments": alignment_results,
                "recommended_okr": alignment_results[0] if alignment_results else None
            })
        elif path == '/api/v1/tasks/bulk-calculate-okr-alignment':
            # Calculate OKR alignment for all tasks
            updated_tasks = []
            
            for task in tasks:
                task_keywords = (task.get("title", "") + " " + task.get("description", "")).lower()
                best_score = 0
                
                for okr in okrs:
                    objective_keywords = okr["objective"].lower()
                    objective_score = 0
                    
                    # Simple keyword matching
                    common_words = ["sustainable", "regenerative", "community", "impact", "ecosystem", "protocol", "innovation"]
                    for word in common_words:
                        if word in task_keywords and word in objective_keywords:
                            objective_score += 0.2
                    
                    # Key results alignment
                    kr_scores = []
                    for kr in okr["key_results"]:
                        kr_text = kr["text"].lower()
                        kr_score = 0
                        
                        if task.get("type") == "protocol_core" and "protocol" in kr_text:
                            kr_score += 0.4
                        if task.get("type") == "client_project" and ("client" in kr_text or "community" in kr_text):
                            kr_score += 0.4
                        
                        task_category = task.get("category", "").lower()
                        if task_category in kr_text:
                            kr_score += 0.3
                        
                        kr_scores.append(min(kr_score, 1.0))
                    
                    avg_kr_score = sum(kr_scores) / len(kr_scores) if kr_scores else 0
                    overall_score = (objective_score * 0.3) + (avg_kr_score * 0.7)
                    overall_score = min(overall_score, 1.0)
                    
                    if overall_score > best_score:
                        best_score = overall_score
                
                # Update task
                task["okr_alignment_score"] = round(best_score, 3)
                task["updated_at"] = datetime.now().isoformat() + "Z"
                updated_tasks.append({
                    "id": task["id"],
                    "title": task["title"],
                    "alignment_score": task["okr_alignment_score"]
                })
            
            self.send_json_response({
                "message": "OKR alignment calculated for all tasks",
                "updated_tasks": updated_tasks
            })
        elif path == '/api/v1/sprint-planning/analyze':
            # Analyze current task distribution for sprint planning
            protocol_tasks = [t for t in tasks if t.get("type") == "protocol_core"]
            client_tasks = [t for t in tasks if t.get("type") == "client_project"]
            infrastructure_tasks = [t for t in tasks if t.get("type") == "infrastructure"]
            
            total_tasks = len(tasks)
            protocol_hours = sum(t.get("estimated_hours_numeric", 0) for t in protocol_tasks)
            client_hours = sum(t.get("estimated_hours_numeric", 0) for t in client_tasks)
            infrastructure_hours = sum(t.get("estimated_hours_numeric", 0) for t in infrastructure_tasks)
            total_hours = protocol_hours + client_hours + infrastructure_hours
            
            current_distribution = {
                "protocols": {
                    "count": len(protocol_tasks),
                    "hours": protocol_hours,
                    "percentage": round((protocol_hours / total_hours * 100), 1) if total_hours > 0 else 0
                },
                "clients": {
                    "count": len(client_tasks),
                    "hours": client_hours,
                    "percentage": round((client_hours / total_hours * 100), 1) if total_hours > 0 else 0
                },
                "infrastructure": {
                    "count": len(infrastructure_tasks),
                    "hours": infrastructure_hours,
                    "percentage": round((infrastructure_hours / total_hours * 100), 1) if total_hours > 0 else 0
                }
            }
            
            target_distribution = {
                "protocols": {"target": 60, "variance": current_distribution["protocols"]["percentage"] - 60},
                "clients": {"target": 30, "variance": current_distribution["clients"]["percentage"] - 30},
                "infrastructure": {"target": 10, "variance": current_distribution["infrastructure"]["percentage"] - 10}
            }
            
            recommendations = []
            if abs(target_distribution["protocols"]["variance"]) > 5:
                action = "increase" if target_distribution["protocols"]["variance"] < 0 else "decrease"
                recommendations.append(f"Need to {action} protocol work by {abs(target_distribution['protocols']['variance']):.1f}%")
            
            if abs(target_distribution["clients"]["variance"]) > 5:
                action = "increase" if target_distribution["clients"]["variance"] < 0 else "decrease"
                recommendations.append(f"Need to {action} client work by {abs(target_distribution['clients']['variance']):.1f}%")
            
            if abs(target_distribution["infrastructure"]["variance"]) > 5:
                action = "increase" if target_distribution["infrastructure"]["variance"] < 0 else "decrease"
                recommendations.append(f"Need to {action} infrastructure work by {abs(target_distribution['infrastructure']['variance']):.1f}%")
            
            self.send_json_response({
                "current_distribution": current_distribution,
                "target_distribution": target_distribution,
                "recommendations": recommendations,
                "total_hours": total_hours,
                "is_balanced": all(abs(v["variance"]) <= 5 for v in target_distribution.values())
            })
        elif path == '/api/v1/sprint-planning/suggest':
            # Suggest tasks for next sprint based on 60/30/10 distribution
            target_sprint_hours = 80  # Default sprint capacity
            
            # Calculate target hours for each category
            target_protocol_hours = target_sprint_hours * 0.6
            target_client_hours = target_sprint_hours * 0.3
            target_infrastructure_hours = target_sprint_hours * 0.1
            
            # Get available tasks sorted by OKR alignment
            available_protocol_tasks = sorted(
                [t for t in tasks if t.get("status") == "available" and t.get("type") == "protocol_core"],
                key=lambda x: x.get("okr_alignment_score", 0), reverse=True
            )
            available_client_tasks = sorted(
                [t for t in tasks if t.get("status") == "available" and t.get("type") == "client_project"],
                key=lambda x: x.get("okr_alignment_score", 0), reverse=True
            )
            available_infrastructure_tasks = sorted(
                [t for t in tasks if t.get("status") == "available" and t.get("type") == "infrastructure"],
                key=lambda x: x.get("okr_alignment_score", 0), reverse=True
            )
            
            # Select tasks to meet targets
            selected_tasks = {"protocols": [], "clients": [], "infrastructure": []}
            
            # Protocol tasks (60%)
            protocol_hours = 0
            for task in available_protocol_tasks:
                task_hours = task.get("estimated_hours_numeric", 0)
                if protocol_hours + task_hours <= target_protocol_hours:
                    selected_tasks["protocols"].append(task)
                    protocol_hours += task_hours
            
            # Client tasks (30%)
            client_hours = 0
            for task in available_client_tasks:
                task_hours = task.get("estimated_hours_numeric", 0)
                if client_hours + task_hours <= target_client_hours:
                    selected_tasks["clients"].append(task)
                    client_hours += task_hours
            
            # Infrastructure tasks (10%)
            infrastructure_hours = 0
            for task in available_infrastructure_tasks:
                task_hours = task.get("estimated_hours_numeric", 0)
                if infrastructure_hours + task_hours <= target_infrastructure_hours:
                    selected_tasks["infrastructure"].append(task)
                    infrastructure_hours += task_hours
            
            total_selected_hours = protocol_hours + client_hours + infrastructure_hours
            
            self.send_json_response({
                "sprint_capacity": target_sprint_hours,
                "selected_tasks": selected_tasks,
                "hours_breakdown": {
                    "protocols": protocol_hours,
                    "clients": client_hours,
                    "infrastructure": infrastructure_hours,
                    "total": total_selected_hours
                },
                "percentage_breakdown": {
                    "protocols": round((protocol_hours / total_selected_hours * 100), 1) if total_selected_hours > 0 else 0,
                    "clients": round((client_hours / total_selected_hours * 100), 1) if total_selected_hours > 0 else 0,
                    "infrastructure": round((infrastructure_hours / total_selected_hours * 100), 1) if total_selected_hours > 0 else 0
                },
                "utilization": round((total_selected_hours / target_sprint_hours * 100), 1)
            })
        elif path == '/api/v1/baselines/compare':
            # Compare current metrics with baselines
            current_metrics = {
                "assignment_decision_time_minutes": 15,  # Simulated current value
                "sprint_completion_rate": 0.82,         # Simulated improvement
                "meeting_hours_per_week": 6.5           # Simulated reduction
            }
            
            comparisons = []
            for baseline in baselines:
                metric_name = baseline["metric_name"]
                baseline_value = baseline["baseline_value"]
                current_value = current_metrics.get(metric_name, baseline_value)
                
                # Calculate improvement
                if "rate" in metric_name:
                    # Higher is better for rates
                    improvement = ((current_value - baseline_value) / baseline_value) * 100
                else:
                    # Lower is better for time/hours
                    improvement = ((baseline_value - current_value) / baseline_value) * 100
                
                status = "improved" if improvement > 0 else "declined" if improvement < 0 else "unchanged"
                
                comparisons.append({
                    "metric_name": metric_name,
                    "baseline_value": baseline_value,
                    "current_value": current_value,
                    "improvement_percentage": round(improvement, 1),
                    "status": status,
                    "notes": baseline.get("notes", "")
                })
            
            # Overall assessment
            improvements = [c for c in comparisons if c["status"] == "improved"]
            declines = [c for c in comparisons if c["status"] == "declined"]
            
            self.send_json_response({
                "comparisons": comparisons,
                "summary": {
                    "total_metrics": len(comparisons),
                    "improved": len(improvements),
                    "declined": len(declines),
                    "unchanged": len(comparisons) - len(improvements) - len(declines),
                    "average_improvement": round(sum(c["improvement_percentage"] for c in comparisons) / len(comparisons), 1) if comparisons else 0
                },
                "measurement_date": datetime.now().isoformat() + "Z"
            })
        elif path.startswith('/api/v1/client-projects/') and '/tasks' in path:
            # Get tasks for a specific client project
            project_id = path.split('/')[4]
            project = next((p for p in client_projects if p["id"] == project_id), None)
            if not project:
                self.send_error(404, "Client project not found")
                return
            
            # Find tasks associated with this project
            project_tasks = [t for t in tasks if t.get("client_id") == project_id or 
                           (t.get("category", "").lower() in project["client_name"].lower())]
            
            self.send_json_response({
                "project": project,
                "tasks": project_tasks,
                "task_count": len(project_tasks),
                "completed_tasks": len([t for t in project_tasks if t["status"] == "completed"]),
                "progress_percentage": round(len([t for t in project_tasks if t["status"] == "completed"]) / len(project_tasks) * 100, 1) if project_tasks else 0
            })
        elif path.startswith('/api/v1/client-projects/') and path.endswith('/status'):
            # Update client project status
            project_id = path.split('/')[4]
            project = next((p for p in client_projects if p["id"] == project_id), None)
            if not project:
                self.send_error(404, "Client project not found")
                return
            
            # This would handle status updates in a real implementation
            self.send_json_response({
                "project_id": project_id,
                "current_status": project["status"],
                "message": "Status update endpoint ready for implementation"
            })
        elif path == '/api/v1/client-projects/summary':
            # Get summary of all client projects
            summary = {
                "total_projects": len(client_projects),
                "by_status": {},
                "by_type": {},
                "upcoming_deadlines": [],
                "protocol_usage": {}
            }
            
            # Count by status
            for project in client_projects:
                status = project["status"]
                summary["by_status"][status] = summary["by_status"].get(status, 0) + 1
                
                # Count by type
                project_type = project["type"]
                summary["by_type"][project_type] = summary["by_type"].get(project_type, 0) + 1
                
                # Check for upcoming deadlines (within 7 days)
                try:
                    finish_date = datetime.strptime(project["finish_date"], "%Y-%m-%d")
                    days_until = (finish_date - datetime.now()).days
                    if 0 <= days_until <= 7:
                        summary["upcoming_deadlines"].append({
                            "project_id": project["id"],
                            "title": project["title"],
                            "finish_date": project["finish_date"],
                            "days_remaining": days_until
                        })
                except:
                    pass
                
                # Count protocol usage
                for protocol in project["protocols"]:
                    protocol_name = protocol["name"]
                    summary["protocol_usage"][protocol_name] = summary["protocol_usage"].get(protocol_name, 0) + 1
            
            self.send_json_response(summary)
        elif path == '/api/v1/protocols/development-summary':
            # Get protocol development dashboard summary
            summary = {
                "total_protocols": len(protocols),
                "by_status": {},
                "by_health": {},
                "steward_workload": {},
                "version_releases": [],
                "client_protocol_matrix": {}
            }
            
            # Count by status and health
            for protocol in protocols:
                status = protocol["status"]
                health = protocol["health_score"]
                summary["by_status"][status] = summary["by_status"].get(status, 0) + 1
                summary["by_health"][health] = summary["by_health"].get(health, 0) + 1
                
                # Steward workload
                steward = protocol.get("steward_name", "Unassigned")
                if steward:
                    if steward not in summary["steward_workload"]:
                        summary["steward_workload"][steward] = {"protocols": 0, "clients": 0}
                    summary["steward_workload"][steward]["protocols"] += 1
                    summary["steward_workload"][steward]["clients"] += len(protocol.get("hive_clients", []))
                
                # Version releases
                if protocol.get("next_release"):
                    summary["version_releases"].append({
                        "protocol": protocol["name"],
                        "current": protocol["current_version"],
                        "next": protocol["next_release"],
                        "steward": steward
                    })
                
                # Client-protocol matrix
                for client in protocol.get("hive_clients", []):
                    client_name = client["name"]
                    if client_name not in summary["client_protocol_matrix"]:
                        summary["client_protocol_matrix"][client_name] = []
                    summary["client_protocol_matrix"][client_name].append({
                        "protocol": protocol["name"],
                        "version": protocol["current_version"],
                        "status": client["status"]
                    })
            
            self.send_json_response(summary)
        elif path.startswith('/api/v1/protocols/') and path.endswith('/development-tasks'):
            # Get development tasks for a specific protocol
            protocol_id = path.split('/')[4]
            protocol = next((p for p in protocols if p["id"] == protocol_id), None)
            if not protocol:
                self.send_error(404, "Protocol not found")
                return
            
            # Find tasks related to this protocol
            protocol_tasks = [t for t in tasks if 
                            t.get("type") == "protocol_core" and 
                            t.get("protocol_id") == protocol_id or
                            protocol["name"].lower() in t.get("title", "").lower() or
                            protocol["name"].lower() in t.get("category", "").lower()]
            
            # Calculate development progress
            total_tasks = len(protocol_tasks)
            completed_tasks = len([t for t in protocol_tasks if t["status"] == "completed"])
            in_progress_tasks = len([t for t in protocol_tasks if t["status"] == "in_progress"])
            
            self.send_json_response({
                "protocol": protocol,
                "development_tasks": protocol_tasks,
                "progress": {
                    "total_tasks": total_tasks,
                    "completed": completed_tasks,
                    "in_progress": in_progress_tasks,
                    "completion_percentage": round(completed_tasks / total_tasks * 100, 1) if total_tasks > 0 else 0
                },
                "next_milestones": [t for t in protocol_tasks if t["status"] == "available"][:3]
            })
        elif path.startswith('/api/v1/protocols/') and path.endswith('/client-impact'):
            # Analyze client impact for a protocol
            protocol_id = path.split('/')[4] 
            protocol = next((p for p in protocols if p["id"] == protocol_id), None)
            if not protocol:
                self.send_error(404, "Protocol not found")
                return
            
            impact_analysis = {
                "protocol": protocol,
                "active_clients": len([c for c in protocol["hive_clients"] if c["status"] == "active"]),
                "total_clients": len(protocol["hive_clients"]),
                "client_details": protocol["hive_clients"],
                "revenue_impact": "high" if len(protocol["hive_clients"]) > 2 else "medium" if len(protocol["hive_clients"]) > 0 else "low",
                "strategic_importance": protocol.get("development_priority", "medium")
            }
            
            self.send_json_response(impact_analysis)
        elif path == '/api/v1/protocols/steward-assignments':
            # Get steward assignment overview
            steward_data = {}
            
            for protocol in protocols:
                steward = protocol.get("steward_name")
                if steward and steward != "":
                    if steward not in steward_data:
                        steward_data[steward] = {
                            "protocols": [],
                            "total_clients": 0,
                            "health_scores": [],
                            "development_load": 0
                        }
                    
                    steward_data[steward]["protocols"].append({
                        "name": protocol["name"],
                        "status": protocol["status"],
                        "version": protocol["current_version"],
                        "priority": protocol["development_priority"],
                        "health": protocol["health_score"]
                    })
                    steward_data[steward]["total_clients"] += len(protocol["hive_clients"])
                    steward_data[steward]["health_scores"].append(protocol["health_score"])
                    
                    # Calculate development load based on status and priority
                    load_map = {"high": 3, "medium": 2, "low": 1}
                    status_multiplier = {"In Progress": 1.5, "Production": 1.0, "Not Started": 0.5}
                    steward_data[steward]["development_load"] += (
                        load_map.get(protocol["development_priority"], 2) * 
                        status_multiplier.get(protocol["status"], 1.0)
                    )
            
            # Calculate summary metrics for each steward
            for steward in steward_data:
                data = steward_data[steward]
                health_counts = {"green": 0, "yellow": 0, "red": 0}
                for health in data["health_scores"]:
                    health_counts[health] = health_counts.get(health, 0) + 1
                
                data["protocol_count"] = len(data["protocols"])
                data["health_summary"] = health_counts
                data["average_load"] = round(data["development_load"] / len(data["protocols"]), 1)
                data["workload_status"] = (
                    "overloaded" if data["development_load"] > 8 else
                    "balanced" if data["development_load"] > 4 else
                    "underutilized"
                )
            
            self.send_json_response({
                "stewards": steward_data,
                "unassigned_protocols": [p for p in protocols if not p.get("steward_name")],
                "recommendations": {
                    "load_balancing_needed": any(s["workload_status"] == "overloaded" for s in steward_data.values()),
                    "steward_gaps": len([p for p in protocols if not p.get("steward_name")])
                }
            })
        elif path == '/api/v1/client-implementations/pipeline-summary':
            # Get implementation pipeline overview
            pipeline_summary = {
                "total_implementations": len(client_implementations),
                "by_status": {},
                "by_protocol": {},
                "deployment_environments": {},
                "implementation_types": {},
                "active_contacts": set(),
                "upcoming_go_lives": []
            }
            
            for impl in client_implementations:
                # Status distribution
                status = impl["status"]
                pipeline_summary["by_status"][status] = pipeline_summary["by_status"].get(status, 0) + 1
                
                # Protocol usage
                for protocol in impl["hive_protocols"]:
                    protocol_name = protocol["name"]
                    if protocol_name not in pipeline_summary["by_protocol"]:
                        pipeline_summary["by_protocol"][protocol_name] = {
                            "implementations": 0,
                            "statuses": []
                        }
                    pipeline_summary["by_protocol"][protocol_name]["implementations"] += 1
                    pipeline_summary["by_protocol"][protocol_name]["statuses"].append({
                        "client": impl["name"],
                        "status": impl["status"],
                        "integration_status": protocol["integration_status"]
                    })
                
                # Environment tracking
                env = impl["deployment_environment"]
                pipeline_summary["deployment_environments"][env] = pipeline_summary["deployment_environments"].get(env, 0) + 1
                
                # Implementation type tracking
                impl_type = impl["implementation_type"]
                pipeline_summary["implementation_types"][impl_type] = pipeline_summary["implementation_types"].get(impl_type, 0) + 1
                
                # Contact tracking
                pipeline_summary["active_contacts"].add(impl["primary_contact"])
                
                # Go-live tracking (if date exists)
                if impl["go_live_date"]:
                    pipeline_summary["upcoming_go_lives"].append({
                        "client": impl["name"],
                        "date": impl["go_live_date"],
                        "contact": impl["primary_contact"]
                    })
            
            # Convert set to list for JSON serialization
            pipeline_summary["active_contacts"] = list(pipeline_summary["active_contacts"])
            
            self.send_json_response(pipeline_summary)
        elif path.startswith('/api/v1/client-implementations/') and path.endswith('/protocol-details'):
            # Get detailed protocol implementation status
            impl_id = path.split('/')[4]
            implementation = next((i for i in client_implementations if i["id"] == impl_id), None)
            if not implementation:
                self.send_error(404, "Client implementation not found")
                return
            
            protocol_details = []
            for protocol in implementation["hive_protocols"]:
                # Find the protocol in our protocols list
                protocol_info = next((p for p in protocols if p["name"] == protocol["name"]), None)
                
                protocol_detail = {
                    "name": protocol["name"],
                    "url": protocol["url"],
                    "deployed_version": protocol["version_deployed"],
                    "integration_status": protocol["integration_status"],
                    "latest_version": protocol_info["current_version"] if protocol_info else "unknown",
                    "version_gap": protocol["version_deployed"] != protocol_info["current_version"] if protocol_info and protocol["version_deployed"] else False,
                    "protocol_health": protocol_info["health_score"] if protocol_info else "unknown",
                    "steward": protocol_info["steward_name"] if protocol_info else "unassigned"
                }
                protocol_details.append(protocol_detail)
            
            self.send_json_response({
                "implementation": implementation,
                "protocol_details": protocol_details,
                "overall_readiness": {
                    "protocols_ready": len([p for p in protocol_details if p["integration_status"] == "active"]),
                    "total_protocols": len(protocol_details),
                    "version_updates_needed": len([p for p in protocol_details if p.get("version_gap", False)])
                }
            })
        elif path.startswith('/api/v1/client-implementations/') and path.endswith('/implementation-tasks'):
            # Get tasks specific to this client implementation
            impl_id = path.split('/')[4]
            implementation = next((i for i in client_implementations if i["id"] == impl_id), None)
            if not implementation:
                self.send_error(404, "Client implementation not found")
                return
            
            # Find tasks related to this implementation
            impl_tasks = []
            client_name_lower = implementation["name"].lower()
            
            for task in tasks:
                task_title_lower = task.get("title", "").lower()
                task_desc_lower = task.get("description", "").lower()
                task_category_lower = task.get("category", "").lower()
                
                # Check if task relates to this client implementation
                if (client_name_lower in task_title_lower or 
                    client_name_lower in task_desc_lower or
                    client_name_lower in task_category_lower or
                    any(protocol["name"].lower() in task_title_lower for protocol in implementation["hive_protocols"])):
                    impl_tasks.append(task)
            
            # Calculate implementation progress
            total_tasks = len(impl_tasks)
            completed_tasks = len([t for t in impl_tasks if t["status"] == "completed"])
            in_progress_tasks = len([t for t in impl_tasks if t["status"] == "in_progress"])
            
            self.send_json_response({
                "implementation": implementation,
                "tasks": impl_tasks,
                "progress": {
                    "total_tasks": total_tasks,
                    "completed": completed_tasks,
                    "in_progress": in_progress_tasks,
                    "completion_percentage": round(completed_tasks / total_tasks * 100, 1) if total_tasks > 0 else 0
                },
                "next_actions": [t for t in impl_tasks if t["status"] == "available"][:3]
            })
        elif path == '/api/v1/client-implementations/protocol-matrix':
            # Generate protocol-client implementation matrix
            matrix = {}
            
            # Initialize matrix with all protocols
            for protocol in protocols:
                matrix[protocol["name"]] = {
                    "protocol_info": {
                        "version": protocol["current_version"],
                        "status": protocol["status"],
                        "steward": protocol["steward_name"]
                    },
                    "implementations": []
                }
            
            # Populate with implementations
            for impl in client_implementations:
                for protocol in impl["hive_protocols"]:
                    protocol_name = protocol["name"]
                    if protocol_name in matrix:
                        matrix[protocol_name]["implementations"].append({
                            "client": impl["name"],
                            "status": impl["status"],
                            "deployed_version": protocol["version_deployed"],
                            "integration_status": protocol["integration_status"],
                            "environment": impl["deployment_environment"],
                            "contact": impl["primary_contact"]
                        })
            
            # Calculate summary stats
            summary = {
                "total_protocols": len(matrix),
                "protocols_in_use": len([p for p in matrix.values() if p["implementations"]]),
                "total_implementations": sum(len(p["implementations"]) for p in matrix.values()),
                "active_implementations": sum(
                    len([i for i in p["implementations"] if i["integration_status"] == "active"]) 
                    for p in matrix.values()
                )
            }
            
            self.send_json_response({
                "matrix": matrix,
                "summary": summary
            })
        elif path == '/api/v1/admin/users':
            # Admin endpoint to manage users
            # Check if user has admin permissions
            auth_header = self.headers.get('Authorization', '')
            if not auth_header or 'admin' not in auth_header:
                self.send_error(403, "Admin access required")
                return
                
            self.send_json_response(users_database)
        elif path == '/api/v1/admin/roles':
            # Get available role templates
            auth_header = self.headers.get('Authorization', '')
            if not auth_header or 'admin' not in auth_header:
                self.send_error(403, "Admin access required")
                return
                
            self.send_json_response(role_templates)
        elif path.startswith('/api/v1/admin/users/') and '/promote' in path:
            # Promote user to higher role
            user_id = path.split('/')[4]
            user = next((u for u in users_database if u["id"] == user_id), None)
            if not user:
                self.send_error(404, "User not found")
                return
                
            # Simple promotion logic
            role_hierarchy = ["Community Member", "Ecosystem Designer", "Network Manager", "Protocol Steward", "TaskMaster Admin"]
            current_index = role_hierarchy.index(user["role"]) if user["role"] in role_hierarchy else 0
            
            if current_index < len(role_hierarchy) - 1:
                new_role = role_hierarchy[current_index + 1]
                user["role"] = new_role
                user["permissions"] = role_templates[new_role]["permissions"].copy()
                
                self.send_json_response({
                    "message": f"User promoted to {new_role}",
                    "user": user
                })
            else:
                self.send_error(400, "User already at highest role")
        elif path.startswith('/api/v1/admin/users/') and '/demote' in path:
            # Demote user to lower role
            user_id = path.split('/')[4]
            user = next((u for u in users_database if u["id"] == user_id), None)
            if not user:
                self.send_error(404, "User not found")
                return
                
            # Simple demotion logic
            role_hierarchy = ["Community Member", "Ecosystem Designer", "Network Manager", "Protocol Steward", "TaskMaster Admin"]
            current_index = role_hierarchy.index(user["role"]) if user["role"] in role_hierarchy else 0
            
            if current_index > 0:
                new_role = role_hierarchy[current_index - 1]
                user["role"] = new_role
                user["permissions"] = role_templates[new_role]["permissions"].copy()
                
                self.send_json_response({
                    "message": f"User demoted to {new_role}",
                    "user": user
                })
            else:
                self.send_error(400, "User already at lowest role")
        elif path.startswith('/api/v1/admin/users/') and '/toggle-status' in path:
            # Toggle user active/inactive status
            user_id = path.split('/')[4]
            user = next((u for u in users_database if u["id"] == user_id), None)
            if not user:
                self.send_error(404, "User not found")
                return
                
            user["status"] = "inactive" if user["status"] == "active" else "active"
            
            self.send_json_response({
                "message": f"User status changed to {user['status']}",
                "user": user
            })
        elif path == '/api/v1/baselines/update-current':
            # Update current values for baseline metrics (simulate real measurements)
            
            # Calculate real metrics from current data
            total_tasks = len(tasks)
            completed_tasks = len([t for t in tasks if t["status"] == "completed"])
            sprint_completion_rate = completed_tasks / total_tasks if total_tasks > 0 else 0
            
            # Team utilization metrics
            total_capacity = sum(m["capacity_hours"] for m in team_members)
            total_workload = sum(m["current_workload"] for m in team_members)
            team_utilization = (total_workload / total_capacity) if total_capacity > 0 else 0
            
            # Update baseline current values
            for baseline in baselines:
                if baseline["metric_name"] == "sprint_completion_rate":
                    baseline["current_value"] = round(sprint_completion_rate, 2)
                elif baseline["metric_name"] == "assignment_decision_time_minutes":
                    # Simulate improvement based on AI suggestions
                    baseline["current_value"] = max(5, baseline["baseline_value"] - 10)  # AI helps reduce time
                elif baseline["metric_name"] == "meeting_hours_per_week":
                    # Simulate reduction due to better coordination
                    baseline["current_value"] = max(3, baseline["baseline_value"] - 2)
                
                baseline["measurement_date"] = datetime.now().isoformat()[:10]  # YYYY-MM-DD
            
            self.send_json_response({
                "message": "Baseline current values updated",
                "updated_metrics": [
                    {
                        "metric": b["metric_name"],
                        "baseline": b["baseline_value"],
                        "current": b["current_value"],
                        "change": round(b["current_value"] - b["baseline_value"], 2)
                    }
                    for b in baselines
                ]
            })
        elif path == '/api/v1/bottlenecks/detect':
            # Automated bottleneck detection
            bottlenecks = []
            
            # Team capacity bottlenecks
            for member in team_members:
                utilization = (member["current_workload"] / member["capacity_hours"]) * 100 if member["capacity_hours"] > 0 else 0
                if utilization > 95:
                    bottlenecks.append({
                        "type": "team_overload",
                        "severity": "high",
                        "resource": member["name"],
                        "description": f"{member['name']} is at {utilization:.1f}% capacity",
                        "impact": "Task assignment delays",
                        "suggestion": f"Redistribute {member['current_workload'] - member['capacity_hours']:.1f} hours of work"
                    })
            
            # Skills gap bottlenecks
            required_skills_all = []
            for task in tasks:
                if task.get("status") == "available":
                    required_skills_all.extend(task.get("required_skills", []))
            
            from collections import Counter
            skill_demand = Counter(required_skills_all)
            
            team_skills = []
            for member in team_members:
                team_skills.extend(member.get("skills", []))
            skill_supply = Counter(team_skills)
            
            for skill, demand in skill_demand.most_common(5):
                supply = skill_supply.get(skill, 0)
                if demand > supply * 2:  # Demand exceeds supply significantly
                    bottlenecks.append({
                        "type": "skills_gap",
                        "severity": "medium",
                        "resource": skill,
                        "description": f"High demand for '{skill}' skill ({demand} tasks) vs limited team expertise ({supply} members)",
                        "impact": "Task assignment delays, quality risks",
                        "suggestion": f"Consider training team members in {skill} or hiring specialist"
                    })
            
            # Protocol/Client imbalance bottlenecks
            protocol_tasks = [t for t in tasks if t.get("type") == "protocol_core" and t.get("status") == "available"]
            client_tasks = [t for t in tasks if t.get("type") == "client_project" and t.get("status") == "available"]
            
            if len(protocol_tasks) < len(client_tasks) * 0.5:  # Too few protocol tasks
                bottlenecks.append({
                    "type": "work_imbalance",
                    "severity": "medium", 
                    "resource": "protocol_work",
                    "description": f"Low protocol work ({len(protocol_tasks)} tasks) vs client work ({len(client_tasks)} tasks)",
                    "impact": "Strategic misalignment with 60/30/10 target",
                    "suggestion": "Create more protocol development tasks"
                })
            
            # Timeline predictions
            total_available_hours = sum(max(0, m["capacity_hours"] - m["current_workload"]) for m in team_members)
            total_task_hours = sum(t.get("estimated_hours_numeric", 0) for t in tasks if t.get("status") == "available")
            
            if total_task_hours > total_available_hours:
                weeks_behind = (total_task_hours - total_available_hours) / (total_available_hours / 1 if total_available_hours > 0 else 1)
                bottlenecks.append({
                    "type": "timeline_risk",
                    "severity": "high" if weeks_behind > 2 else "medium",
                    "resource": "team_capacity",
                    "description": f"Backlog requires {total_task_hours} hours but team has {total_available_hours} available hours",
                    "impact": f"Estimated {weeks_behind:.1f} weeks behind schedule",
                    "suggestion": "Prioritize tasks, extend timeline, or increase team capacity"
                })
            
            self.send_json_response({
                "bottlenecks": bottlenecks,
                "summary": {
                    "total_bottlenecks": len(bottlenecks),
                    "high_severity": len([b for b in bottlenecks if b["severity"] == "high"]),
                    "medium_severity": len([b for b in bottlenecks if b["severity"] == "medium"]),
                    "low_severity": len([b for b in bottlenecks if b["severity"] == "low"])
                },
                "team_metrics": {
                    "total_capacity": sum(m["capacity_hours"] for m in team_members),
                    "total_workload": sum(m["current_workload"] for m in team_members),
                    "available_capacity": total_available_hours,
                    "pending_work": total_task_hours
                },
                "detection_date": datetime.now().isoformat() + "Z"
            })
        elif path == '/api/v1/skills-analysis/gaps':
            # Skills gap identification and training recommendations
            
            # Analyze skill demand from available tasks
            skill_demand = {}
            for task in tasks:
                if task.get("status") == "available":
                    for skill in task.get("required_skills", []):
                        skill_demand[skill] = skill_demand.get(skill, 0) + 1
            
            # Analyze current team skills and levels
            team_skill_analysis = {}
            for member in team_members:
                for skill in member.get("skills", []):
                    if skill not in team_skill_analysis:
                        team_skill_analysis[skill] = {"members": [], "avg_level": 0, "count": 0}
                    
                    skill_level = member.get("skill_levels", {}).get(skill, 5)
                    team_skill_analysis[skill]["members"].append({
                        "name": member["name"],
                        "level": skill_level
                    })
                    team_skill_analysis[skill]["count"] += 1
            
            # Calculate average skill levels
            for skill, data in team_skill_analysis.items():
                if data["members"]:
                    data["avg_level"] = sum(m["level"] for m in data["members"]) / len(data["members"])
            
            # Identify gaps and recommendations
            skill_gaps = []
            training_recommendations = []
            
            for skill, demand in skill_demand.items():
                team_info = team_skill_analysis.get(skill, {"count": 0, "avg_level": 0, "members": []})
                supply = team_info["count"]
                avg_level = team_info["avg_level"]
                
                # Calculate gap severity
                gap_severity = "none"
                if supply == 0:
                    gap_severity = "critical"
                elif demand > supply * 2:
                    gap_severity = "high"
                elif demand > supply:
                    gap_severity = "medium"
                elif avg_level < 6:  # Low skill level
                    gap_severity = "low"
                
                if gap_severity != "none":
                    skill_gaps.append({
                        "skill": skill,
                        "demand": demand,
                        "supply": supply,
                        "avg_level": round(avg_level, 1),
                        "gap_severity": gap_severity,
                        "team_members": team_info["members"]
                    })
                    
                    # Generate training recommendations
                    if supply == 0:
                        training_recommendations.append({
                            "type": "new_skill_training",
                            "skill": skill,
                            "priority": "high",
                            "recommendation": f"No team members have '{skill}' skill. Consider hiring or intensive training.",
                            "suggested_trainees": "entire_team",
                            "estimated_time": "2-4 weeks"
                        })
                    elif avg_level < 6:
                        training_recommendations.append({
                            "type": "skill_improvement",
                            "skill": skill,
                            "priority": "medium",
                            "recommendation": f"Improve '{skill}' skill level (current avg: {avg_level:.1f}/10)",
                            "suggested_trainees": [m["name"] for m in team_info["members"] if m["level"] < 6],
                            "estimated_time": "1-2 weeks"
                        })
                    elif demand > supply:
                        training_recommendations.append({
                            "type": "capacity_expansion",
                            "skill": skill,
                            "priority": "medium",
                            "recommendation": f"Train additional team members in '{skill}' to meet demand",
                            "suggested_trainees": "cross_train_members",
                            "estimated_time": "1-3 weeks"
                        })
            
            # Identify emerging skills (high-level team members could mentor others)
            mentoring_opportunities = []
            for skill, data in team_skill_analysis.items():
                if data["members"]:
                    experts = [m for m in data["members"] if m["level"] >= 8]
                    beginners = [m for m in data["members"] if m["level"] <= 5]
                    
                    if experts and beginners:
                        mentoring_opportunities.append({
                            "skill": skill,
                            "experts": [e["name"] for e in experts],
                            "mentees": [b["name"] for b in beginners],
                            "potential_improvement": f"Could improve {len(beginners)} team members' {skill} skills"
                        })
            
            self.send_json_response({
                "skill_gaps": skill_gaps,
                "training_recommendations": training_recommendations,
                "mentoring_opportunities": mentoring_opportunities,
                "summary": {
                    "total_skills_in_demand": len(skill_demand),
                    "critical_gaps": len([g for g in skill_gaps if g["gap_severity"] == "critical"]),
                    "high_priority_training": len([r for r in training_recommendations if r["priority"] == "high"]),
                    "mentoring_pairs": len(mentoring_opportunities)
                },
                "team_skill_overview": {
                    "total_unique_skills": len(team_skill_analysis),
                    "most_demanded_skills": sorted(skill_demand.items(), key=lambda x: x[1], reverse=True)[:5],
                    "strongest_team_skills": sorted(
                        [(skill, data["avg_level"]) for skill, data in team_skill_analysis.items()],
                        key=lambda x: x[1], reverse=True
                    )[:5]
                },
                "analysis_date": datetime.now().isoformat() + "Z"
            })
        else:
            self.send_error(404, "Endpoint not found")

    def do_POST(self):
        content_length = int(self.headers.get('Content-Length', 0))
        post_data = self.rfile.read(content_length)
        
        try:
            data = json.loads(post_data.decode('utf-8'))
        except:
            data = {}
        
        parsed_url = urllib.parse.urlparse(self.path)
        path = parsed_url.path
        
        # Apply contract validation if enabled
        if CONTRACT_VALIDATION_ENABLED:
            try:
                validated_data = validate_simple_backend_request(path, data)
                if validated_data != data:
                    data = validated_data
                print(f"✅ Contract validation passed for {path}")
            except ValueError as e:
                print(f"❌ Contract validation failed for {path}: {e}")
                self.send_error(400, f"Contract validation failed: {e}")
                return
            except Exception as e:
                # Don't fail on validation errors, just log them for gradual migration
                print(f"⚠️ Contract validation error for {path}: {e}")
                pass
        
        if path == '/api/v1/auth/login':
            # Enhanced authentication with user database
            email = data.get("email", "")
            password = data.get("password", "")
            
            # Check credentials
            if password == 'demo':
                # Find user in database
                user = next((u for u in users_database if u["email"] == email), None)
                
                if user:
                    # Update last login
                    user["last_login"] = datetime.now().isoformat() + "Z"
                    
                    # Generate token
                    token = f"demo-token-{email.split('@')[0]}-12345"
                    
                    user_data = {
                        "id": user["id"],
                        "email": user["email"],
                        "role": user["role"],
                        "permissions": user["permissions"],
                        "status": user["status"]
                    }
                    
                    response = {
                        "access_token": token,
                        "token_type": "bearer",
                        "user": user_data
                    }
                    self.send_json_response(response, 200)
                else:
                    self.send_error(401, "User not found")
            else:
                self.send_error(401, "Invalid credentials")
        elif path == '/api/v1/auth/register':
            # Simplified registration
            response = {
                "message": "User registered successfully",
                "user": {
                    "id": f"user{len(users) + 1}",
                    "email": data.get("email", ""),
                    "role": "Community Member"
                }
            }
            self.send_json_response(response, 201)
        elif path == '/api/v1/tasks/':
            # Create new task
            # Process Definition of Done if provided
            dod_criteria = []
            if data.get("definition_of_done"):
                dod_data = data.get("definition_of_done", "")
                
                # Handle both string and list inputs
                if isinstance(dod_data, str):
                    if dod_data.strip():
                        lines = [line.strip() for line in dod_data.split('\n') if line.strip()]
                        dod_criteria = [
                            {"id": i + 1, "text": line, "completed": False}
                            for i, line in enumerate(lines)
                        ]
                elif isinstance(dod_data, list):
                    # Already formatted as list
                    dod_criteria = dod_data
            
            new_task = {
                "id": str(len(tasks) + 1),
                "title": data.get("title", ""),
                "description": data.get("description", ""),
                "status": data.get("status", "available"),
                "priority": data.get("priority", "medium"),
                "category": data.get("category", ""),
                "impact_points": data.get("impact_points", 100),
                
                # Timeline
                "start_date": data.get("start_date"),
                "due_date": data.get("due_date"),
                
                # Team & Authority
                "team_size": data.get("team_size", 1),
                "authority_level": data.get("authority_level", "open"),
                
                # Scope & Impact
                "scope": data.get("scope", "internal"),
                "location": data.get("location", ""),
                
                # Effort & Resources
                "estimated_hours": data.get("estimated_hours"),
                "budget": data.get("budget"),
                "resources_needed": data.get("resources_needed"),
                
                # Skills & Deliverables
                "required_skills": data.get("required_skills", []),
                "success_metrics": data.get("success_metrics", []),
                "deliverables": data.get("deliverables", []),
                
                # Dependencies (empty for now, can be added later)
                "dependencies": [],
                
                # Definition of Done
                "definition_of_done": dod_criteria,
                
                # TaskMaster enhanced fields
                "type": data.get("type", "protocol_core"),  # protocol_core, client_project, infrastructure
                "protocol_id": data.get("protocol_id"),
                "client_id": data.get("client_id"),
                "sprint_goal": data.get("sprint_goal", ""),
                "okr_alignment_score": data.get("okr_alignment_score", 0.5),
                "estimated_hours_numeric": data.get("estimated_hours_numeric", 0),
                "milestones": [],
                
                # System fields
                "owner_id": "user1",  # Simplified auth
                "assignee_id": None,
                "created_at": datetime.now().isoformat() + "Z",
                "updated_at": datetime.now().isoformat() + "Z"
            }
            tasks.append(new_task)
            self.send_json_response(new_task, 201)
        elif path == '/api/v1/milestones':
            # Create new milestone
            new_milestone = {
                "id": str(len(tasks) * 10 + 1),  # Simple ID generation
                "task_id": data.get("task_id", ""),
                "title": data.get("title", ""),
                "description": data.get("description", ""),
                "dod_alignment": data.get("dod_alignment", "Needs Review"),
                "okr_alignment": data.get("okr_alignment", "Needs Review"),
                "prime_directive_alignment": data.get("prime_directive_alignment", "Needs Review"),
                "deadline": data.get("deadline"),
                "acceptance_criteria": data.get("acceptance_criteria", []),
                "completed": False,
                "files": [],
                "help_requests": [],
                "created_at": datetime.now().isoformat() + "Z",
                "updated_at": datetime.now().isoformat() + "Z"
            }
            
            # Add milestone to the specific task (in a real app, this would be in database)
            task_id = data.get("task_id")
            task = next((t for t in tasks if t["id"] == task_id), None)
            if task:
                if "milestones" not in task:
                    task["milestones"] = []
                task["milestones"].append(new_milestone)
                task["updated_at"] = datetime.now().isoformat() + "Z"
            
            self.send_json_response(new_milestone, 201)
        elif path == '/api/v1/comments/':
            # Add comment
            comment = {
                "id": str(len(comments) + 1),
                "content": data.get("content", ""),
                "task_id": data.get("task_id", ""),
                "author_id": "user1",  # Simplified auth
                "author_email": "alice@example.com",
                "author_role": "Ecosystem Designer",
                "created_at": datetime.now().isoformat() + "Z",
                "updated_at": datetime.now().isoformat() + "Z"
            }
            comments.append(comment)
            self.send_json_response(comment, 201)
        elif path.startswith('/api/v1/chat/task/') and path.endswith('/messages'):
            # Add task chat message
            task_id = path.split('/')[-2]
            message = {
                "id": str(len(chat_messages) + 1),
                "content": data.get("content", ""),
                "task_id": task_id,
                "sender_id": "user1",  # Simplified auth
                "sender_email": "alice@example.com",
                "sender_role": "Ecosystem Designer",
                "message_type": "task_chat",
                "created_at": datetime.now().isoformat() + "Z"
            }
            chat_messages.append(message)
            self.send_json_response(message, 201)
        elif path == '/api/v1/files/upload':
            # General file upload endpoint
            try:
                file_id = str(len(file_uploads) + 1)
                file_data = {
                    "id": file_id,
                    "name": data.get("name", "unknown_file"),
                    "content": data.get("content", ""),  # Base64 encoded content
                    "type": data.get("type", "application/octet-stream"),
                    "size": data.get("size", 0),
                    "task_id": data.get("task_id", ""),
                    "milestone_id": data.get("milestone_id", ""),
                    "uploaded_at": data.get("uploaded_at", datetime.now().isoformat() + "Z"),
                    "uploaded_by": "user1"  # Simplified auth
                }
                file_uploads[file_id] = file_data
                
                # Return file info without content
                response = {
                    "id": file_id,
                    "name": file_data["name"],
                    "size": file_data["size"],
                    "type": file_data["type"],
                    "task_id": file_data["task_id"],
                    "milestone_id": file_data["milestone_id"],
                    "uploaded_at": file_data["uploaded_at"]
                }
                self.send_json_response(response, 201)
            except Exception as e:
                self.send_error(400, f"File upload failed: {str(e)}")
        elif path.startswith('/api/v1/files/upload/'):
            # Upload file for a specific task (legacy)
            task_id = path.split('/')[-1]
            try:
                file_id = str(len(file_uploads) + 1)
                file_data = {
                    "id": file_id,
                    "name": data.get("name", "unknown_file"),
                    "content": data.get("content", ""),  # Base64 encoded content
                    "type": data.get("type", "application/octet-stream"),
                    "size": data.get("size", 0),
                    "task_id": task_id,
                    "milestone_id": data.get("milestone_id", ""),
                    "uploaded_at": datetime.now().isoformat() + "Z",
                    "uploaded_by": "user1"  # Simplified auth
                }
                file_uploads[file_id] = file_data
                
                # Return file info without content
                response = {
                    "id": file_id,
                    "name": file_data["name"],
                    "size": file_data["size"],
                    "type": file_data["type"],
                    "uploaded_at": file_data["uploaded_at"]
                }
                self.send_json_response(response, 201)
            except Exception as e:
                self.send_error(400, f"File upload failed: {str(e)}")
        elif path == '/api/v1/help-requests':
            # Create help request
            help_request = {
                "id": data.get("id", f"help-{int(time.time())}"),
                "milestone_id": data.get("milestone_id", ""),
                "task_id": data.get("task_id", ""),
                "requester_id": data.get("requester_id", "user1"),
                "requester_name": data.get("requester_name", "Demo User"),
                "reason": data.get("reason", ""),
                "status": data.get("status", "open"),
                "urgency": data.get("urgency", "medium"),
                "created_at": data.get("created_at", datetime.now().isoformat())
            }
            help_requests[help_request["id"]] = help_request
            self.send_json_response({"message": "Help request created", "request": help_request}, 201)
        elif path.startswith('/api/v1/help-requests/') and path.endswith('/respond'):
            # Respond to help request
            request_id = path.split('/')[4]
            if request_id in help_requests:
                help_requests[request_id]["status"] = "responded"
                help_requests[request_id]["response"] = data.get("response", "")
                help_requests[request_id]["helper_id"] = data.get("helper_id", "user1")
                help_requests[request_id]["helper_name"] = data.get("helper_name", "Demo Helper")
                help_requests[request_id]["responded_at"] = datetime.now().isoformat()
                self.send_json_response({"message": "Help response sent", "request": help_requests[request_id]}, 200)
            else:
                self.send_error(404, "Help request not found")
        elif path.startswith('/api/v1/tasks/') and path.endswith('/dod'):
            # Update Definition of Done for a task
            task_id = path.split('/')[4]  # Extract task ID from path
            task = next((t for t in tasks if t["id"] == task_id), None)
            if task:
                dod_item_id = data.get("dod_item_id")
                completed = data.get("completed", False)
                
                # Update the specific DoD item
                for item in task.get("definition_of_done", []):
                    if item["id"] == dod_item_id:
                        item["completed"] = completed
                        break
                
                task["updated_at"] = datetime.now().isoformat() + "Z"
                self.send_json_response({"message": "Definition of Done updated", "task": task})
            else:
                self.send_error(404, "Task not found")
        elif path.startswith('/api/v1/tasks/') and path.endswith('/assign'):
            # Assign task to current user
            task_id = path.split('/')[4]  # Extract task ID from path
            task = next((t for t in tasks if t["id"] == task_id), None)
            if task:
                user_id = data.get("user_id", "user1")  # Default to user1 for demo
                task["assignee_id"] = user_id
                task["status"] = "in_progress"
                task["updated_at"] = datetime.now().isoformat() + "Z"
                self.send_json_response({"message": "Task assigned successfully", "task": task})
            else:
                self.send_error(404, "Task not found")
        elif path.startswith('/api/v1/tasks/') and path.endswith('/claim'):
            # Claim task (assign to current user)
            task_id = path.split('/')[4]  # Extract task ID from path
            task = next((t for t in tasks if t["id"] == task_id), None)
            if task:
                if task["status"] == "available":
                    task["assignee_id"] = "user1"  # Default to user1 for demo
                    task["status"] = "in_progress"
                    task["updated_at"] = datetime.now().isoformat() + "Z"
                    self.send_json_response({"message": "Task claimed successfully", "task": task})
                else:
                    self.send_error(400, "Task is not available for claiming")
            else:
                self.send_error(404, "Task not found")
        # TaskMaster POST endpoints
        elif path == '/api/v1/protocols':
            # Create new protocol
            new_protocol = {
                "id": f"protocol-{len(protocols) + 1}",
                "name": data.get("name", ""),
                "status": data.get("status", "development"),
                "current_version": data.get("current_version", "1.0.0"),
                "steward_id": data.get("steward_id", "user-1"),
                "health_score": data.get("health_score", "green"),
                "description": data.get("description", ""),
                "created_at": datetime.now().isoformat() + "Z",
                "updated_at": datetime.now().isoformat() + "Z"
            }
            protocols.append(new_protocol)
            self.send_json_response(new_protocol, 201)
        elif path == '/api/v1/clients':
            # Create new client
            new_client = {
                "id": f"client-{len(clients) + 1}",
                "name": data.get("name", ""),
                "implementation_status": data.get("implementation_status", "scoping"),
                "go_live_date": data.get("go_live_date", ""),
                "revenue_potential": data.get("revenue_potential", "medium"),
                "primary_contact": data.get("primary_contact", ""),
                "protocols_used": data.get("protocols_used", []),
                "created_at": datetime.now().isoformat() + "Z",
                "updated_at": datetime.now().isoformat() + "Z"
            }
            clients.append(new_client)
            self.send_json_response(new_client, 201)
        elif path == '/api/v1/okrs':
            # Create new OKR
            new_okr = {
                "id": f"okr-{len(okrs) + 1}",
                "objective": data.get("objective", ""),
                "key_results": data.get("key_results", []),
                "priority_weight": data.get("priority_weight", 0.5),
                "quarter": data.get("quarter", "2025-Q2"),
                "status": data.get("status", "active"),
                "created_at": datetime.now().isoformat() + "Z",
                "updated_at": datetime.now().isoformat() + "Z"
            }
            okrs.append(new_okr)
            self.send_json_response(new_okr, 201)
        elif path.startswith('/api/v1/team-members/') and path.endswith('/capacity'):
            # Update team member capacity
            member_id = path.split('/')[4]
            member = next((m for m in team_members if m["id"] == member_id), None)
            if member:
                member["capacity_hours"] = data.get("capacity_hours", member["capacity_hours"])
                member["current_workload"] = data.get("current_workload", member["current_workload"])
                member["updated_at"] = datetime.now().isoformat() + "Z"
                
                # Calculate workload percentage
                workload_percentage = (member["current_workload"] / member["capacity_hours"]) * 100 if member["capacity_hours"] > 0 else 0
                member["workload_percentage"] = round(workload_percentage, 1)
                
                self.send_json_response({"message": "Capacity updated", "member": member})
            else:
                self.send_error(404, "Team member not found")
        elif path == '/api/v1/team-capacity/summary':
            # Get team capacity summary
            capacity_summary = {
                "total_members": len(team_members),
                "total_capacity": sum(m["capacity_hours"] for m in team_members),
                "total_workload": sum(m["current_workload"] for m in team_members),
                "average_utilization": 0,
                "overloaded_members": [],
                "underutilized_members": []
            }
            
            if capacity_summary["total_capacity"] > 0:
                capacity_summary["average_utilization"] = round(
                    (capacity_summary["total_workload"] / capacity_summary["total_capacity"]) * 100, 1
                )
            
            # Find overloaded (>90%) and underutilized (<60%) members
            for member in team_members:
                utilization = (member["current_workload"] / member["capacity_hours"]) * 100 if member["capacity_hours"] > 0 else 0
                if utilization > 90:
                    capacity_summary["overloaded_members"].append({
                        "id": member["id"],
                        "name": member["name"],
                        "utilization": round(utilization, 1)
                    })
                elif utilization < 60:
                    capacity_summary["underutilized_members"].append({
                        "id": member["id"],
                        "name": member["name"],
                        "utilization": round(utilization, 1)
                    })
            
            self.send_json_response(capacity_summary)
        else:
            self.send_error(404, "Endpoint not found")

    def do_PUT(self):
        """Handle PUT requests"""
        parsed_url = urllib.parse.urlparse(self.path)
        path = parsed_url.path
        
        # Get request data
        content_length = int(self.headers.get('Content-Length', 0))
        if content_length > 0:
            post_data = self.rfile.read(content_length)
            try:
                data = json.loads(post_data.decode('utf-8'))
            except json.JSONDecodeError:
                self.send_error(400, "Invalid JSON")
                return
        else:
            data = {}
        
        if path.startswith('/api/v1/tasks/') and path.endswith('/status'):
            # Update task status
            task_id = path.split('/')[4]  # Extract task ID from path
            task = next((t for t in tasks if t["id"] == task_id), None)
            if task:
                new_status = data.get("status")
                if new_status in ["available", "in_progress", "completed", "on_hold"]:
                    task["status"] = new_status
                    task["updated_at"] = datetime.now().isoformat() + "Z"
                    
                    # Send CORS headers and response
                    self.send_response(200)
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
                    self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    response_data = {"message": "Task status updated", "task": task}
                    self.wfile.write(json.dumps(response_data).encode('utf-8'))
                else:
                    self.send_error(400, "Invalid status")
            else:
                self.send_error(404, "Task not found")
        else:
            self.send_error(404, "Endpoint not found")

    def do_DELETE(self):
        parsed_url = urllib.parse.urlparse(self.path)
        path = parsed_url.path
        
        if path.startswith('/api/v1/files/'):
            # Delete a specific file
            file_id = path.split('/')[-1]
            if file_id in file_uploads:
                del file_uploads[file_id]
                self.send_json_response({"message": "File deleted successfully"})
            else:
                self.send_error(404, "File not found")
        elif path.startswith('/api/v1/help-requests/'):
            # Delete help request
            request_id = path.split('/')[4]
            if request_id in help_requests:
                del help_requests[request_id]
                self.send_json_response({"message": "Help request deleted successfully"})
            else:
                self.send_error(404, "Help request not found")
        else:
            self.send_error(404, "Endpoint not found")

    def send_json_response(self, data, status=200):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode('utf-8'))

def run_server():
    # Get configuration from environment variables (set by dev-connect-dynamic.sh)
    PORT = int(os.getenv('BACKEND_PORT') or '8000')
    WSL_IP = os.getenv('WSL_IP') or '0.0.0.0'
    
    # Always bind to all interfaces for WSL compatibility, but log the correct IP
    HOST = "0.0.0.0"
    
    with socketserver.TCPServer((HOST, PORT), CORSHTTPRequestHandler) as httpd:
        print(f"🚀 HIVE Simple Backend Server starting...")
        print(f"📍 Server running at: http://{WSL_IP if WSL_IP != '0.0.0.0' else 'localhost'}:{PORT}")
        print(f"🌐 Health check: http://{WSL_IP if WSL_IP != '0.0.0.0' else 'localhost'}:{PORT}/health")
        print(f"💾 Using WSL_IP from environment: {WSL_IP}")
        print(f"📚 API endpoints available:")
        print(f"   GET  /api/v1/tasks/")
        print(f"   GET  /api/v1/dashboard/summary")
        print(f"   GET  /api/v1/users/online")
        print(f"   POST /api/v1/comments/")
        print(f"   GET  /api/v1/comments/task/{{task_id}}")
        print(f"   POST /api/v1/chat/task/{{task_id}}/messages")
        print(f"   GET  /api/v1/chat/task/{{task_id}}/messages")
        print(f"   POST /api/v1/files/upload/{{task_id}}")
        print(f"   GET  /api/v1/files/task/{{task_id}}")
        print(f"   GET  /api/v1/files/download/{{file_id}}")
        print(f"   DELETE /api/v1/files/{{file_id}}")
        print(f"   POST /api/v1/help-requests/")
        print(f"")
        print(f"💡 Note: This is a simplified backend using only Python stdlib")
        print(f"   Real-time WebSocket features are not available")
        print(f"   Authentication is simplified for testing")
        print(f"")
        print(f"⏹️  Press Ctrl+C to stop the server")
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print(f"\n🛑 Server stopped")

if __name__ == "__main__":
    run_server()