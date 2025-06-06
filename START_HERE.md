# 🚀 HIVE - Start Here

**Complete task coordination platform with real-time collaboration features**

## 🎯 What is HIVE?

HIVE is a modern task management and collaboration platform designed for teams that need real-time coordination. It features a FastAPI backend with WebSocket support and a responsive frontend interface.

## ⚡ Quick Start (5 minutes)

### 1. Start the Backend
```bash
cd hive-backend-alpha
poetry install
docker-compose up -d
poetry run python scripts/init_db.py
```

**Terminal 1** - Celery Worker:
```bash
poetry run celery -A app.workers.celery_app worker --loglevel=info
```

**Terminal 2** - API Server:
```bash
poetry run uvicorn app.main:app --reload
```

### 2. Start the Frontend
**Terminal 3** - Frontend Server:
```bash
cd hive-frontend
python server.py
```

### 3. Access the Application
🌐 **Open**: http://localhost:3000

## 📋 System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Database      │
│                 │    │                 │    │                 │
│ • HTML/CSS/JS   │◄──►│ • FastAPI       │◄──►│ • PostgreSQL    │
│ • Real-time UI  │    │ • WebSocket     │    │ • Redis         │
│ • Responsive    │    │ • Celery        │    │ • Alembic       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🔥 Key Features

### 🔐 **Authentication**
- JWT-based secure login/register
- Session management with token refresh
- User profile management

### 📋 **Task Management**
- Create, edit, delete tasks
- Task assignment workflow
- Status progression: Draft → Available → In Progress → Completed
- Real-time task updates

### ⚡ **Real-time Features**
- WebSocket connections for live updates
- Online user tracking
- Instant task status changes
- Live dashboard statistics

### 👥 **Team Coordination**
- View online team members
- Task assignment and collaboration
- Team status indicators

### 📊 **Dashboard Analytics**
- Live task statistics
- User activity metrics
- Collective impact tracking
- Real-time data visualization

## 🛠 Technical Stack

### Backend
- **FastAPI** - Modern Python web framework
- **PostgreSQL** - Robust relational database
- **Redis** - In-memory data structure store
- **Celery** - Distributed task queue
- **WebSocket** - Real-time communication
- **Alembic** - Database migrations
- **Pytest** - Comprehensive testing

### Frontend
- **Vanilla JavaScript** - Zero dependencies
- **CSS Grid/Flexbox** - Modern responsive layouts
- **WebSocket API** - Real-time connectivity
- **REST API** - Full backend integration

## 📁 Project Structure

```
task-dashboard/
├── hive-backend-alpha/          # Backend API & services
│   ├── app/
│   │   ├── api/                 # REST API endpoints
│   │   ├── models/              # Database models
│   │   ├── services/            # Business logic
│   │   ├── websockets/          # Real-time features
│   │   └── workers/             # Background tasks
│   ├── tests/                   # Test suite
│   ├── migrations/              # Database migrations
│   └── scripts/                 # Utility scripts
├── hive-frontend/               # Frontend interface
│   ├── index.html               # Main interface
│   ├── app.js                   # Application logic
│   ├── api.js                   # Backend integration
│   ├── websocket.js             # Real-time features
│   └── styles.css               # UI styling
├── project-docs/                # Original specifications
└── DEPLOYMENT_GUIDE.md          # Production deployment
```

## 🎮 Usage Guide

### First Time Setup
1. **Register** a new account at http://localhost:3000
2. **Login** with your credentials
3. **Create tasks** using the "+" button
4. **Assign tasks** to yourself or team members
5. **Update status** as work progresses

### Task Workflow
```
Draft ──► Available ──► In Progress ──► Completed
  │           │             │            │
  └─────── Owner ──────── Assignee ──────┘
```

### Real-time Features
- **Live Updates**: Changes appear instantly across all connected users
- **Online Status**: See who's currently active
- **Dashboard Stats**: Real-time metrics and analytics
- **Connection Status**: Monitor WebSocket connection health

## 🧪 Testing

### Backend Tests
```bash
cd hive-backend-alpha

# Run all tests
poetry run python scripts/run_tests.py

# Run specific test categories
poetry run python scripts/run_tests.py --unit
poetry run python scripts/run_tests.py --integration
poetry run python scripts/run_tests.py --performance
poetry run python scripts/run_tests.py --security
```

### Manual Testing
```bash
# API Health Check
curl http://localhost:8000/health

# Register User
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123"}'

# Dashboard Statistics
curl http://localhost:8000/api/v1/dashboard/summary
```

## 🔧 Development

### Backend Development
```bash
cd hive-backend-alpha

# Install dependencies
poetry install

# Generate migration
poetry run python scripts/run_migrations.py generate "description"

# Apply migrations
poetry run python scripts/run_migrations.py

# Run development server
poetry run uvicorn app.main:app --reload --host 0.0.0.0
```

### Frontend Development
```bash
cd hive-frontend

# Start development server
python server.py

# The server includes:
# - CORS headers for API integration
# - Live reload on file changes
# - Error handling and logging
```

## 📊 Monitoring

### Health Checks
- **Backend**: http://localhost:8000/health
- **Frontend**: http://localhost:3000
- **Database**: Check Docker container status
- **WebSocket**: Connection indicator in UI

### Performance Monitoring
```bash
# API performance benchmark
cd hive-backend-alpha
poetry run python tests/performance/basic_api_benchmark.py

# Security tests
poetry run python tests/security/simple_auth_test.py
```

## 🚀 Production Deployment

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for complete production setup instructions including:
- Docker deployment
- Traditional server setup
- SSL configuration
- Monitoring and logging
- Backup strategies
- Performance optimization

## 🤝 API Documentation

### Interactive API Docs
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Key Endpoints
```
# Authentication
POST /api/v1/auth/register
POST /api/v1/auth/login

# Tasks
GET    /api/v1/tasks/
POST   /api/v1/tasks/
PUT    /api/v1/tasks/{id}
DELETE /api/v1/tasks/{id}
POST   /api/v1/tasks/{id}/assign
PUT    /api/v1/tasks/{id}/status

# Dashboard
GET /api/v1/dashboard/summary
GET /api/v1/dashboard/live-status
GET /api/v1/dashboard/online-users

# WebSocket
WS /api/v1/ws?token={jwt_token}
```

## 🎯 What's Next?

### Immediate Use
✅ **Ready to use**: Complete working system  
✅ **Team coordination**: Invite team members  
✅ **Task management**: Start creating and managing tasks  
✅ **Real-time collaboration**: Experience live updates  

### Future Enhancements
- 📱 Mobile app development
- 📎 File attachment support
- 📧 Email notifications
- 🔍 Advanced search and filtering
- 📈 Enhanced analytics and reporting
- 🌍 Multi-language support

## ❓ Troubleshooting

### Common Issues

**Backend not starting**:
- Check PostgreSQL/Redis containers: `docker-compose ps`
- Verify database connection: `poetry run python scripts/init_db.py`

**Frontend not connecting**:
- Ensure backend is running on port 8000
- Check browser console for errors
- Verify WebSocket connection status

**Database issues**:
- Reset database: `docker-compose down -v && docker-compose up -d`
- Run migrations: `poetry run alembic upgrade head`

### Getting Help
1. Check logs for error messages
2. Review API documentation at `/docs`
3. Test individual components
4. Verify configuration settings

---

**🎉 Welcome to HIVE! Start coordinating tasks with your team today.**