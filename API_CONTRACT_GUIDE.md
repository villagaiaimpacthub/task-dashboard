# HIVE API Contract Layer - Implementation Guide

## 🎯 Problem Solved

The API Contract Layer eliminates the constant alignment issues between frontend and backend by providing:

- **Single Source of Truth**: All API endpoints and data shapes defined in one place
- **Runtime Validation**: Catches mismatched data before it causes errors
- **WSL-Compatible**: Works with your dynamic IP detection system
- **Type Safety**: Prevents frontend/backend data format mismatches

## 📁 Files Created

```
/task-dashboard/
├── api-contract.js          # Node.js version with Zod validation
├── api_contract.py          # Python backend validation schemas
├── frontend/
│   └── api-contract.js      # Browser-compatible version
├── package.json             # Added Zod dependency
└── API_CONTRACT_GUIDE.md    # This file
```

## 🔄 Before vs After

### Before (Old API calls)
```javascript
// ❌ Untyped, no validation, error-prone
const response = await fetch('/api/v1/tasks/', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    title: 'My Task',
    priority: 'super-high'  // Invalid priority!
  })
});
const task = await response.json(); // No validation
```

### After (Contract-based)
```javascript
// ✅ Validated, type-safe, WSL-compatible
const task = await contractApi.createTask({
  title: 'My Task',
  priority: 'high',           // Validated against enum
  impact_points: 150          // Validated as positive number
});
// Response is automatically validated too!
```

## 🚀 Usage Examples

### 1. Basic Task Operations
```javascript
// Create a task with validation
try {
  const newTask = await contractApi.createTask({
    title: 'Solar Panel Installation',
    description: 'Install 20kW solar array',
    priority: 'high',
    category: 'Clean Energy',
    impact_points: 200,
    required_skills: ['Electrical', 'Solar Technology']
  });
  console.log('Task created:', newTask.id);
} catch (error) {
  console.error('Validation failed:', error.message);
}

// Update task status
await contractApi.updateTaskStatus('task-123', 'in_progress');

// Claim a task
await contractApi.claimTask('task-123');
```

### 2. Comments and Chat
```javascript
// Add a comment
const comment = await contractApi.createComment('task-123', 'Great progress on this!');

// Send team chat message
const message = await contractApi.sendTaskChatMessage('task-123', 'Need help with wiring');

// Get chat history
const messages = await contractApi.getTaskChatMessages('task-123');
```

### 3. File Management
```javascript
// Upload a file
const fileData = {
  name: 'solar-layout.pdf',
  content: base64Content,
  type: 'application/pdf',
  size: 1024000
};
const file = await contractApi.uploadFile('task-123', fileData);

// Get all task files
const files = await contractApi.getTaskFiles('task-123');
```

## 🔧 Migrating Existing Code

### Step 1: Replace `api` with `contractApi`
```javascript
// Old way
const tasks = await api.getTasks();

// New way  
const tasks = await contractApi.getTasks();
```

### Step 2: Handle Validation Errors
```javascript
// Add try-catch for validation
try {
  const result = await contractApi.createTask(taskData);
} catch (error) {
  if (error.message.includes('Validation failed')) {
    // Handle validation error
    showValidationError(error.message);
  } else {
    // Handle API error
    showApiError(error.message);
  }
}
```

### Step 3: Use Contract for New Features
```javascript
// When adding new endpoints, define in contract first
async function createProject(projectData) {
  // This will be validated against contract
  return await contractApi.createProject(projectData);
}
```

## ⚙️ Adding New Endpoints

### 1. Add to Contract Schema (api-contract.js)
```javascript
// Add to API_ENDPOINTS
projects: {
  create: { method: 'POST', path: '/api/v1/projects/' },
  list: { method: 'GET', path: '/api/v1/projects/' }
}
```

### 2. Add Validation (if needed)
```javascript
function validateProjectCreate(data) {
  if (!data.name || data.name.trim().length === 0) {
    throw new Error('Project name is required');
  }
  return data;
}
```

