"""
Master Plan Ingestion System

This module handles the parsing and ingestion of master plans into the HIVE system.
It supports Markdown format initially, with planned support for PDF, Word, and plain text.

Hierarchy:
- Masterplan -> Waypoints -> Projects -> Tasks -> Subtasks
- Projects have DoDs and team-defined OKRs
- Tasks have auto-generated milestones
- Task complexity must be <= 6/10
"""

import re
import json
import hashlib
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass, field


@dataclass
class Waypoint:
    """Strategic checkpoints in the master plan"""
    id: str
    name: str
    description: str
    order: int
    target_date: Optional[str] = None
    project_ids: List[str] = field(default_factory=list)


@dataclass
class ParsedProject:
    """Represents a project extracted from the master plan"""
    id: str
    name: str
    description: str
    definition_of_done: List[str]
    waypoint_id: Optional[str] = None
    suggested_okrs: List[Dict[str, Any]] = field(default_factory=list)
    raw_content: str = ""


@dataclass
class ParsedTask:
    """Represents a task extracted from a project"""
    id: str
    title: str
    description: str
    project_id: str
    complexity_score: Optional[float] = None
    estimated_hours: Optional[int] = None
    dependencies: List[str] = field(default_factory=list)
    raw_content: str = ""


@dataclass
class ParsedSubtask:
    """Represents a subtask for complex tasks"""
    id: str
    title: str
    description: str
    parent_task_id: str
    order: int


@dataclass
class GeneratedMilestone:
    """Auto-generated milestone for a task"""
    id: str
    title: str
    description: str
    task_id: str
    order: int
    acceptance_criteria: List[str]


