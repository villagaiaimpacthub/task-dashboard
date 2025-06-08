# HIVE Codebase Audit Process

## 🔍 Comprehensive Audit Steps

Now that Claude Code has guidelines, let's systematically audit everything to ensure it actually works.

## Step 1: Environment Health Check

### Run Your Debug Script First
```bash
./debug-hive.sh
```
**Expected**: All green checkmarks, no hardcoded IPs, environment variables set

### Backend Status Check
```bash
# Check if backend is actually running
curl http://localhost:8000/health
curl http://localhost:8000/docs

# Check what processes are running
ps aux | grep -E "(python|uvicorn|fastapi)"
```

### Environment Variables Verification
```bash
# Verify dev-connect.sh worked
echo "BACKEND_URL: $BACKEND_URL"
echo "VITE_API_URL: $VITE_API_URL"
echo "WSL_IP: $WSL_IP"

# Check .env files
cat .env.development 2>/dev/null || echo "No .env.development"
cat .env.local 2>/dev/null || echo "No .env.local"
```

## Step 2: Fake Implementation Detection

### Scan for Forbidden Patterns
```bash
# Check for localStorage database abuse
echo "=== LOCALSTORAGE ABUSE CHECK ==="
grep -r "localStorage\.setItem.*tasks\|localStorage\.setItem.*users" . --include="*.js" --include="*.html"

# Check for fake WebSocket polling
echo "=== FAKE WEBSOCKET CHECK ==="
grep -r "setInterval.*fetch\|setTimeout.*fetch.*ws" . --include="*.js"

# Check for hardcoded IPs
echo "=== HARDCODED IP CHECK ==="
grep -r "http://[0-9]\+\.[0-9]\+\.[0-9]\+\.[0-9]\+" . --include="*.js" --include="*.html"

# Check for mock data arrays
echo "=== MOCK DATA CHECK ==="
grep -r "const.*tasks.*=.*\[\|let.*tasks.*=.*\[" . --include="*.js"
```

### Manual Code Review Checklist
```bash
# Review key files for violations:
echo "=== FILES TO MANUALLY REVIEW ==="
find . -name "*.js" -o -name "*.html" | grep -v node_modules | head -10
```

## Step 3: API Integration Audit

### Test Real Backend Endpoints
```bash
echo "=== BACKEND API AUDIT ==="

# Health check
echo "1. Health Check:"
curl -s http://localhost:8000/health || echo "❌ Health check failed"

# API documentation
echo "2. API Docs:"
curl -s http://localhost:8000/docs | grep -q "swagger" && echo "✅ Docs available" || echo "❌ No docs"

# Authentication endpoints
echo "3. Auth Endpoints:"
curl -s -X POST -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}' \
  http://localhost:8000/api/v1/auth/register || echo "❌ Register failed"

# Task endpoints
echo "4. Task Endpoints:"
curl -s http://localhost:8000/api/v1/tasks/ || echo "❌ Tasks endpoint failed"
```

### Frontend API Integration Check
```bash
echo "=== FRONTEND API INTEGRATION AUDIT ==="

# Check if frontend makes real API calls
echo "1. Checking for real fetch() calls to backend:"
grep -r "fetch.*\${.*API_URL\|fetch.*process\.env" . --include="*.js"

# Check for proper error handling
echo "2. Checking for error handling:"
grep -r "catch.*error\|\.then.*\.catch" . --include="*.js"

# Check for environment variable usage
echo "3. Checking environment variable usage:"
grep -r "process\.env\|window\.devConfig" . --include="*.js"
```

## Step 4: Real-Time Features Audit

### WebSocket Implementation Check
```bash
echo "=== WEBSOCKET AUDIT ==="

# Look for real WebSocket usage
echo "1. Real WebSocket connections:"
grep -r "new WebSocket\|WebSocket(" . --include="*.js"

# Check for fake polling (should find NONE)
echo "2. Fake polling detection:"
grep -r "setInterval.*ws\|setTimeout.*websocket" . --include="*.js" && echo "❌ Found fake polling" || echo "✅ No fake polling"

# Check WebSocket error handling
echo "3. WebSocket error handling:"
grep -r "ws\.onerror\|ws\.onclose" . --include="*.js"
```

### Test WebSocket Connection (Manual)
```javascript
// Run this in browser console after loading app:
const testWebSocket = () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
        console.log('❌ No auth token for WebSocket test');
        return;
    }
    
    const ws = new WebSocket(`ws://localhost:8000/api/v1/ws?token=${token}`);
    
    ws.onopen = () => console.log('✅ Real WebSocket connected');
    ws.onerror = (e) => console.log('❌ WebSocket error:', e);
    ws.onclose = () => console.log('🔌 WebSocket closed');
    
    setTimeout(() => ws.close(), 5000);
};

// Copy and paste this into browser console
testWebSocket();
```

## Step 5: Data Persistence Audit

### Test Real Data Flow
```bash
echo "=== DATA PERSISTENCE AUDIT ==="

# Test complete data flow
echo "Testing complete CRUD cycle..."

# 1. Create test data via API
TOKEN="test-token-here"  # Get real token first