### 3. Add Client Method
```javascript
// Add to ContractAPIClient class
async createProject(projectData) {
  return this.request('projects.create', {}, {}, projectData);
}
```

### 4. Update Backend (Python)
```python
# Add to api_contract.py
class ProjectCreate(BaseModel):
    name: str = Field(..., min_length=1)
    description: Optional[str] = None

def validate_project_create(data: Dict[str, Any]) -> ProjectCreate:
    return ProjectCreate(**data)
```

## 🛠️ WSL Network Integration

The contract layer uses your environment variables setup (NO hardcoded IPs):

```javascript
// Priority order for backend URL detection:
const contractApi = new ContractAPIClient();

// 1. dev-config.js (from dev-connect-dynamic.sh)
// Uses: window.devConfig.backendUrl

// 2. Environment variables
// Uses: $VITE_API_URL, $BACKEND_URL, or $API_BASE_URL

// 3. Dynamic hostname detection (no hardcoded IPs)
// Uses: current hostname + :8000

// ❌ NO MORE HARDCODED IPs: ['172.19.58.21', '172.19.48.1']
// ✅ ALWAYS uses your environment setup
```

**Required Setup:**
```bash
# Run this to set up dynamic environment variables:
./dev-connect-dynamic.sh

# This creates .env.local with:
# BACKEND_URL=http://$WSL_IP:8000  
# WSL_IP=<dynamically detected>
```

## 🔍 Debugging & Development

### Enable/Disable Validation
```javascript
// Disable validation for debugging
contractApi.enableValidation(false);

// Re-enable validation
contractApi.enableValidation(true);
```

### Check Available Endpoints
```javascript
// List all endpoints
console.log(Object.keys(API_ENDPOINTS));

// Access endpoint config
console.log(API_ENDPOINTS.tasks.create);
```

### Inspect Requests
```javascript
// All requests are logged to console
// 🔄 API Request: POST http://172.19.58.21:8000/api/v1/tasks/
// ✅ Response for tasks.create: ['id', 'title', 'status', ...]
```

## 📋 Migration Checklist

### Phase 1: Setup (✅ Completed)
- [x] Install Zod dependency
- [x] Create contract files
- [x] Update index.html to include contract
- [x] Test basic contract functionality

### Phase 2: Replace API Calls
- [ ] Update app.js to use contractApi instead of api
- [ ] Add validation error handling
- [ ] Test all existing functionality

### Phase 3: Backend Integration
- [ ] Add Python contract validation to simple_backend.py
- [ ] Update FastAPI backend to use contract schemas
- [ ] Add response validation

### Phase 4: New Features
- [ ] Use contract for all new endpoints
- [ ] Add project management endpoints
- [ ] Implement notification system with contract

## 🚨 Common Issues & Solutions

### Issue: "Unknown endpoint" error
```javascript
// ❌ Wrong endpoint key
await contractApi.request('task.create');

// ✅ Correct endpoint key  
await contractApi.request('tasks.create');
```

### Issue: Validation failures
```javascript
// ❌ Invalid data
await contractApi.createTask({ title: '' }); // Empty title

// ✅ Valid data
await contractApi.createTask({ title: 'Valid Task Title' });
```

### Issue: WSL IP changes
```bash
# Re-run dynamic IP script
./dev-connect-dynamic.sh

# Contract will automatically pick up new IP from dev-config.js
```

## 📈 Benefits Achieved

1. **No More Alignment Issues**: Frontend and backend always use same data format
2. **Faster Development**: Validation catches errors early
3. **Better Debugging**: Clear error messages for data mismatches
4. **WSL Compatibility**: Works seamlessly with dynamic IP detection
5. **Future-Proof**: Easy to add new endpoints with guaranteed consistency

## 🎯 Next Steps

1. **Migrate Existing Calls**: Replace `api` with `contractApi` in app.js
2. **Add Backend Validation**: Integrate Python contract in simple_backend.py
3. **Extend for New Features**: Use contract for project management, notifications
4. **Performance Optimization**: Cache validation results for frequently used schemas

The contract layer is now ready to eliminate your frontend/backend alignment issues permanently! 🚀