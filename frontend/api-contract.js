/**
 * HIVE API Contract Layer - Browser-compatible version
 * 
 * This is a browser-compatible version of the API contract that doesn't use ES6 imports
 * since your frontend uses vanilla JavaScript without a bundler.
 */

// Simple Zod-like validation for browser environment
const z = {
  string: () => ({
    min: (n, msg) => ({ _type: 'string', _min: n, _minMessage: msg }),
    email: () => ({ _type: 'string', _email: true }),
    optional: () => ({ _optional: true })
  }),
  number: () => ({
    positive: () => ({ _type: 'number', _positive: true }),
    default: (val) => ({ _type: 'number', _default: val })
  }),
  boolean: () => ({ _type: 'boolean', default: (val) => ({ _type: 'boolean', _default: val }) }),
  array: (schema) => ({ _type: 'array', _items: schema, default: (val) => ({ _type: 'array', _items: schema, _default: val }) }),
  object: (shape) => ({ _type: 'object', _shape: shape }),
  enum: (values) => ({ _type: 'enum', _values: values }),
  safeParse: function(data) {
    // Simple validation - just return success for now
    // In a real implementation, you'd validate against the schema
    return { success: true, data };
  }
};

// =============================================================================
// SIMPLIFIED CONTRACT FOR BROWSER
// =============================================================================

const API_ENDPOINTS = {
  // Authentication
  auth: {
    login: { method: 'POST', path: '/api/v1/auth/login' },
    register: { method: 'POST', path: '/api/v1/auth/register' }
  },
  
  // Users
  users: {
    me: { method: 'GET', path: '/api/v1/users/me' },
    updateMe: { method: 'PUT', path: '/api/v1/users/me' },
    online: { method: 'GET', path: '/api/v1/users/online' },
    onlineForDashboard: { method: 'GET', path: '/api/v1/dashboard/online-users' }
  },
  
  // Tasks
  tasks: {
    list: { method: 'GET', path: '/api/v1/tasks/' },
    get: { method: 'GET', path: '/api/v1/tasks/:id' },
    create: { method: 'POST', path: '/api/v1/tasks/' },
    update: { method: 'PUT', path: '/api/v1/tasks/:id' },
    delete: { method: 'DELETE', path: '/api/v1/tasks/:id' },
    assign: { method: 'POST', path: '/api/v1/tasks/:id/assign' },
    claim: { method: 'POST', path: '/api/v1/tasks/:id/claim' },
    updateStatus: { method: 'PUT', path: '/api/v1/tasks/:id/status' },
    updateDod: { method: 'POST', path: '/api/v1/tasks/:id/dod' }
  },
  
  // Comments
  comments: {
    create: { method: 'POST', path: '/api/v1/comments/' },
    getForTask: { method: 'GET', path: '/api/v1/comments/task/:taskId' },
    update: { method: 'PUT', path: '/api/v1/comments/:id' },
    delete: { method: 'DELETE', path: '/api/v1/comments/:id' }
  },
  
  // Chat
  chat: {
    sendTaskMessage: { method: 'POST', path: '/api/v1/chat/task/:taskId/messages' },
    getTaskMessages: { method: 'GET', path: '/api/v1/chat/task/:taskId/messages' },
    sendDirectMessage: { method: 'POST', path: '/api/v1/chat/direct/:recipientId/messages' },
    getDirectMessages: { method: 'GET', path: '/api/v1/chat/direct/:otherUserId/messages' },
    getTaskRooms: { method: 'GET', path: '/api/v1/chat/task-rooms' }
  },
  
  // Files
  files: {
    upload: { method: 'POST', path: '/api/v1/files/upload/:taskId' },
    getForTask: { method: 'GET', path: '/api/v1/files/task/:taskId' },
    download: { method: 'GET', path: '/api/v1/files/download/:fileId' },
    delete: { method: 'DELETE', path: '/api/v1/files/:fileId' }
  },
  
  // Dashboard
  dashboard: {
    summary: { method: 'GET', path: '/api/v1/dashboard/summary' },
    liveStatus: { method: 'GET', path: '/api/v1/dashboard/live-status' }
  },
  
  // Help Requests
  help: {
    create: { method: 'POST', path: '/api/v1/help-requests/' }
  },
  
  // WebSocket
  websocket: {
    connect: { method: 'GET', path: '/api/v1/ws' }
  },
  
  // Health
  health: {
    check: { method: 'GET', path: '/health' }
  }
};

