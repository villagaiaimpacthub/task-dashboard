# HIVE Testing Checklist

## 🧪 Mandatory Tests for Every Feature

Before marking ANY feature as complete, Claude Code must run these tests and provide evidence.

## 🔌 Backend Connection Tests

### Health Check
```bash
curl http://localhost:8000/health
# Expected: {"status": "healthy"} or similar
```

### API Documentation
```bash
curl http://localhost:8000/docs
# Expected: HTML page with Swagger UI
```

### Environment Variable Check
```bash
echo $BACKEND_URL
echo $VITE_API_URL
# Expected: Should show URLs, not empty
```

## 🔐 Authentication Tests

### Registration Test
```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPass123!"}' \
  $BACKEND_URL/api/v1/auth/register
# Expected: User creation response
```

### Login Test
```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPass123!"}' \
  $BACKEND_URL/api/v1/auth/login
# Expected: JWT token in response
```

### Protected Endpoint Test
```bash
TOKEN="your-jwt-token-here"
curl -H "Authorization: Bearer $TOKEN" \
  $BACKEND_URL/api/v1/users/me
# Expected: User profile data
```

## 📋 Task Management Tests

### Create Task Test
```bash
TOKEN="your-jwt-token-here"
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Task","description":"Real test task"}' \
  $BACKEND_URL/api/v1/tasks/
# Expected: Task created with ID
```

### List Tasks Test
```bash
TOKEN="your-jwt-token-here"
curl -H "Authorization: Bearer $TOKEN" \
  $BACKEND_URL/api/v1/tasks/
# Expected: Array of tasks including the one just created
```

### Update Task Test
```bash
TOKEN="your-jwt-token-here"
TASK_ID="task-id-from-creation"
curl -X PUT -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"completed"}' \
  $BACKEND_URL/api/v1/tasks/$TASK_ID/status
# Expected: Updated task data
```

## 🌐 WebSocket Tests

### WebSocket Connection Test (Browser Console)
```javascript
const token = localStorage.getItem('access_token');
const ws = new WebSocket(`ws://localhost:8000/api/v1/ws?token=${token}`);

ws.onopen = () => console.log('✅ WebSocket connected');
ws.onmessage = (e) => console.log('📨 Message:', e.data);
ws.onerror = (e) => console.log('❌ Error:', e);
ws.onclose = () => console.log('🔌 Disconnected');

// Expected: Connection success, no errors
```

### WebSocket Message Test
```javascript
// After connection established:
ws.send(JSON.stringify({
  type: 'task_update',
  payload: {task_id: '123', status: 'completed'}
}));
// Expected: Message sent successfully, maybe response received
```

## 📊 Dashboard Tests

### Dashboard Summary Test
```bash
curl $BACKEND_URL/api/v1/dashboard/summary
# Expected: Statistics object with task counts, user counts, etc.
```

### Online Users Test
```bash
curl $BACKEND_URL/api/v1/dashboard/online-users
# Expected: Array of currently online users
```

## 🖥️ Frontend Integration Tests

### Browser Network Tab Check
1. Open browser dev tools → Network tab
2. Perform actions in the UI
3. **Must see real HTTP requests** to backend
4. **Must see WebSocket connection** (not polling)
5. **No errors** in console

### Data Persistence Test
1. Create a task via frontend
2. Refresh the page
3. **Task must still be there** (loaded from backend)
4. **Not from localStorage**

### Authentication Flow Test
1. Login via frontend
2. Check Network tab for real login request
3. Check that JWT token is stored
4. Verify protected actions work
5. Logout and verify session cleared

### Real-time Update Test
1. Open app in two browser windows
2. Create task in window 1
3. **Task must appear in window 2** via WebSocket
4. **No page refresh required**

## 🚫 Failure Detection Tests

### Fake Implementation Detection
```bash
# Check for localStorage abuse:
grep -r "localStorage" *.js *.html
# Should only find auth token storage

# Check for polling simulation:
grep -r "setInterval\|setTimeout" *.js
# Should not find WebSocket polling

# Check for hardcoded IPs:
grep -r "http://[0-9]" *.js *.html
# Should not find hardcoded IP addresses
```

### Mock Data Detection
```bash
# Check for fake data arrays:
grep -r "const.*tasks.*\[\]" *.js
grep -r "const.*users.*\[\]" *.js
# Should not find hardcoded data arrays
```

## 📝 Evidence Required

For each test, Claude Code must provide:

### Screenshots
- Browser Network tab showing real HTTP requests
- WebSocket connection in Network tab
- Console showing no errors
- UI showing real data updates

### Command Output
- Copy/paste of curl command results
- Actual API responses received
- Error messages (if any) and how they're handled

### Code Snippets
- Show the real API calls being made
- Demonstrate error handling code
- Prove no fake implementations exist

## 🎯 Pass/Fail Criteria

### ✅ PASS if:
- All curl commands work and return expected data
- Browser shows real HTTP/WebSocket traffic
- Data persists across page refreshes
- Real-time updates work between browser windows
- No fake implementations detected

### ❌ FAIL if:
- Any curl command fails or returns fake data
- localStorage used for primary data storage
- WebSocket polling detected instead of real WebSocket
- Data disappears on page refresh
- Real-time updates don't work
- Hardcoded IPs or fake responses found

## 🚨 Zero Tolerance

If ANY test fails, the feature is **incomplete** and must be fixed before proceeding.

**No exceptions. No "works on my machine." No "good enough for now."**

---

*These tests ensure every feature actually works as advertised.*