class MasterPlanParser:
    """Parses master plan documents and extracts hierarchical structure"""
    
    def __init__(self):
        self.waypoints: List[Waypoint] = []
        self.projects: List[ParsedProject] = []
        self.tasks: List[ParsedTask] = []
        self.subtasks: List[ParsedSubtask] = []
        self.milestones: List[GeneratedMilestone] = []
        
    def parse_markdown(self, content: str) -> Dict[str, Any]:
        """
        Parse a markdown master plan document.
        
        Expected structure:
        # Master Plan Title
        ## Waypoint: Name
        ### Project: Name
        #### Task: Name
        """
        # Reset collections
        self.waypoints = []
        self.projects = []
        self.tasks = []
        self.subtasks = []
        self.milestones = []
        
        # Parse markdown structure
        lines = content.split('\n')
        current_waypoint = None
        current_project = None
        current_task = None
        
        i = 0
        while i < len(lines):
            line = lines[i].strip()
            
            # Skip empty lines
            if not line:
                i += 1
                continue
                
            # Detect waypoint (## Waypoint: ...)
            if line.startswith('## Waypoint:') or line.startswith('## WP:'):
                waypoint_name = line.split(':', 1)[1].strip()
                current_waypoint = self._create_waypoint(waypoint_name)
                self.waypoints.append(current_waypoint)
                current_project = None
                current_task = None
                
            # Detect project (### Project: ... or ### ...)
            elif line.startswith('### '):
                project_text = line[4:].strip()
                if project_text.startswith('Project:'):
                    project_name = project_text.split(':', 1)[1].strip()
                else:
                    project_name = project_text
                    
                # Collect project content until next heading
                project_content, next_line = self._collect_content_until_heading(lines, i + 1)
                current_project = self._create_project(
                    project_name, 
                    project_content,
                    current_waypoint.id if current_waypoint else None
                )
                self.projects.append(current_project)
                
                if current_waypoint:
                    current_waypoint.project_ids.append(current_project.id)
                    
                current_task = None
                i = next_line - 1
                
            # Detect task (#### Task: ... or #### ...)
            elif line.startswith('#### ') and current_project:
                task_text = line[5:].strip()
                if task_text.startswith('Task:'):
                    task_name = task_text.split(':', 1)[1].strip()
                else:
                    task_name = task_text
                    
                # Collect task content
                task_content, next_line = self._collect_content_until_heading(lines, i + 1)
                current_task = self._create_task(
                    task_name,
                    task_content,
                    current_project.id
                )
                self.tasks.append(current_task)
                i = next_line - 1
                
            i += 1
            
        # Post-processing
        self._analyze_task_complexity()
        self._generate_subtasks_for_complex_tasks()
        self._generate_milestones()
        
        return self._compile_results()
        
    def _collect_content_until_heading(self, lines: List[str], start_idx: int) -> Tuple[str, int]:
        """Collect content lines until the next heading is found"""
        content_lines = []
        i = start_idx
        
        while i < len(lines):
            line = lines[i]
            # Stop at next heading
            if line.strip().startswith('#'):
                break
            content_lines.append(line)
            i += 1
            
        return '\n'.join(content_lines).strip(), i
        
    def _create_waypoint(self, name: str) -> Waypoint:
        """Create a waypoint object"""
        waypoint_id = self._generate_id(f"waypoint_{name}")
        return Waypoint(
            id=waypoint_id,
            name=name,
            description=f"Strategic checkpoint: {name}",
            order=len(self.waypoints) + 1
        )
        
    def _create_project(self, name: str, content: str, waypoint_id: Optional[str]) -> ParsedProject:
        """Create a project object from parsed content"""
        project_id = self._generate_id(f"project_{name}")
        
        # Extract DoD if present
        dod = self._extract_definition_of_done(content)
        
        # Suggest OKRs based on project content
        suggested_okrs = self._suggest_okrs(name, content)
        
        return ParsedProject(
            id=project_id,
            name=name,
            description=self._extract_description(content),
            definition_of_done=dod,
            waypoint_id=waypoint_id,
            suggested_okrs=suggested_okrs,
            raw_content=content
        )
        
    def _create_task(self, name: str, content: str, project_id: str) -> ParsedTask:
        """Create a task object from parsed content"""
        task_id = self._generate_id(f"task_{project_id}_{name}")
        
        # Extract dependencies if mentioned
        dependencies = self._extract_dependencies(content)
        
        return ParsedTask(
            id=task_id,
            title=name,
            description=self._extract_description(content),
            project_id=project_id,
            dependencies=dependencies,
            raw_content=content
        )
        
    def _extract_definition_of_done(self, content: str) -> List[str]:
        """Extract DoD criteria from content"""
        dod = []
        
        # Look for "Definition of Done:", "DoD:", or "Completion Criteria:"
        patterns = [
            r'Definition of Done:(.*?)(?=\n\n|\n#|$)',
            r'DoD:(.*?)(?=\n\n|\n#|$)',
            r'Completion Criteria:(.*?)(?=\n\n|\n#|$)'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, content, re.IGNORECASE | re.DOTALL)
            if match:
                dod_text = match.group(1).strip()
                # Extract bullet points or numbered items
                items = re.findall(r'[-*•]\s*(.+)|^\d+\.\s*(.+)', dod_text, re.MULTILINE)
                for item in items:
                    text = item[0] if item[0] else item[1]
                    if text.strip():
                        dod.append(text.strip())
                break
                
        # If no explicit DoD found, generate basic criteria
        if not dod:
            dod = [
                "All specified functionality implemented",
                "Tests written and passing",
                "Documentation updated",
                "Code reviewed and approved"
            ]
            
        return dod
        
    def _suggest_okrs(self, project_name: str, content: str) -> List[Dict[str, Any]]:
        """Suggest OKRs based on project content"""
        # This is a simplified version - in production, this could use AI
        objectives = []
        
        # Extract potential objectives from content
        if "performance" in content.lower():
            objectives.append({
                "objective": f"Optimize {project_name} performance",
                "key_results": [
                    "Reduce processing time by 50%",
                    "Handle 10x current load",
                    "Achieve 99.9% uptime"
                ]
            })
            
        if "user" in content.lower() or "experience" in content.lower():
            objectives.append({
                "objective": f"Enhance user experience in {project_name}",
                "key_results": [
                    "Achieve 90% user satisfaction score",
                    "Reduce user-reported issues by 75%",
                    "Increase feature adoption by 50%"
                ]
            })
            
        # Default objective if none found
        if not objectives:
            objectives.append({
                "objective": f"Successfully deliver {project_name}",
                "key_results": [
                    "Complete all defined tasks on schedule",
                    "Meet all acceptance criteria",
                    "Zero critical bugs in production"
                ]
            })
            
        return objectives
        
    def _extract_dependencies(self, content: str) -> List[str]:
        """Extract task dependencies from content"""
        dependencies = []
        
        # Look for various dependency patterns including markdown bold format
        patterns = [
            r'\*\*Dependencies:\*\*(.*?)(?=\n\n|\n#|$)',
            r'Dependencies:(.*?)(?=\n\n|\n#|$)',
            r'Depends on:(.*?)(?=\n\n|\n#|$)',
            r'Prerequisites:(.*?)(?=\n\n|\n#|$)',
            r'Requires:(.*?)(?=\n\n|\n#|$)'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, content, re.IGNORECASE | re.DOTALL)
            if match:
                dep_text = match.group(1).strip()
                
                # Handle different dependency formats
                if ' - ' in dep_text:
                    # Handle inline format: "- Research existing parsing libraries - Establish file upload infrastructure"
                    items = [item.strip() for item in dep_text.split(' - ') if item.strip()]
                    dependencies.extend(items)
                else:
                    # Handle list format with bullets or numbers
                    items = re.findall(r'[-*•]\s*(.+)|^\d+\.\s*(.+)', dep_text, re.MULTILINE)
                    for item in items:
                        text = item[0] if item[0] else item[1]
                        if text.strip():
                            dependencies.append(text.strip())
                break
                
        return dependencies
        
    def _extract_description(self, content: str) -> str:
        """Extract clean description from content"""
        # Remove special sections including markdown bold dependencies
        clean_content = re.sub(
            r'(\*\*Dependencies:\*\*|Dependencies:|Definition of Done:|DoD:|Completion Criteria:|Depends on:|Prerequisites:|Requires:).*?(?=\n\n|\n#|$)',
            '',
            content,
            flags=re.IGNORECASE | re.DOTALL
        )
        
        # Clean up whitespace
        clean_content = '\n'.join(line for line in clean_content.split('\n') if line.strip())
        
        return clean_content.strip() or "No description provided"
        
    def _analyze_task_complexity(self):
        """Analyze complexity of all tasks"""
        for task in self.tasks:
            # Simple heuristic-based complexity scoring
            complexity = 3.0  # Base complexity
            
            # Increase complexity based on various factors
            if len(task.dependencies) > 0:
                complexity += min(len(task.dependencies) * 0.5, 2.0)
                
            # Word count as proxy for complexity
            word_count = len(task.description.split())
            if word_count > 100:
                complexity += 1.0
            if word_count > 200:
                complexity += 1.0
                
            # Look for complexity indicators
            complex_keywords = [
                'integrate', 'refactor', 'architect', 'optimize',
                'scale', 'distributed', 'concurrent', 'security',
                'performance', 'migration', 'upgrade', 'redesign'
            ]
            
            description_lower = task.description.lower()
            for keyword in complex_keywords:
                if keyword in description_lower:
                    complexity += 0.5
                    
            # Cap at 10
            task.complexity_score = min(complexity, 10.0)
            
    def _generate_subtasks_for_complex_tasks(self):
        """Break down tasks with complexity > 6 into subtasks"""
        for task in self.tasks:
            if task.complexity_score and task.complexity_score > 6:
                subtasks = self._break_down_task(task)
                self.subtasks.extend(subtasks)
                
    def _break_down_task(self, task: ParsedTask) -> List[ParsedSubtask]:
        """Break down a complex task into subtasks"""
        subtasks = []
        
        # Common subtask patterns
        subtask_templates = [
            ("Research and Planning", "Research requirements and create implementation plan"),
            ("Setup and Configuration", "Set up development environment and initial configuration"),
            ("Core Implementation", "Implement main functionality"),
            ("Testing", "Write and execute tests"),
            ("Documentation", "Create or update documentation"),
            ("Review and Refinement", "Code review and refinements")
        ]
        
        # Adjust number of subtasks based on complexity
        num_subtasks = min(int(task.complexity_score), len(subtask_templates))
        
        for i in range(num_subtasks):
            template = subtask_templates[i]
            subtask_id = self._generate_id(f"subtask_{task.id}_{i}")
            
            subtask = ParsedSubtask(
                id=subtask_id,
                title=f"{template[0]} - {task.title}",
                description=template[1],
                parent_task_id=task.id,
                order=i + 1
            )
            subtasks.append(subtask)
            
        return subtasks
        
    def _generate_milestones(self):
        """Generate milestones for all tasks"""
        for task in self.tasks:
            milestones = self._create_milestones_for_task(task)
            self.milestones.extend(milestones)
            
    def _create_milestones_for_task(self, task: ParsedTask) -> List[GeneratedMilestone]:
        """Create milestones for a specific task"""
        milestones = []
        
        # Determine number of milestones based on complexity
        if task.complexity_score:
            if task.complexity_score <= 3:
                num_milestones = 1
            elif task.complexity_score <= 6:
                num_milestones = 2
            else:
                num_milestones = 3
        else:
            num_milestones = 1
            
        # Generate milestones
        milestone_templates = [
            ("Initial Implementation", [
                "Basic functionality implemented",
                "Core logic in place",
                "Manual testing successful"
            ]),
            ("Feature Complete", [
                "All requirements implemented",
                "Automated tests written",
                "Edge cases handled"
            ]),
            ("Production Ready", [
                "Performance optimized",
                "Security review completed",
                "Documentation finalized"
            ])
        ]
        
        for i in range(num_milestones):
            template = milestone_templates[min(i, len(milestone_templates) - 1)]
            milestone_id = self._generate_id(f"milestone_{task.id}_{i}")
            
            milestone = GeneratedMilestone(
                id=milestone_id,
                title=f"{template[0]} - {task.title}",
                description=f"Milestone {i + 1} of {num_milestones} for task completion",
                task_id=task.id,
                order=i + 1,
                acceptance_criteria=template[1]
            )
            milestones.append(milestone)
            
        return milestones
        
    def _generate_id(self, base: str) -> str:
        """Generate a unique ID based on content"""
        # Use hash for consistent IDs
        hash_input = f"{base}_{datetime.now().isoformat()}"
        return hashlib.md5(hash_input.encode()).hexdigest()[:12]
        
    def _compile_results(self) -> Dict[str, Any]:
        """Compile all parsed data into a structured result"""
        return {
            "summary": {
                "waypoints_count": len(self.waypoints),
                "projects_count": len(self.projects),
                "tasks_count": len(self.tasks),
                "subtasks_count": len(self.subtasks),
                "milestones_count": len(self.milestones),
                "complex_tasks_count": len([t for t in self.tasks if t.complexity_score and t.complexity_score > 6])
            },
            "waypoints": [vars(w) for w in self.waypoints],
            "projects": [vars(p) for p in self.projects],
            "tasks": [vars(t) for t in self.tasks],
            "subtasks": [vars(s) for s in self.subtasks],
            "milestones": [vars(m) for m in self.milestones]
        }


# Integration functions for use with Claude's taskmaster AI
async def analyze_with_taskmaster_ai(task_content: str) -> float:
    """
    Integrate with Claude's taskmaster AI for more sophisticated complexity analysis.
    This is a placeholder for the actual integration.
    """
    # TODO: Integrate with Claude's existing taskmaster functionality
    # For now, return a default score
    return 5.0


def validate_master_plan(content: str) -> List[str]:
    """Validate master plan content before parsing"""
    errors = []
    
    if not content.strip():
        errors.append("Master plan content is empty")
        
    # Check for basic structure
    if not any(line.startswith('#') for line in content.split('\n')):
        errors.append("No markdown headings found in master plan")
        
    # Check minimum content
    if len(content.split()) < 50:
        errors.append("Master plan seems too short (less than 50 words)")
        
    return errors