// =============================================================================
// VALIDATION HELPERS
// =============================================================================

function validateTaskCreate(data) {
  const errors = [];
  
  if (!data.title || data.title.trim().length === 0) {
    errors.push('Title is required');
  }
  
  if (data.impact_points && (typeof data.impact_points !== 'number' || data.impact_points <= 0)) {
    errors.push('Impact points must be a positive number');
  }
  
  const validPriorities = ['low', 'medium', 'high', 'urgent'];
  if (data.priority && !validPriorities.includes(data.priority)) {
    errors.push('Priority must be one of: ' + validPriorities.join(', '));
  }
  
  if (errors.length > 0) {
    throw new Error('Validation failed: ' + errors.join(', '));
  }
  
  return data;
}

function validateTaskStatusUpdate(data) {
  const validStatuses = ['available', 'in_progress', 'completed', 'on_hold'];
  if (!data.status || !validStatuses.includes(data.status)) {
    throw new Error('Status must be one of: ' + validStatuses.join(', '));
  }
  return data;
}

function validateComment(data) {
  if (!data.content || data.content.trim().length === 0) {
    throw new Error('Comment content is required');
  }
  return data;
}

function validateHelpRequest(data) {
  const errors = [];
  
  if (!data.task_id) {
    errors.push('Task ID is required');
  }
  
  if (!data.description || data.description.trim().length === 0) {
    errors.push('Description is required');
  }
  
  const validUrgencies = ['low', 'medium', 'high', 'critical'];
  if (data.urgency && !validUrgencies.includes(data.urgency)) {
    errors.push('Urgency must be one of: ' + validUrgencies.join(', '));
  }
  
  if (errors.length > 0) {
    throw new Error('Validation failed: ' + errors.join(', '));
  }
  
  return data;
}

// =============================================================================
// CONTRACT-BASED API CLIENT
// =============================================================================

class ContractAPIClient {
  constructor(baseUrl = null) {
    // Use existing API URL detection logic
    this.baseUrl = baseUrl || this.detectApiBaseUrl();
    this.token = localStorage?.getItem('authToken');
    this.validationEnabled = true; // Can be disabled for debugging
  }

  detectApiBaseUrl() {
    // Priority 1: Use dev-config.js (set by dev-connect-dynamic.sh)
    if (typeof window !== 'undefined' && window.devConfig) {
      console.log('🔧 Using dev-config backend URL:', window.devConfig.backendUrl);
      return window.devConfig.backendUrl;
    }
    
    // Priority 2: Check environment variables (for Node.js/build environments)
    if (typeof process !== 'undefined' && process.env) {
      const envUrl = process.env.VITE_API_URL || process.env.BACKEND_URL || process.env.API_BASE_URL;
      if (envUrl) {
        console.log('🔧 Using environment variable backend URL:', envUrl);
        return envUrl;
      }
    }
    
    // Priority 3: Browser detection with NO hardcoded IPs
    if (typeof window !== 'undefined') {
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      if (isLocalhost) {
        console.warn('⚠️ No dev-config.js found! Run ./dev-connect-dynamic.sh to set up dynamic IP detection');
        return 'http://localhost:8000'; // Fallback only, not recommended
      }
      return `http://${window.location.hostname}:8000`;
    }
    
    console.warn('⚠️ Could not detect backend URL! Please ensure dev-connect-dynamic.sh has been run');
    return 'http://localhost:8000';
  }