echo "1. Creating test task..."
TASK_RESPONSE=$(curl -s -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Audit Test Task","description":"Testing real persistence"}' \
  http://localhost:8000/api/v1/tasks/)

echo "Response: $TASK_RESPONSE"

# 2. Verify task persists
echo "2. Verifying task persistence..."
curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/v1/tasks/ | grep "Audit Test Task" && echo "✅ Task persisted" || echo "❌ Task not found"
```

### Frontend Data Persistence Test
```javascript
// Manual test in browser:
// 1. Create a task via UI
// 2. Note the task details
// 3. Refresh the page (F5)
// 4. Check if task is still there
// ✅ Should be there (loaded from backend)
// ❌ If gone, using localStorage instead of backend
```

## Step 6: Authentication Flow Audit

### Test Complete Auth Cycle
```bash
echo "=== AUTHENTICATION AUDIT ==="

# Test registration
echo "1. Testing registration..."
REG_RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" \
  -d '{"email":"audit@test.com","password":"AuditTest123!"}' \
  http://localhost:8000/api/v1/auth/register)

echo "Registration: $REG_RESPONSE"

# Test login
echo "2. Testing login..."
LOGIN_RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" \
  -d '{"email":"audit@test.com","password":"AuditTest123!"}' \
  http://localhost:8000/api/v1/auth/login)

echo "Login: $LOGIN_RESPONSE"

# Extract token and test protected endpoint
TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
echo "3. Testing protected endpoint with token..."
curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/v1/users/me || echo "❌ Protected endpoint failed"
```

### Frontend Auth Integration Check
```bash
echo "=== FRONTEND AUTH INTEGRATION ==="

# Check for real JWT handling
echo "1. JWT token handling:"
grep -r "access_token\|Authorization.*Bearer" . --include="*.js"

# Check for proper login/logout
echo "2. Login/logout implementation:"
grep -r "login.*function\|logout.*function" . --include="*.js"

# Check for auth state management
echo "3. Authentication state:"
grep -r "isAuthenticated\|checkAuth" . --include="*.js"
```

## Step 7: Browser Integration Test

### Manual Browser Tests
```markdown
Open browser and test:

1. **Network Tab Verification**
   - Open Dev Tools → Network tab
   - Perform app actions
   - ✅ Should see real HTTP requests to localhost:8000
   - ❌ No requests = fake implementation

2. **WebSocket Tab Verification**
   - In Network tab, filter by WS
   - ✅ Should see WebSocket connection
   - ❌ No WebSocket = fake polling

3. **Console Error Check**
   - Open Dev Tools → Console tab
   - ✅ No errors during normal operation
   - ❌ WebSocket errors = connection problems

4. **Real-time Test**
   - Open app in two browser windows
   - Create task in window 1
   - ✅ Should appear in window 2 automatically
   - ❌ Requires refresh = no real-time

5. **Data Persistence Test**
   - Create some data via UI
   - Close browser completely
   - Reopen browser, navigate to app
   - ✅ Data still there = real backend
   - ❌ Data gone = localStorage only
```

## Step 8: Performance & Error Handling Audit

### Error Handling Test
```bash
echo "=== ERROR HANDLING AUDIT ==="

# Test with backend stopped
echo "1. Testing with backend offline..."
# Stop backend temporarily, then:
# curl http://localhost:8000/health
# Should return connection error

# Test invalid authentication
echo "2. Testing invalid auth..."
curl -s -H "Authorization: Bearer invalid-token" \
  http://localhost:8000/api/v1/tasks/ && echo "❌ Should reject invalid token" || echo "✅ Rejects invalid token"

# Test malformed requests
echo "3. Testing malformed requests..."
curl -s -X POST -H "Content-Type: application/json" \
  -d '{"invalid": "data"}' \
  http://localhost:8000/api/v1/tasks/ && echo "❌ Should reject invalid data" || echo "✅ Validates input"
```

## Step 9: Compliance with Guidelines Audit

### Check Against .claude/ Rules
```bash
echo "=== GUIDELINE COMPLIANCE AUDIT ==="

# Verify no violations of development-rules.md
echo "1. Checking for rule violations..."

# Check for forbidden localStorage usage
grep -r "localStorage.*tasks\|localStorage.*users" . --include="*.js" && echo "❌ Rule violation: localStorage as database"

# Check for forbidden fake implementations
grep -r "mock\|fake\|simulation" . --include="*.js" --include="*.html" | grep -v ".claude" && echo "❌ Rule violation: fake implementations"

# Check for hardcoded configuration
grep -r "localhost:8000\|127.0.0.1" . --include="*.js" --include="*.html" && echo "❌ Rule violation: hardcoded URLs"
```

## Step 10: Generate Audit Report

### Create Summary Report
```bash
echo "=== AUDIT SUMMARY REPORT ==="
echo "Date: $(date)"
echo "Project: HIVE Task Dashboard"
echo ""
echo "✅ PASSED CHECKS:"
# List what passed

echo ""
echo "❌ FAILED CHECKS:"
# List what failed

echo ""
echo "🔧 REQUIRED FIXES:"
# List what needs to be fixed

echo ""
echo "📋 NEXT ACTIONS:"
# List immediate next steps
```

## Step 11: Fix Identified Issues

### Systematic Fix Process
1. **Prioritize by severity**: Security > Functionality > Performance
2. **Fix one issue at a time**: Don't make multiple changes simultaneously
3. **Test after each fix**: Ensure fix doesn't break other things
4. **Update guidelines**: If new failure patterns found

### Tell Claude Code:
```
Based on the audit results, fix these issues in priority order:

1. [Highest priority issue]
2. [Second priority issue]
3. [etc.]

Follow .claude/ guidelines for all fixes. Run testing-checklist.md tests after each fix.
```

---

**This audit process ensures everything actually works as intended, not just looks like it works.**