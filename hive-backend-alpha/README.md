# HIVE Backend Alpha

Streamlined task management and collaboration platform - Alpha version for internal testing.

## Features

- User authentication (registration/login) with JWT tokens
- Task management (CRUD operations)
- Task assignment and status workflow
- Real-time updates via WebSockets
- Dashboard analytics with task and user statistics
- Live user status tracking (online/offline)
- Background job processing with Celery
- Database migrations with Alembic
- Comprehensive testing suite (unit, integration, performance, security)
- RESTful API with FastAPI
- PostgreSQL database with async SQLAlchemy

## Prerequisites

- Python 3.11+
- Poetry
- Docker and Docker Compose
- PostgreSQL (via Docker)

## Quick Start

1. **Clone and setup the project:**
   ```bash
   cd hive-backend-alpha
   poetry install
   ```

2. **Copy environment file:**
   ```bash
   cp .env.example .env
   ```

3. **Start services with Docker Compose:**
   ```bash
   docker-compose up -d
   ```

4. **Initialize the database:**
   ```bash
   poetry run python scripts/init_db.py
   ```

5. **Start Celery worker (in a separate terminal):**
   ```bash
   poetry run celery -A app.workers.celery_app worker --loglevel=info
   ```

6. **Run the application:**
   ```bash
   poetry run uvicorn app.main:app --reload
   ```

The API will be available at `http://localhost:8000`

## API Documentation

- Interactive API docs: `http://localhost:8000/docs`
- ReDoc documentation: `http://localhost:8000/redoc`

## API Endpoints

### Health Check
- `GET /health` - Health check endpoint

### Authentication
- `POST /api/v1/auth/register` - Register a new user
- `POST /api/v1/auth/login` - Login and get access token

### Users
- `GET /api/v1/users/me` - Get current user profile
- `PUT /api/v1/users/me` - Update current user profile

### Tasks
- `POST /api/v1/tasks/` - Create a new task
- `GET /api/v1/tasks/` - List all tasks
- `GET /api/v1/tasks/{task_id}` - Get specific task
- `PUT /api/v1/tasks/{task_id}` - Update task (owner only)
- `DELETE /api/v1/tasks/{task_id}` - Delete task (owner only)
- `POST /api/v1/tasks/{task_id}/assign` - Assign task to user (owner only)
- `PUT /api/v1/tasks/{task_id}/status` - Update task status (owner/assignee)

### Dashboard
- `GET /api/v1/dashboard/summary` - Comprehensive dashboard statistics
- `GET /api/v1/dashboard/live-status` - Real-time status indicators
- `GET /api/v1/dashboard/online-users` - List of currently online users

### WebSocket
- `WS /api/v1/ws?token={jwt_token}` - Real-time communication

## Testing

Run the complete test suite:
```bash
poetry run python scripts/run_tests.py
```

Run specific test categories:
```bash
# Unit tests only
poetry run python scripts/run_tests.py --unit

# Integration tests only  
poetry run python scripts/run_tests.py --integration

# With coverage report
poetry run python scripts/run_tests.py --coverage

# Performance tests
poetry run python scripts/run_tests.py --performance

# Security tests
poetry run python scripts/run_tests.py --security
```

Run performance benchmarks:
```bash
poetry run python tests/performance/basic_api_benchmark.py
```

Run security tests:
```bash
poetry run python tests/security/simple_auth_test.py
```

## Manual Testing Examples

### 1. Register a user:
```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{"email": "alpha@example.com", "password": "SecureAlphaPassword123!"}' \
  http://localhost:8000/api/v1/auth/register
```

### 2. Login:
```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{"email": "alpha@example.com", "password": "SecureAlphaPassword123!"}' \
  http://localhost:8000/api/v1/auth/login
```

### 3. Create a task (use token from login response):
```bash
curl -X POST -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title": "Test Task", "description": "Test description"}' \
  http://localhost:8000/api/v1/tasks/
```

### 4. Assign a task:
```bash
curl -X POST -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"user_id": "USER_ID_TO_ASSIGN"}' \
  http://localhost:8000/api/v1/tasks/TASK_ID/assign
```

### 5. Update task status:
```bash
curl -X PUT -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "completed"}' \
  http://localhost:8000/api/v1/tasks/TASK_ID/status
```

### 6. Get dashboard summary:
```bash
curl http://localhost:8000/api/v1/dashboard/summary
```

### 7. Get live status:
```bash
curl http://localhost:8000/api/v1/dashboard/live-status
```

### 8. WebSocket connection (JavaScript):
```javascript
const ws = new WebSocket('ws://localhost:8000/api/v1/ws?token=YOUR_TOKEN');
ws.onmessage = (event) => console.log('Received:', event.data);
ws.send(JSON.stringify({
  "type": "chat_message", 
  "payload": {"message": "Hello!"}
}));
```

## Database Management

Generate a new migration:
```bash
poetry run python scripts/run_migrations.py generate "description_of_changes"
```

Apply migrations:
```bash
poetry run python scripts/run_migrations.py
```

## Background Jobs

The application uses Celery for background job processing. Available tasks:
- `test_celery_task`: Simple test task
- `send_notification_task`: Send notifications to users
- `process_task_assignment`: Process task assignment notifications
- `cleanup_old_data`: Periodic data cleanup

## Project Structure

```
hive-backend-alpha/
├── app/
│   ├── api/                 # API routes
│   ├── core/                # Core utilities (auth, security)
│   ├── models/              # SQLAlchemy models
│   ├── schemas/             # Pydantic schemas
│   ├── services/            # Business logic
│   ├── websockets/          # WebSocket connection management
│   ├── workers/             # Celery background tasks
│   ├── config.py            # Configuration
│   ├── database.py          # Database setup
│   ├── dependencies.py     # FastAPI dependencies
│   └── main.py              # FastAPI application
├── tests/
│   ├── unit/                # Unit tests
│   ├── integration/         # Integration tests
│   ├── performance/         # Performance benchmarks
│   ├── security/            # Security tests
│   └── utils/               # Test utilities
├── migrations/              # Alembic migrations
├── scripts/                 # Utility scripts
└── pyproject.toml           # Poetry configuration
```

## Development

This is an alpha version focused on core functionality and rapid development. The codebase follows the "Peter Mick Rule" - write code as if the maintainer is a violent psychopath who knows where you live.

## Next Steps

This alpha version provides the foundation for:
- Task workflow and real-time updates (Alpha 1.1)
- Infrastructure and comprehensive testing (Alpha 1.2)  
- Dashboard analytics and live status (Alpha 1.3)