# HIVE Project Context

## 🎯 What HIVE Actually Is

HIVE is a **task coordination platform** based on the multi-agent framework:
```
Prime Directive → OKRs → Projects → Tasks
```

The goal is to make the user "redundant as a project coordinator" through intelligent task management and real-time collaboration.

## 🏗️ Current Architecture

### Frontend (Your Responsibility)
- **Vanilla JavaScript** - No React/Vue frameworks
- **Static HTML/CSS/JS** files served simply
- **Zod validation** for API contract compliance
- **Real-time updates** via WebSocket connections

### Backend (Already Built)
- **FastAPI** with comprehensive API at localhost:8000
- **Real database persistence** (not localStorage)
- **JWT authentication** with proper token management
- **WebSocket endpoints** for real-time collaboration
- **API documentation** at http://localhost:8000/docs

### Environment
- **WSL development** with dynamic IP detection
- **Environment variables** managed by dev-connect.sh
- **No Docker** complexity (despite what old docs say)

## 🎨 UI Framework Reference

Based on the HTML template provided:
- Clean, modern design with green (#4caf50) accent colors
- Card-based task layout with priority indicators
- Real-time status indicators for users and tasks
- Mobile-responsive grid layout
- Professional dashboard aesthetic

## 📊 Core Features Required

### Task Management
- Create, read, update, delete tasks via real API
- Task assignment to real users
- Status workflow (todo → in_progress → completed)
- Priority levels (urgent, high, medium, low)
- Real task persistence in backend database

### Real-time Collaboration  
- Live task updates via WebSocket
- User online/offline status
- Real-time notifications
- Multi-user task editing
- Live dashboard updates

### Dashboard Analytics
- Task completion statistics
- User activity metrics
- Real-time status indicators
- Impact scoring system
- Team coordination metrics

### Authentication & Users
- JWT-based login/registration
- User profile management
- Permission-based task access
- Session management
- Real user directory

## 🚫 What HIVE Is NOT

- Not a simple todo app (it's collaborative)
- Not a prototype (it needs production-quality code)
- Not a demo (real functionality required)
- Not using localStorage (real database persistence)
- Not using Docker (despite old documentation)

## 🎯 Success Definition

HIVE is successful when:
- Multiple users can collaborate on tasks in real-time
- Task changes sync instantly across all connected clients
- Data persists properly in backend database
- Authentication works correctly with real sessions
- UI feels responsive and professional
- No fake functionality or mocking

## 🔧 Technical Constraints

### Must Work With:
- WSL networking (dynamic IPs)
- Environment variables from dev-connect.sh
- Existing FastAPI backend structure
- Real browser WebSocket connections
- JWT token authentication flow

### Cannot Use:
- Docker deployment (not in current setup)
- localStorage as primary storage
- Fake WebSocket polling
- Hardcoded IP addresses
- Mock API responses

## 🎮 User Experience Goals

Users should feel like they're using a **professional collaboration tool**, not a basic todo app. The interface should be:
- Responsive and fast
- Visually appealing
- Collaborative (multiple users visible)
- Real-time (instant updates)
- Reliable (no fake functionality)

Think Asana/Trello quality, not hobby project quality.

---

*This context ensures Claude Code understands HIVE's scope and builds accordingly.*