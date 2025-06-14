# HIVE Task Dashboard - API Contract

## Port Configuration

**ALWAYS USE THESE PORTS - DO NOT CHANGE:**

- **Frontend**: Port 3000 (http://localhost:3000)
- **Backend**: Port 8000 (http://localhost:8000)

## Startup Process

### 1. Kill Existing Processes
Always kill existing processes on these ports before starting:

```bash
# Kill processes on port 8000 (backend)
lsof -ti:8000 | xargs kill -9 2>/dev/null || true

# Kill processes on port 3000 (frontend) 
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
```

### 2. Start Services
Start in this order:

```bash
# Start backend (FastAPI with auto-reload)
cd /mnt/c/task-dashboard/hive-backend-alpha
python3 -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &

# Start frontend (port 3000)
cd /mnt/c/task-dashboard/hive-frontend
python3 -m http.server 3000 &
```

## API Configuration

### Frontend API Base URL
```javascript
const API_BASE_URL = 'http://localhost:8000';
const API_V1_URL = `${API_BASE_URL}/api/v1`;
```

### Backend Port Configuration
```python
PORT = int(os.getenv('BACKEND_PORT') or '8000')
```

## Key Endpoints

### Authentication
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/register` - User registration
- `GET /api/v1/users/me` - Get current user

### Tasks
- `GET /api/v1/tasks/` - List all tasks
- `POST /api/v1/tasks/` - Create new task
- `GET /api/v1/tasks/{id}` - Get specific task
- `PUT /api/v1/tasks/{id}/status` - Update task status
- `POST /api/v1/tasks/{id}/claim` - Claim task

### Milestones
- `POST /api/v1/milestones` - Create milestone
- `GET /api/v1/tasks/{id}/milestones` - Get task milestones

### Comments & Chat
- `GET /api/v1/comments/task/{id}` - Get task comments
- `POST /api/v1/comments/` - Create comment
- `GET /api/v1/chat/task/{id}/messages` - Get chat messages
- `POST /api/v1/chat/task/{id}/messages` - Send chat message

### Files
- `POST /api/v1/files/upload` - Upload file
- `GET /api/v1/files/task/{id}` - List task files
- `GET /api/v1/files/download/{id}` - Download file

### Help Requests
- `POST /api/v1/help-requests` - Create help request
- `POST /api/v1/help-requests/{id}/respond` - Respond to help request
- `DELETE /api/v1/help-requests/{id}` - Cancel help request

## Health Check
- `GET /health` - Backend health status

## CORS Configuration
Backend allows all origins for development:
- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS`
- `Access-Control-Allow-Headers: Content-Type, Authorization`

## Error Handling
All endpoints return JSON error responses:
```json
{
  "detail": "Error message here"
}
```

HTTP status codes:
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 404: Not Found
- 500: Internal Server Error