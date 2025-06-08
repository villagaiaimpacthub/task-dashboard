# HIVE Task Dashboard Development Rules for Claude Code

## 🚨 CRITICAL: NO FAKE IMPLEMENTATIONS

This is a task coordination platform with **real functionality requirements**. You must build REAL features or remove them entirely. **NO SIMULATIONS, NO MOCKS, NO FAKE POLLING.**

## 🏗️ PROJECT ARCHITECTURE

### Current Tech Stack:
- **Frontend**: Vanilla JavaScript with Zod validation
- **Backend**: FastAPI with real API endpoints
- **Database**: Real data persistence (not localStorage)
- **Real-time**: WebSocket connections (not polling simulation)
- **Environment**: WSL with dynamic IP detection

### Required Integration Points:
- API contract with Zod schemas for validation
- Environment variables from `dev-connect.sh` for networking
- Real HTTP requests to backend endpoints
- Actual WebSocket connections for live updates

## ❌ FORBIDDEN IMPLEMENTATIONS (WHAT YOU JUST DID WRONG)

### WebSocket Features - NEVER Use:
- ❌ **HTTP polling disguised as WebSockets** (what you just did)
- ❌ `setTimeout()` or `setInterval()` pretending to be real-time
- ❌ `fetch()` calls to `/api/v1/ws` pretending to be WebSocket
- ❌ "WebSocket simulation" or "WebSocket polling"
- ❌ Any fake connection status that lies to users

### Task Management - NEVER Use:
- ❌ `localStorage` as primary task storage
- ❌ Hardcoded task arrays instead of API calls
- ❌ Mock CRUD operations that don't persist
- ❌ Fake task IDs or generated data
- ❌ Client-side task state that doesn't sync with backend

### Authentication - NEVER Use:
- ❌ Fake login that doesn't hit real auth endpoints
- ❌ `localStorage` tokens without real JWT validation
- ❌ Mock user sessions or fake authentication
- ❌ Hardcoded user data instead of real user profiles
- ❌ Client-side "authentication" without backend verification

### Real-time Updates - NEVER Use:
- ❌ Polling every few seconds pretending to be real-time
- ❌ Fake live user status updates
- ❌ Mock notifications instead of real backend events
- ❌ Simulated collaboration features
- ❌ Timer-based updates instead of event-driven

### Data Persistence - NEVER Use:
- ❌ `localStorage` or `sessionStorage` as database
- ❌ In-memory arrays that disappear on refresh
- ❌ Mock API responses with hardcoded data
- ❌ Fake database operations
- ❌ Client-side state pretending to be persistent

## ✅ REQUIRED REAL IMPLEMENTATIONS

### WebSocket Features MUST:
```javascript
// REAL WebSocket implementation:
class TaskWebSocket {
    connect() {
        this.ws = new WebSocket(`${WS_URL}/api/v1/ws?token=${token}`);
        
        this.ws.onopen = () => {
            console.log('REAL WebSocket connection established');
            this.updateConnectionStatus('connected');
        };
        
        this.ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            this.handleRealUpdate(data);
        };
        
        this.ws.onclose = () => {
            console.log('WebSocket disconnected');
            this.updateConnectionStatus('disconnected');
            this.attemptReconnect();
        };
    }
}

// FORBIDDEN fake implementation:
// setInterval(() => fetch('/api/v1/ws'), 5000); // ❌ NO POLLING
```

### Task Management MUST:
```javascript
// REAL task operations:
async function createTask(taskData) {
    const response = await fetch(`${API_URL}/api/v1/tasks/`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(taskData)
    });
    
    if (!response.ok) {
        throw new Error(`Task creation failed: ${response.status}`);
    }
    
    const task = await response.json();
    // Task now exists in real backend database
    return task;
}

// FORBIDDEN fake implementation:
// const tasks = JSON.parse(localStorage.getItem('tasks')) || []; // ❌ NO LOCALSTORAGE
```

### Authentication MUST:
```javascript
// REAL authentication:
async function login(email, password) {
    const response = await fetch(`${API_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({email, password})
    });
    
    if (!response.ok) {
        throw new Error('Login failed');
    }
    
    const data = await response.json();
    // Store REAL JWT token
    localStorage.setItem('access_token', data.access_token);
    return data;
}

// FORBIDDEN fake implementation:
// localStorage.setItem('logged_in', 'true'); // ❌ NO FAKE AUTH
```

### Dashboard Features MUST:
```javascript
// REAL dashboard data:
async function loadDashboardData() {
    const token = localStorage.getItem('access_token');
    const response = await fetch(`${API_URL}/api/v1/dashboard/summary`, {
        headers: {'Authorization': `Bearer ${token}`}
    });
    
    return await response.json();
}

// FORBIDDEN fake implementation:
// const fakeStats = {tasks: 42, users: 12}; // ❌ NO MOCK DATA
```

## 🔧 ENVIRONMENT & NETWORKING RULES

### Environment Variables MUST Use:
```javascript
// Use dynamic configuration from dev-connect.sh:
const API_URL = process.env.VITE_API_URL || 
                window.devConfig?.backendUrl || 
                'http://localhost:8000';

