/**
 * HIVE API Contract Layer - Single Source of Truth
 * 
 * This file defines all API endpoints, request/response schemas, and provides
 * type-safe client methods for frontend-backend communication.
 * 
 * Benefits:
 * - Eliminates frontend/backend alignment issues
 * - Provides runtime validation
 * - Single source of truth for API changes
 * - WSL-compatible with dynamic IP detection
 */

import { z } from 'zod';

// =============================================================================
// CORE SCHEMAS - Data Models
// =============================================================================

// User Schemas
export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  role: z.string().optional(),
  is_online: z.boolean().default(false),
  impact_score: z.number().default(0),
  skills: z.array(z.string()).default([]),
  created_at: z.string(),
  updated_at: z.string()
});

export const UserCreateSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

export const UserLoginSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

export const UserUpdateSchema = z.object({
  email: z.string().email().optional(),
  skills: z.array(z.string()).optional(),
  role: z.string().optional(),
  status: z.string().optional()
});

// Task Schemas
export const TaskStatusEnum = z.enum(['available', 'in_progress', 'completed', 'on_hold']);
export const TaskPriorityEnum = z.enum(['low', 'medium', 'high', 'urgent']);

export const DefinitionOfDoneItemSchema = z.object({
  id: z.number(),
  text: z.string(),
  completed: z.boolean().default(false)
});

export const TaskSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  status: TaskStatusEnum.default('available'),
  priority: TaskPriorityEnum.default('medium'),
  category: z.string().optional(),
  impact_points: z.number().default(100),
  estimated_hours: z.string().optional(),
  location: z.string().optional(),
  team_size: z.string().optional(),
  due_date: z.string().optional(),
  required_skills: z.array(z.string()).default([]),
  definition_of_done: z.array(DefinitionOfDoneItemSchema).default([]),
  owner_id: z.string(),
  assignee_id: z.string().optional(),
  created_at: z.string(),
  updated_at: z.string()
});

export const TaskCreateSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  priority: TaskPriorityEnum.default('medium'),
  category: z.string().optional(),
  impact_points: z.number().positive().default(100),
  estimated_hours: z.string().optional(),
  location: z.string().optional(),
  team_size: z.string().optional(),
  due_date: z.string().optional(),
  required_skills: z.array(z.string()).default([]),
  definition_of_done: z.string().optional() // Raw text input, will be parsed into array
});

export const TaskUpdateSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  status: TaskStatusEnum.optional(),
  priority: TaskPriorityEnum.optional(),
  category: z.string().optional(),
  impact_points: z.number().positive().optional(),
  estimated_hours: z.string().optional(),
  location: z.string().optional(),
  team_size: z.string().optional(),
  due_date: z.string().optional(),
  required_skills: z.array(z.string()).optional()
});

export const TaskAssignSchema = z.object({
  user_id: z.string()
});

export const TaskStatusUpdateSchema = z.object({
  status: TaskStatusEnum
});

// Comment Schemas
export const CommentSchema = z.object({
  id: z.string(),
  content: z.string(),
  task_id: z.string(),
  user_id: z.string(),
  user_email: z.string(),
  created_at: z.string(),
  updated_at: z.string()
});

export const CommentCreateSchema = z.object({
  content: z.string().min(1, "Comment content is required"),
  task_id: z.string()
});

// Chat Schemas
export const ChatMessageSchema = z.object({
  id: z.string(),
  content: z.string(),
  task_id: z.string().optional(),
  recipient_id: z.string().optional(),
  sender_id: z.string(),
  sender_email: z.string(),
  message_type: z.enum(['task_chat', 'direct_message']).default('task_chat'),
  created_at: z.string()
});

export const ChatMessageCreateSchema = z.object({
  content: z.string().min(1, "Message content is required")
});

// File Schemas
export const FileSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  size: z.number(),
  task_id: z.string(),
  uploaded_at: z.string(),
  uploaded_by: z.string()
});

export const FileUploadSchema = z.object({
  name: z.string(),
  content: z.string(), // Base64 encoded
  type: z.string(),
  size: z.number()
});

// Dashboard Schemas
export const DashboardSummarySchema = z.object({
  total_tasks: z.number(),
  available_tasks: z.number(),
  in_progress_tasks: z.number(),
  completed_tasks: z.number(),
  total_users: z.number().optional(),
  active_users: z.number().optional(),
  online_users: z.number().optional(),
  total_impact_points: z.number()
});

// Help Request Schemas
export const HelpRequestSchema = z.object({
  id: z.string(),
  task_id: z.string(),
  urgency: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  description: z.string(),
  requester_id: z.string(),
  requester_email: z.string(),
  created_at: z.string(),
  status: z.enum(['open', 'assigned', 'resolved']).default('open')
});

