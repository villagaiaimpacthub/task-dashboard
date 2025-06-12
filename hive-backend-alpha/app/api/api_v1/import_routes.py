from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional, Any, Dict
import re

# Simple parser implementation for now
class SimpleMasterPlanParser:
    def parse_markdown(self, content: str):
        """Simple markdown parser for master plans"""
        tasks = []
        projects = []
        waypoints = []
        
        lines = content.split('\n')
        current_task = None
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
                
            # Parse waypoints (## Waypoint: or ## WP: or just ## with certain keywords)
            if line.startswith('## '):
                waypoint_text = line[3:].strip()
                if waypoint_text.startswith('Waypoint:') or waypoint_text.startswith('WP:'):
                    waypoint_name = re.sub(r'^(Waypoint:|WP:)\s*', '', waypoint_text).strip()
                elif any(keyword in waypoint_text.lower() for keyword in ['waypoint', 'milestone', 'phase', 'stage']):
                    waypoint_name = waypoint_text
                else:
                    # Treat any ## heading as a potential waypoint
                    waypoint_name = waypoint_text
                
                if waypoint_name:
                    waypoints.append({
                        "id": f"wp_{len(waypoints)}",
                        "name": waypoint_name,
                        "description": f"Waypoint: {waypoint_name}"
                    })
                
            # Parse projects (### Project: or ### without Task:)
            elif line.startswith('### '):
                project_text = line[4:].strip()
                if project_text.startswith('Project:'):
                    project_name = project_text.replace('Project:', '').strip()
                else:
                    # Treat any ### heading as a project unless it's clearly a task
                    project_name = project_text
                
                if project_name:
                    projects.append({
                        "id": f"proj_{len(projects)}",
                        "name": project_name,
                        "description": f"Project: {project_name}"
                    })
                
            # Parse tasks (#### Task: or #### anything)
            elif line.startswith('#### '):
                if current_task:
                    tasks.append(current_task)
                
                task_text = line[5:].strip()
                if task_text.startswith('Task:'):
                    task_title = task_text.replace('Task:', '').strip()
                else:
                    # Treat any #### heading as a task
                    task_title = task_text
                
                if task_title:
                    current_task = {
                        "id": f"task_{len(tasks)}",
                        "title": task_title,
                        "description": "",
                        "dependencies": [],
                        "priority": "medium",
                        "impact_points": 100
                    }
                
            # Parse dependencies (**Dependencies:**)
            elif current_task and ('**Dependencies:**' in line or 'Dependencies:' in line):
                deps_text = re.sub(r'\*\*Dependencies:\*\*|Dependencies:', '', line).strip()
                if deps_text and deps_text != "None":
                    # Split by common separators
                    deps = [dep.strip() for dep in re.split(r'[-,]', deps_text) if dep.strip()]
                    current_task["dependencies"] = deps
                    
            # Add to description if it's part of task content
            elif current_task and line and not line.startswith('#'):
                if current_task["description"]:
                    current_task["description"] += " " + line
                else:
                    current_task["description"] = line
        
        # Add the last task
        if current_task:
            tasks.append(current_task)
        
        return {
            "waypoints": waypoints,
            "projects": projects,
            "tasks": tasks
        }

def validate_master_plan(content: str):
    """Simple validation"""
    if not content.strip():
        return ["Master plan content is empty"]
    if len(content.split()) < 10:
        return ["Master plan seems too short (less than 10 words)"]
    return []

from app.dependencies import get_current_user, get_db
from app.models.user import User
from app.schemas.task import TaskCreate
from app.services.task_service import create_task
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter()

class MasterPlanRequest(BaseModel):
    content: str
    format: str = "markdown"

class ImportConfirmRequest(BaseModel):
    preview_data: Dict[str, Any]

@router.post("/master-plan")
async def parse_master_plan(
    request: MasterPlanRequest,
    current_user: User = Depends(get_current_user)
):
    """Parse a master plan document and return preview data"""
    try:
        # Debug: Log the content being parsed
        print(f"DEBUG: Parsing content of length {len(request.content)}")
        print(f"DEBUG: First 200 chars: {repr(request.content[:200])}")
        
        # Parse the master plan first to see what we get
        parser = SimpleMasterPlanParser()
        raw_result = parser.parse_markdown(request.content)
        print(f"DEBUG: Parser result - waypoints: {len(raw_result.get('waypoints', []))}, projects: {len(raw_result.get('projects', []))}, tasks: {len(raw_result.get('tasks', []))}")
        print(f"DEBUG: Sample waypoints: {raw_result.get('waypoints', [])[:2]}")
        print(f"DEBUG: Sample projects: {raw_result.get('projects', [])[:2]}")
        print(f"DEBUG: Sample tasks: {raw_result.get('tasks', [])[:2]}")
        
        # Validate the content
        errors = validate_master_plan(request.content)
        if errors:
            raise HTTPException(status_code=400, detail={"status": "error", "errors": errors})
        
        # Parse the master plan
        parser = SimpleMasterPlanParser()
        
        if request.format == "markdown":
            result = parser.parse_markdown(request.content)
        else:
            raise HTTPException(status_code=400, detail={"status": "error", "message": "Unsupported format"})
        
        return {
            "status": "success",
            "preview": result
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail={"status": "error", "message": str(e)})

@router.post("/confirm")
async def confirm_import(
    request: ImportConfirmRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Import the parsed tasks into the database"""
    try:
        preview_data = request.preview_data
        imported_count = 0
        
        # Import tasks from the preview data
        if "tasks" in preview_data:
            for task_data in preview_data["tasks"]:
                # Convert parsed task to TaskCreate schema
                task_create = TaskCreate(
                    title=task_data.get("title", ""),
                    description=task_data.get("description", ""),
                    priority=task_data.get("priority", "medium"),
                    category=task_data.get("category"),
                    impact_points=task_data.get("impact_points", 100),
                    estimated_hours=task_data.get("estimated_hours"),
                    required_skills=task_data.get("required_skills", []),
                    dependencies=task_data.get("dependencies", [])
                )
                
                # Create the task
                await create_task(db, task_create, current_user)
                imported_count += 1
        
        return {
            "status": "success",
            "imported_count": imported_count
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail={"status": "error", "message": str(e)})