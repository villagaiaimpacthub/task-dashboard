from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional, Any, Dict
import re

# Simple parser implementation for now
class SimpleMasterPlanParser:
    def __init__(self):
        # Knowledge base for intelligent field inference
        self.task_knowledge = {
            'jwt': {
                'category': 'Authentication & Security',
                'dependencies': ['Database schema design', 'User model implementation', 'Security configuration'],
                'required_skills': ['Node.js/Python backend development', 'JWT libraries', 'Security best practices', 'API design'],
                'success_metrics': ['Authentication response time < 100ms', 'JWT token validation accuracy 100%', 'Security audit pass', 'Zero authentication vulnerabilities'],
                'deliverables': ['JWT authentication middleware', 'Token refresh endpoint', 'Security documentation', 'Unit and integration tests'],
                'definition_of_done': 'JWT authentication system implemented with secure token generation, validation, refresh capabilities, and comprehensive security measures including rate limiting and proper error handling'
            },
            'authentication': {
                'category': 'Authentication & Security',
                'dependencies': ['Database setup', 'User registration system'],
                'required_skills': ['Backend development', 'Security protocols', 'Database design'],
                'success_metrics': ['Login success rate > 99%', 'Password security compliance', 'Session management'],
                'deliverables': ['Authentication system', 'Login/logout endpoints', 'Security documentation']
            },
            'rbac': {
                'category': 'Authorization & Access Control', 
                'dependencies': ['User authentication system', 'Role definition'],
                'required_skills': ['Access control design', 'Permission systems', 'Security modeling'],
                'success_metrics': ['Role assignment accuracy', 'Permission enforcement', 'Access audit compliance'],
                'deliverables': ['Role management system', 'Permission matrix', 'Access control middleware']
            },
            'task management': {
                'category': 'Core Features',
                'dependencies': ['User system', 'Database schema'],
                'required_skills': ['Full-stack development', 'UI/UX design', 'Database operations'],
                'success_metrics': ['Task creation speed', 'Assignment accuracy', 'Status tracking reliability'],
                'deliverables': ['Task CRUD operations', 'Assignment system', 'Status management']
            },
            'api': {
                'category': 'Backend Development',
                'dependencies': ['Database models', 'Authentication system'],
                'required_skills': ['RESTful API design', 'HTTP protocols', 'API documentation'],
                'success_metrics': ['API response time', 'Error handling coverage', 'Documentation completeness'],
                'deliverables': ['API endpoints', 'OpenAPI documentation', 'Error handling system']
            },
            'database': {
                'category': 'Data & Infrastructure',
                'dependencies': ['Database installation', 'Schema design'],
                'required_skills': ['Database design', 'SQL/NoSQL', 'Data modeling'],
                'success_metrics': ['Query performance', 'Data integrity', 'Backup reliability'],
                'deliverables': ['Database schema', 'Migration scripts', 'Data models']
            },
            'frontend': {
                'category': 'User Interface',
                'dependencies': ['API endpoints', 'Design system'],
                'required_skills': ['Frontend frameworks', 'UI/UX design', 'Responsive design'],
                'success_metrics': ['Page load time', 'User experience score', 'Mobile compatibility'],
                'deliverables': ['User interfaces', 'Component library', 'Style guide']
            },
            'websocket': {
                'category': 'Real-time Features',
                'dependencies': ['Backend infrastructure', 'Authentication'],
                'required_skills': ['WebSocket protocols', 'Real-time architecture', 'Event handling'],
                'success_metrics': ['Message delivery time', 'Connection stability', 'Concurrent user support'],
                'deliverables': ['WebSocket server', 'Real-time client', 'Message handling system']
            },
            'chat': {
                'category': 'Communication Features',
                'dependencies': ['User system', 'Real-time infrastructure'],
                'required_skills': ['Real-time messaging', 'UI design', 'Message persistence'],
                'success_metrics': ['Message delivery rate', 'Real-time latency', 'Message history accuracy'],
                'deliverables': ['Chat interface', 'Message storage', 'Notification system']
            },
            'file upload': {
                'category': 'File Management',
                'dependencies': ['Storage infrastructure', 'Security validation'],
                'required_skills': ['File handling', 'Security validation', 'Storage systems'],
                'success_metrics': ['Upload success rate', 'File integrity', 'Security validation'],
                'deliverables': ['Upload system', 'File validation', 'Storage management']
            }
        }
    
    def infer_task_metadata(self, title: str, description: str):
        """Intelligently infer task metadata based on content"""
        content_lower = f"{title} {description}".lower()
        
        # Find matching knowledge patterns
        matches = []
        for keyword, knowledge in self.task_knowledge.items():
            if keyword in content_lower:
                matches.append((keyword, knowledge))
        
        # If no specific matches, use generic inference
        if not matches:
            return self._generic_inference(title, description)
        
        # Combine knowledge from all matches
        inferred = {
            'category': None,
            'dependencies': [],
            'required_skills': [],
            'success_metrics': [],
            'deliverables': [],
            'definition_of_done': None
        }
        
        # Use the most specific match - prioritize exact matches and longer keywords
        # Also prioritize matches that have more complete knowledge
        def match_score(match):
            keyword, knowledge = match
            # Base score is keyword length
            score = len(keyword)
            # Bonus for having complete metadata
            if knowledge.get('definition_of_done'):
                score += 10
            if len(knowledge.get('dependencies', [])) > 2:
                score += 5
            if len(knowledge.get('required_skills', [])) > 2:
                score += 5
            return score
        
        best_match = max(matches, key=match_score)
        primary_knowledge = best_match[1]
        
        # Apply primary knowledge
        inferred['category'] = primary_knowledge.get('category')
        inferred['definition_of_done'] = primary_knowledge.get('definition_of_done')
        
        # Combine all relevant skills, dependencies, etc.
        for _, knowledge in matches:
            inferred['dependencies'].extend(knowledge.get('dependencies', []))
            inferred['required_skills'].extend(knowledge.get('required_skills', []))
            inferred['success_metrics'].extend(knowledge.get('success_metrics', []))
            inferred['deliverables'].extend(knowledge.get('deliverables', []))
        
        # Remove duplicates while preserving order
        for key in ['dependencies', 'required_skills', 'success_metrics', 'deliverables']:
            inferred[key] = list(dict.fromkeys(inferred[key]))
        
        return inferred
    
    def _generic_inference(self, title: str, description: str):
        """Generic inference for unrecognized tasks"""
        return {
            'category': 'General Development',
            'dependencies': ['Requirements analysis', 'Technical planning'],
            'required_skills': ['Software development', 'Problem solving'],
            'success_metrics': ['Feature completeness', 'Code quality', 'Testing coverage'],
            'deliverables': ['Working implementation', 'Documentation', 'Tests'],
            'definition_of_done': 'Feature implemented, tested, documented, and reviewed according to project standards'
        }
    
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
                        "impact_points": 100,
                        "_needs_inference": True  # Flag for later processing
                    }
                
            # Parse dependencies (**Dependencies:**)
            elif current_task and ('**Dependencies:**' in line or 'Dependencies:' in line):
                deps_text = re.sub(r'\*\*Dependencies:\*\*|Dependencies:', '', line).strip()
                if deps_text and deps_text != "None" and deps_text.lower() != "no dependencies":
                    # Split by common separators
                    deps = [dep.strip() for dep in re.split(r'[-,]', deps_text) if dep.strip()]
                    current_task["dependencies"] = deps
                    
            # Parse Definition of Done (**Definition of Done:**)
            elif current_task and ('**Definition of Done:**' in line or 'Definition of Done:' in line):
                dod_text = re.sub(r'\*\*Definition of Done:\*\*|Definition of Done:', '', line).strip()
                if dod_text:
                    current_task["definition_of_done"] = dod_text
                    
            # Parse Required Skills (**Required Skills:**)
            elif current_task and ('**Required Skills:**' in line or 'Required Skills:' in line):
                skills_text = re.sub(r'\*\*Required Skills:\*\*|Required Skills:', '', line).strip()
                if skills_text and skills_text.lower() != "no specific skills required":
                    # Split by common separators
                    skills = [skill.strip() for skill in re.split(r'[-,]', skills_text) if skill.strip()]
                    current_task["required_skills"] = skills
                    
            # Parse Success Metrics (**Success Metrics:**)
            elif current_task and ('**Success Metrics:**' in line or 'Success Metrics:' in line):
                metrics_text = re.sub(r'\*\*Success Metrics:\*\*|Success Metrics:', '', line).strip()
                if metrics_text and metrics_text.lower() != "success metrics not defined":
                    current_task["success_metrics"] = metrics_text
                    
            # Parse Deliverables (**Deliverables:**)
            elif current_task and ('**Deliverables:**' in line or 'Deliverables:' in line):
                deliverables_text = re.sub(r'\*\*Deliverables:\*\*|Deliverables:', '', line).strip()
                if deliverables_text and deliverables_text.lower() != "deliverables not specified":
                    current_task["deliverables"] = deliverables_text
                    
            # Parse multi-line content for metrics and deliverables (when they span multiple lines)
            elif current_task and line.startswith('- ') and len(line.strip()) > 2:
                # Check if we're in a section that should collect bullet points
                if "success_metrics" in current_task and isinstance(current_task["success_metrics"], str):
                    # Convert to list and add this item
                    if not hasattr(current_task, '_success_metrics_list'):
                        current_task["_success_metrics_list"] = [current_task["success_metrics"]]
                    current_task["_success_metrics_list"].append(line.strip()[2:])  # Remove "- "
                elif "deliverables" in current_task and isinstance(current_task["deliverables"], str):
                    # Convert to list and add this item
                    if not hasattr(current_task, '_deliverables_list'):
                        current_task["_deliverables_list"] = [current_task["deliverables"]]
                    current_task["_deliverables_list"].append(line.strip()[2:])  # Remove "- "
                    
            # Add to description if it's part of task content
            elif current_task and line and not line.startswith('#'):
                if current_task["description"]:
                    current_task["description"] += " " + line
                else:
                    current_task["description"] = line
        
        # Add the last task
        if current_task:
            # Process any temporary lists
            if hasattr(current_task, '_success_metrics_list'):
                current_task["success_metrics"] = current_task["_success_metrics_list"]
                del current_task["_success_metrics_list"]
            if hasattr(current_task, '_deliverables_list'):
                current_task["deliverables"] = current_task["_deliverables_list"]
                del current_task["_deliverables_list"]
            tasks.append(current_task)
        
        # Process all tasks to finalize list fields and apply intelligent inference
        for task in tasks:
            # Handle temporary list fields
            if hasattr(task, '_success_metrics_list'):
                task["success_metrics"] = task["_success_metrics_list"]
                del task["_success_metrics_list"]
            if hasattr(task, '_deliverables_list'):
                task["deliverables"] = task["_deliverables_list"]
                del task["_deliverables_list"]
            
            # Apply intelligent inference for missing fields
            if task.get('_needs_inference'):
                inferred = self.infer_task_metadata(task.get('title', ''), task.get('description', ''))
                
                # Only add inferred data if the field is empty/missing
                if not task.get('category'):
                    task['category'] = inferred.get('category')
                
                if not task.get('dependencies') or task.get('dependencies') == []:
                    task['dependencies'] = inferred.get('dependencies', [])
                
                if not task.get('required_skills') or task.get('required_skills') == []:
                    task['required_skills'] = inferred.get('required_skills', [])
                
                if not task.get('success_metrics') or task.get('success_metrics') == []:
                    task['success_metrics'] = inferred.get('success_metrics', [])
                
                if not task.get('deliverables') or task.get('deliverables') == []:
                    task['deliverables'] = inferred.get('deliverables', [])
                
                if not task.get('definition_of_done'):
                    task['definition_of_done'] = inferred.get('definition_of_done')
                
                # Clean up the inference flag
                del task['_needs_inference']
        
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
                # Debug: Check what data we have
                print(f"DEBUG: Creating task '{task_data.get('title')}'")
                print(f"DEBUG: Dependencies: {task_data.get('dependencies')}")
                print(f"DEBUG: Required skills: {task_data.get('required_skills')}")
                print(f"DEBUG: Category: {task_data.get('category')}")
                
                # Convert parsed task to TaskCreate schema
                task_create = TaskCreate(
                    title=task_data.get("title", ""),
                    description=task_data.get("description", ""),
                    priority=task_data.get("priority", "medium"),
                    category=task_data.get("category"),
                    impact_points=task_data.get("impact_points", 100),
                    estimated_hours=task_data.get("estimated_hours"),
                    required_skills=task_data.get("required_skills", []),
                    dependencies=task_data.get("dependencies", []),
                    definition_of_done=task_data.get("definition_of_done"),
                    success_metrics=task_data.get("success_metrics"),
                    deliverables=task_data.get("deliverables")
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