export const HelpRequestCreateSchema = z.object({
  task_id: z.string(),
  urgency: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  description: z.string().min(1, "Description is required")
});

// Authentication Schemas
export const AuthResponseSchema = z.object({
  access_token: z.string(),
  token_type: z.string().default("bearer"),
  user: UserSchema
});

// WebSocket Schemas
export const WebSocketResponseSchema = z.object({
  status: z.string(),
  message: z.string(),
  timestamp: z.string()
});

// =============================================================================
// API ENDPOINTS CONFIGURATION
// =============================================================================

export const API_ENDPOINTS = {
  // Authentication
  auth: {
    login: { method: 'POST', path: '/api/v1/auth/login', request: UserLoginSchema, response: AuthResponseSchema },
    register: { method: 'POST', path: '/api/v1/auth/register', request: UserCreateSchema, response: AuthResponseSchema }
  },
  
  // Users
  users: {
    me: { method: 'GET', path: '/api/v1/users/me', response: UserSchema },
    updateMe: { method: 'PUT', path: '/api/v1/users/me', request: UserUpdateSchema, response: UserSchema },
    online: { method: 'GET', path: '/api/v1/users/online', response: z.array(UserSchema) },
    onlineForDashboard: { method: 'GET', path: '/api/v1/dashboard/online-users', response: z.array(UserSchema) }
  },
  
  // Tasks
  tasks: {
    list: { method: 'GET', path: '/api/v1/tasks/', response: z.array(TaskSchema) },
    get: { method: 'GET', path: '/api/v1/tasks/:id', response: TaskSchema },
    create: { method: 'POST', path: '/api/v1/tasks/', request: TaskCreateSchema, response: TaskSchema },
    update: { method: 'PUT', path: '/api/v1/tasks/:id', request: TaskUpdateSchema, response: TaskSchema },
    delete: { method: 'DELETE', path: '/api/v1/tasks/:id', response: z.object({ message: z.string() }) },
    assign: { method: 'POST', path: '/api/v1/tasks/:id/assign', request: TaskAssignSchema, response: z.object({ message: z.string(), task: TaskSchema }) },
    claim: { method: 'POST', path: '/api/v1/tasks/:id/claim', response: z.object({ message: z.string(), task: TaskSchema }) },
    updateStatus: { method: 'PUT', path: '/api/v1/tasks/:id/status', request: TaskStatusUpdateSchema, response: z.object({ message: z.string(), task: TaskSchema }) },
    updateDod: { method: 'POST', path: '/api/v1/tasks/:id/dod', request: z.object({ dod_item_id: z.number(), completed: z.boolean() }), response: z.object({ message: z.string(), task: TaskSchema }) }
  },
  
  // Comments
  comments: {
    create: { method: 'POST', path: '/api/v1/comments/', request: CommentCreateSchema, response: CommentSchema },
    getForTask: { method: 'GET', path: '/api/v1/comments/task/:taskId', response: z.array(CommentSchema) },
    update: { method: 'PUT', path: '/api/v1/comments/:id', request: z.object({ content: z.string() }), response: CommentSchema },
    delete: { method: 'DELETE', path: '/api/v1/comments/:id', response: z.object({ message: z.string() }) }
  },
  
  // Chat
  chat: {
    sendTaskMessage: { method: 'POST', path: '/api/v1/chat/task/:taskId/messages', request: ChatMessageCreateSchema, response: ChatMessageSchema },
    getTaskMessages: { method: 'GET', path: '/api/v1/chat/task/:taskId/messages', response: z.array(ChatMessageSchema) },
    sendDirectMessage: { method: 'POST', path: '/api/v1/chat/direct/:recipientId/messages', request: ChatMessageCreateSchema, response: ChatMessageSchema },
    getDirectMessages: { method: 'GET', path: '/api/v1/chat/direct/:otherUserId/messages', response: z.array(ChatMessageSchema) },
    getTaskRooms: { method: 'GET', path: '/api/v1/chat/task-rooms', response: z.array(z.object({ task_id: z.string(), title: z.string(), last_message: z.string().optional() })) }
  },
  
  // Files
  files: {
    upload: { method: 'POST', path: '/api/v1/files/upload/:taskId', request: FileUploadSchema, response: FileSchema },
    getForTask: { method: 'GET', path: '/api/v1/files/task/:taskId', response: z.array(FileSchema) },
    download: { method: 'GET', path: '/api/v1/files/download/:fileId', response: z.object({ content: z.string(), name: z.string(), type: z.string() }) },
    delete: { method: 'DELETE', path: '/api/v1/files/:fileId', response: z.object({ message: z.string() }) }
  },
  
  // Dashboard
  dashboard: {
    summary: { method: 'GET', path: '/api/v1/dashboard/summary', response: DashboardSummarySchema },
    liveStatus: { method: 'GET', path: '/api/v1/dashboard/live-status', response: DashboardSummarySchema }
  },
  
  // Help Requests
  help: {
    create: { method: 'POST', path: '/api/v1/help-requests/', request: HelpRequestCreateSchema, response: z.object({ message: z.string(), request: HelpRequestSchema }) }
  },
  
  // WebSocket
  websocket: {
    connect: { method: 'GET', path: '/api/v1/ws', response: WebSocketResponseSchema }
  },
  
  // Health
  health: {
    check: { method: 'GET', path: '/health', response: z.object({ status: z.string(), message: z.string() }) }
  }
};

