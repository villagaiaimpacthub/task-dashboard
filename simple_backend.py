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
        "definition_of_done": [
            {"id": 1, "text": "Site analysis completed with soil and water assessments", "completed": True},
            {"id": 2, "text": "Plant guild relationships mapped out", "completed": True}, 
            {"id": 3, "text": "CAD drawings finalized with measurements", "completed": False},
            {"id": 4, "text": "Cost estimate and timeline provided", "completed": False},
            {"id": 5, "text": "Sustainability impact assessment completed", "completed": False}
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
            # Simplified login - always successful for demo
            response = {
                "access_token": "demo-token-12345",
                "token_type": "bearer",
                "user": {
                    "id": "user1",
                    "email": data.get("email", "demo@example.com"),
                    "role": "Ecosystem Designer"
                }
            }
            self.send_json_response(response, 200)
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
                "status": "available",  # Changed from draft to available
                "priority": data.get("priority", "medium"),
                "category": data.get("category", ""),
                "impact_points": data.get("impact_points", 100),
                "estimated_hours": data.get("estimated_hours", ""),
                "location": data.get("location", ""),
                "team_size": data.get("team_size", ""),
                "due_date": data.get("due_date", ""),
                "required_skills": data.get("required_skills", []),
                "definition_of_done": dod_criteria,
                "owner_id": "user1",  # Simplified auth
                "assignee_id": None,
                "created_at": datetime.now().isoformat() + "Z",
                "updated_at": datetime.now().isoformat() + "Z"
            }
            tasks.append(new_task)
            self.send_json_response(new_task, 201)
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
        elif path.startswith('/api/v1/files/upload/'):
            # Upload file for a specific task
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
        elif path == '/api/v1/help-requests/':
            # Handle help request
            help_request = {
                "id": str(int(time.time())),
                "task_id": data.get("task_id", ""),
                "urgency": data.get("urgency", "medium"),
                "description": data.get("description", ""),
                "requester_id": "user1",  # Simplified auth
                "requester_email": "alice@example.com",
                "created_at": datetime.now().isoformat() + "Z",
                "status": "open"
            }
            # In a real system, this would trigger notifications to team members
            self.send_json_response({"message": "Help request sent to team", "request": help_request}, 201)
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