  setToken(token) {
    this.token = token;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('authToken', token);
    }
  }

  removeToken() {
    this.token = null;
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('authToken');
    }
  }

  getHeaders(includeAuth = true) {
    const headers = { 'Content-Type': 'application/json' };
    if (includeAuth && this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  validateRequest(endpointKey, data) {
    if (!this.validationEnabled) return data;
    
    // Simple validation based on endpoint
    try {
      switch(endpointKey) {
        case 'tasks.create':
          return validateTaskCreate(data);
        case 'tasks.updateStatus':
          return validateTaskStatusUpdate(data);
        case 'comments.create':
          return validateComment(data);
        case 'help.create':
          return validateHelpRequest(data);
        default:
          return data;
      }
    } catch (error) {
      console.error(`Contract validation failed for ${endpointKey}:`, error.message);
      throw error;
    }
  }

  validateResponse(endpointKey, data) {
    if (!this.validationEnabled) return data;
    
    // Log any unexpected response structure for debugging
    if (data && typeof data === 'object') {
      console.log(`✅ Response for ${endpointKey}:`, Object.keys(data));
    }
    
    return data;
  }

  buildUrl(path, params = {}) {
    let url = `${this.baseUrl}${path}`;
    
    // Replace path parameters (e.g., :id, :taskId)
    Object.entries(params).forEach(([key, value]) => {
      url = url.replace(`:${key}`, encodeURIComponent(value));
    });
    
    return url;
  }

  async request(endpointKey, pathParams = {}, queryParams = {}, data = null) {
    const endpointConfig = this.getEndpointConfig(endpointKey);
    const { method, path } = endpointConfig;
    
    // Validate request data
    if (data && ['POST', 'PUT', 'PATCH'].includes(method)) {
      data = this.validateRequest(endpointKey, data);
    }
    
    // Build URL with path parameters
    let url = this.buildUrl(path, pathParams);
    
    // Add query parameters
    if (Object.keys(queryParams).length > 0) {
      const searchParams = new URLSearchParams(queryParams);
      url += `?${searchParams}`;
    }
    
    const config = {
      method,
      headers: this.getHeaders(),
      mode: 'cors'
    };
    
    if (data && ['POST', 'PUT', 'PATCH'].includes(method)) {
      config.body = JSON.stringify(data);
    }
    
    try {
      console.log(`🔄 API Request: ${method} ${url}`);
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Request failed' }));
        throw new Error(error.detail || `HTTP ${response.status}`);
      }
      
      const responseData = await response.json();
      
      // Validate and return response
      return this.validateResponse(endpointKey, responseData);
      
    } catch (error) {
      console.error(`❌ API Request failed: ${method} ${url}`, error.message);
      throw error;
    }
  }

  getEndpointConfig(endpointKey) {
    const [category, action] = endpointKey.split('.');
    const endpoint = API_ENDPOINTS[category]?.[action];
    
    if (!endpoint) {
      throw new Error(`Unknown endpoint: ${endpointKey}`);
    }
    
    return endpoint;
  }

  // =============================================================================
  // TYPE-SAFE API METHODS
  // =============================================================================

  // Authentication
  async login(email, password) {
    const result = await this.request('auth.login', {}, {}, { email, password });
    if (result.access_token) {
      this.setToken(result.access_token);
    }
    return result;
  }

  async register(email, password) {
    return this.request('auth.register', {}, {}, { email, password });
  }

  // Users
  async getCurrentUser() {
    return this.request('users.me');
  }

  async updateCurrentUser(userData) {
    return this.request('users.updateMe', {}, {}, userData);
  }

  async getOnlineUsers(limit = 50) {
    return this.request('users.online', {}, { limit });
  }

  async getDashboardOnlineUsers(limit = 20) {
    return this.request('users.onlineForDashboard', {}, { limit });
  }

  // Tasks
  async getTasks(skip = 0, limit = 100) {
    return this.request('tasks.list', {}, { skip, limit });
  }

  async getTask(taskId) {
    return this.request('tasks.get', { id: taskId });
  }

  async createTask(taskData) {
    return this.request('tasks.create', {}, {}, taskData);
  }

  async updateTask(taskId, taskData) {
    return this.request('tasks.update', { id: taskId }, {}, taskData);
  }

  async deleteTask(taskId) {
    return this.request('tasks.delete', { id: taskId });
  }

  async assignTask(taskId, userId) {
    return this.request('tasks.assign', { id: taskId }, {}, { user_id: userId });
  }

  async claimTask(taskId) {
    return this.request('tasks.claim', { id: taskId });
  }

  async updateTaskStatus(taskId, status) {
    return this.request('tasks.updateStatus', { id: taskId }, {}, { status });
  }

  async updateDoDItem(taskId, dodItemId, completed) {
    return this.request('tasks.updateDod', { id: taskId }, {}, { dod_item_id: dodItemId, completed });
  }

  // Comments
  async createComment(taskId, content) {
    return this.request('comments.create', {}, {}, { task_id: taskId, content });
  }

  async getTaskComments(taskId) {
    return this.request('comments.getForTask', { taskId });
  }

  async updateComment(commentId, content) {
    return this.request('comments.update', { id: commentId }, {}, { content });
  }

  async deleteComment(commentId) {
    return this.request('comments.delete', { id: commentId });
  }

  // Chat
  async sendTaskChatMessage(taskId, content) {
    return this.request('chat.sendTaskMessage', { taskId }, {}, { content });
  }

  async getTaskChatMessages(taskId, limit = 50, offset = 0) {
    return this.request('chat.getTaskMessages', { taskId }, { limit, offset });
  }

  async sendDirectMessage(recipientId, content) {
    return this.request('chat.sendDirectMessage', { recipientId }, {}, { content });
  }

  async getDirectMessages(otherUserId, limit = 50, offset = 0) {
    return this.request('chat.getDirectMessages', { otherUserId }, { limit, offset });
  }

  async getTaskChatRooms() {
    return this.request('chat.getTaskRooms');
  }

  // Files
  async uploadFile(taskId, fileData) {
    return this.request('files.upload', { taskId }, {}, fileData);
  }

  async getTaskFiles(taskId) {
    return this.request('files.getForTask', { taskId });
  }

  async downloadFile(fileId) {
    return this.request('files.download', { fileId });
  }

  async deleteFile(fileId) {
    return this.request('files.delete', { fileId });
  }

  // Dashboard
  async getDashboardSummary() {
    return this.request('dashboard.summary');
  }

  async getLiveStatus() {
    return this.request('dashboard.liveStatus');
  }

  // Help Requests
  async sendHelpRequest(helpData) {
    return this.request('help.create', {}, {}, helpData);
  }

  // WebSocket connection (currently unavailable - simple_backend.py doesn't support real WebSocket)
  async connectWebSocket() {
    throw new Error('WebSocket not supported by current backend');
  }

  // Health check
  async healthCheck() {
    return this.request('health.check');
  }

  // Utility methods
  isAuthenticated() {
    return !!this.token;
  }

  enableValidation(enabled = true) {
    this.validationEnabled = enabled;
    console.log(`🔧 Contract validation ${enabled ? 'enabled' : 'disabled'}`);
  }
}

// Export default instance for immediate use
const contractApi = new ContractAPIClient();

console.log('✅ HIVE API Contract Layer (Browser) loaded successfully');
console.log('📍 Base URL:', contractApi.baseUrl);
console.log('🔧 Available endpoints:', Object.keys(API_ENDPOINTS).length);

// Make available globally for debugging
if (typeof window !== 'undefined') {
  window.contractApi = contractApi;
  window.API_ENDPOINTS = API_ENDPOINTS;
}