// =============================================================================
// TYPE-SAFE API CLIENT
// =============================================================================

export class ContractAPIClient {
  constructor(baseUrl = null) {
    // Use existing API URL detection logic
    this.baseUrl = baseUrl || this.detectApiBaseUrl();
    this.token = localStorage?.getItem('authToken');
  }

  detectApiBaseUrl() {
    // WSL-compatible dynamic IP detection - matches your existing logic
    if (typeof window !== 'undefined' && window.devConfig) {
      return window.devConfig.backendUrl;
    }
    
    if (typeof window !== 'undefined') {
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      if (isLocalhost) {
        const commonWslIps = ['172.19.58.21', '172.19.48.1', '172.20.144.1'];
        return `http://${commonWslIps[0]}:8000`;
      }
      return `http://${window.location.hostname}:8000`;
    }
    
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

  validateRequest(endpoint, data) {
    if (endpoint.request) {
      const result = endpoint.request.safeParse(data);
      if (!result.success) {
        const errorMessages = result.error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
        throw new Error(`Request validation failed: ${errorMessages.join(', ')}`);
      }
      return result.data;
    }
    return data;
  }

  validateResponse(endpoint, data) {
    if (endpoint.response) {
      const result = endpoint.response.safeParse(data);
      if (!result.success) {
        console.warn('Response validation failed:', result.error.errors);
        console.warn('Received data:', data);
        // Don't throw on response validation failure - just warn
        // This allows gradual migration and debugging
      }
      return result.success ? result.data : data;
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

  async request(endpointConfig, pathParams = {}, queryParams = {}, data = null) {
    const { method, path, request: requestSchema, response: responseSchema } = endpointConfig;
    
    // Validate request data if schema exists
    if (data && requestSchema) {
      data = this.validateRequest({ request: requestSchema }, data);
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
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Request failed' }));
        throw new Error(error.detail || `HTTP ${response.status}`);
      }
      
      const responseData = await response.json();
      
      // Validate response data
      return this.validateResponse({ response: responseSchema }, responseData);
      
    } catch (error) {
      console.error('API Request failed:', { url, method, error: error.message });
      throw error;
    }
  }

  // =============================================================================
  // TYPE-SAFE API METHODS
  // =============================================================================

  // Authentication
  async login(email, password) {
    const result = await this.request(API_ENDPOINTS.auth.login, {}, {}, { email, password });
    if (result.access_token) {
      this.setToken(result.access_token);
    }
    return result;
  }

  async register(email, password) {
    return this.request(API_ENDPOINTS.auth.register, {}, {}, { email, password });
  }

  // Users
  async getCurrentUser() {
    return this.request(API_ENDPOINTS.users.me);
  }

  async updateCurrentUser(userData) {
    return this.request(API_ENDPOINTS.users.updateMe, {}, {}, userData);
  }

  async getOnlineUsers(limit = 50) {
    return this.request(API_ENDPOINTS.users.online, {}, { limit });
  }

  async getDashboardOnlineUsers(limit = 20) {
    return this.request(API_ENDPOINTS.users.onlineForDashboard, {}, { limit });
  }

  // Tasks
  async getTasks(skip = 0, limit = 100) {
    return this.request(API_ENDPOINTS.tasks.list, {}, { skip, limit });
  }

  async getTask(taskId) {
    return this.request(API_ENDPOINTS.tasks.get, { id: taskId });
  }

  async createTask(taskData) {
    return this.request(API_ENDPOINTS.tasks.create, {}, {}, taskData);
  }

  async updateTask(taskId, taskData) {
    return this.request(API_ENDPOINTS.tasks.update, { id: taskId }, {}, taskData);
  }

  async deleteTask(taskId) {
    return this.request(API_ENDPOINTS.tasks.delete, { id: taskId });
  }

  async assignTask(taskId, userId) {
    return this.request(API_ENDPOINTS.tasks.assign, { id: taskId }, {}, { user_id: userId });
  }

  async claimTask(taskId) {
    return this.request(API_ENDPOINTS.tasks.claim, { id: taskId });
  }

  async updateTaskStatus(taskId, status) {
    return this.request(API_ENDPOINTS.tasks.updateStatus, { id: taskId }, {}, { status });
  }

  async updateDoDItem(taskId, dodItemId, completed) {
    return this.request(API_ENDPOINTS.tasks.updateDod, { id: taskId }, {}, { dod_item_id: dodItemId, completed });
  }

  // Comments
  async createComment(taskId, content) {
    return this.request(API_ENDPOINTS.comments.create, {}, {}, { task_id: taskId, content });
  }

  async getTaskComments(taskId) {
    return this.request(API_ENDPOINTS.comments.getForTask, { taskId });
  }

  async updateComment(commentId, content) {
    return this.request(API_ENDPOINTS.comments.update, { id: commentId }, {}, { content });
  }

  async deleteComment(commentId) {
    return this.request(API_ENDPOINTS.comments.delete, { id: commentId });
  }

  // Chat
  async sendTaskChatMessage(taskId, content) {
    return this.request(API_ENDPOINTS.chat.sendTaskMessage, { taskId }, {}, { content });
  }

  async getTaskChatMessages(taskId, limit = 50, offset = 0) {
    return this.request(API_ENDPOINTS.chat.getTaskMessages, { taskId }, { limit, offset });
  }

  async sendDirectMessage(recipientId, content) {
    return this.request(API_ENDPOINTS.chat.sendDirectMessage, { recipientId }, {}, { content });
  }

  async getDirectMessages(otherUserId, limit = 50, offset = 0) {
    return this.request(API_ENDPOINTS.chat.getDirectMessages, { otherUserId }, { limit, offset });
  }

  async getTaskChatRooms() {
    return this.request(API_ENDPOINTS.chat.getTaskRooms);
  }

  // Files
  async uploadFile(taskId, fileData) {
    return this.request(API_ENDPOINTS.files.upload, { taskId }, {}, fileData);
  }

  async getTaskFiles(taskId) {
    return this.request(API_ENDPOINTS.files.getForTask, { taskId });
  }

  async downloadFile(fileId) {
    return this.request(API_ENDPOINTS.files.download, { fileId });
  }

  async deleteFile(fileId) {
    return this.request(API_ENDPOINTS.files.delete, { fileId });
  }

  // Dashboard
  async getDashboardSummary() {
    return this.request(API_ENDPOINTS.dashboard.summary);
  }

  async getLiveStatus() {
    return this.request(API_ENDPOINTS.dashboard.liveStatus);
  }

  // Help Requests
  async sendHelpRequest(helpData) {
    return this.request(API_ENDPOINTS.help.create, {}, {}, helpData);
  }

  // WebSocket connection (currently unavailable - simple_backend.py doesn't support real WebSocket)
  async connectWebSocket() {
    throw new Error('WebSocket not supported by current backend');
  }

  // Health check
  async healthCheck() {
    return this.request(API_ENDPOINTS.health.check);
  }

  // Utility method to check authentication
  isAuthenticated() {
    return !!this.token;
  }
}

// Export default instance for immediate use
export const contractApi = new ContractAPIClient();

// =============================================================================
// USAGE EXAMPLES & MIGRATION HELPERS
// =============================================================================

export const MIGRATION_EXAMPLES = {
  // Before: Untyped API call
  beforeCreateTask: `
    const response = await fetch('/api/v1/tasks/', {
      method: 'POST',
      body: JSON.stringify({ title: 'My Task' })
    });
    const task = await response.json(); // No validation
  `,
  
  // After: Contract-based API call
  afterCreateTask: `
    const task = await contractApi.createTask({
      title: 'My Task',
      priority: 'high',
      category: 'Development'
    }); // Fully validated request & response
  `,
  
  // Adding new endpoint to contract
  addingNewEndpoint: `
    // 1. Add schema to api-contract.js:
    export const NewFeatureSchema = z.object({
      name: z.string(),
      value: z.number()
    });
    
    // 2. Add to API_ENDPOINTS:
    newFeature: {
      create: { method: 'POST', path: '/api/v1/features/', request: NewFeatureSchema, response: NewFeatureSchema }
    }
    
    // 3. Add method to ContractAPIClient:
    async createFeature(data) {
      return this.request(API_ENDPOINTS.newFeature.create, {}, {}, data);
    }
  `
};

console.log('✅ HIVE API Contract Layer loaded successfully');
console.log('📍 Base URL:', contractApi.baseUrl);
console.log('🔧 Available endpoints:', Object.keys(API_ENDPOINTS).length);