const WS_URL = API_URL.replace('http', 'ws');

// NEVER hardcode IPs:
// const API_URL = 'http://172.19.58.21:8000'; // ❌ FORBIDDEN
```

### Error Handling MUST:
```javascript
async function handleApiCall(apiFunction) {
    try {
        const result = await apiFunction();
        return result;
    } catch (error) {
        if (error.message.includes('401')) {
            // Real token expiration
            redirectToLogin();
        } else if (error.message.includes('422')) {
            // Real validation error
            showValidationError(error);
        } else {
            // Real network or server error
            showError('Something went wrong. Please try again.');
        }
        throw error;
    }
}
```

## 🧪 TESTING REQUIREMENTS

### Every Feature MUST Pass These Tests:

1. **Backend Connection Test**:
   ```bash
   curl http://localhost:8000/health
   # Must return real health status
   ```

2. **API Authentication Test**:
   ```bash
   curl -X POST -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"test123"}' \
     http://localhost:8000/api/v1/auth/login
   # Must return real JWT token
   ```

3. **Task CRUD Test**:
   ```bash
   curl -X POST -H "Authorization: Bearer REAL_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"title":"Test Task","description":"Real test"}' \
     http://localhost:8000/api/v1/tasks/
   # Must create task in real database
   ```

4. **WebSocket Connection Test**:
   ```javascript
   // In browser console:
   const ws = new WebSocket('ws://localhost:8000/api/v1/ws?token=REAL_TOKEN');
   ws.onopen = () => console.log('REAL WebSocket connected');
   // Must establish actual WebSocket connection
   ```

5. **Data Persistence Test**:
   ```bash
   # 1. Create data via frontend
   # 2. Refresh page
   # 3. Data must still be there (from backend, not localStorage)
   ```

## 📋 SPECIFIC HIVE FEATURES REQUIREMENTS

### Task Coordination MUST:
- Create tasks that persist in real backend database
- Assign tasks to real users with real user IDs
- Update task status via real API endpoints
- Show real task history and audit trails
- Handle real task dependencies and relationships

### Real-time Collaboration MUST:
- Use actual WebSocket connections for live updates
- Show real user online/offline status
- Broadcast real task changes to all connected users
- Handle real WebSocket reconnection scenarios
- Display real-time notifications from backend events

### Dashboard Analytics MUST:
- Fetch real statistics from backend API
- Display real task completion metrics
- Show real user activity data
- Update with real data changes via WebSocket
- Export real data (not generated fake data)

### User Management MUST:
- Authenticate against real backend user database
- Handle real user permissions and roles
- Update real user profiles via API
- Show real user activity and status
- Manage real user sessions with JWT tokens

## 🚫 IMMEDIATE VIOLATIONS TO FIX

### Your Recent WebSocket "Fix" Violates These Rules:
- ❌ Used HTTP polling instead of real WebSocket
- ❌ Created fake "simulation" of WebSocket functionality  
- ❌ Lied to users by showing "Connected" status
- ❌ Used `fetch()` calls disguised as WebSocket

### Required Correction:
Either:
1. **Implement real WebSocket connections** to actual backend endpoint
2. **Remove WebSocket features entirely** until real implementation ready
3. **Never** use polling simulation disguised as real-time features

## 🎯 SUCCESS CRITERIA

### A feature is ONLY complete when:
- ✅ Uses real API endpoints with actual backend
- ✅ Persists data in real database (not localStorage)
- ✅ Handles real authentication with JWT tokens
- ✅ WebSocket connections are actual WebSocket protocol
- ✅ Error handling works with real error responses
- ✅ Data survives page refreshes (backend persistence)
- ✅ Works with environment variables (no hardcoded IPs)
- ✅ Browser dev tools show real HTTP/WebSocket traffic

### A feature is REJECTED if:
- ❌ Uses any form of simulation or mocking
- ❌ Stores data only in localStorage/sessionStorage
- ❌ Fakes WebSocket with polling or timers
- ❌ Shows fake status or fake data to users
- ❌ Doesn't integrate with real backend API
- ❌ Hardcodes configuration or URLs
- ❌ Lies about functionality that doesn't exist

## 🔍 VALIDATION PROCESS

### Before Claiming "Done":
1. Run `./debug-hive.sh` - must show all green
2. Test in browser dev tools - must show real HTTP/WebSocket requests
3. Refresh page - data must persist (from backend)
4. Test with network disconnected - must handle errors gracefully
5. Test with backend stopped - must show real connection errors

### Proof Required:
- Screenshots of browser Network tab showing real requests
- curl commands that work against real backend
- Demonstration of data persistence across browser refreshes
- Real error handling when backend is unavailable

---

## 🎮 ZERO TOLERANCE POLICY

**Any implementation using fake/mock/simulation functionality will be REJECTED and must be REVERTED immediately.**

**Build real features or don't build them at all.**

---

*These rules ensure every feature is production-ready and actually functional, not just visually convincing.*