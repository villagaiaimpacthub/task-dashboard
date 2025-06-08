// Dynamic API Configuration - uses environment variables set by dev-connect-dynamic.sh
const getApiBaseUrl = () => {
    // Try to get from global config first (set by dev-config.js)
    if (typeof window !== 'undefined' && window.devConfig) {
        return window.devConfig.backendUrl;
    }
    
    // Fallback to environment detection
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    if (isLocalhost) {
        // We're in development - try to detect WSL IP dynamically
        const wslIp = getWslIp();
        return `http://${wslIp}:8000`;
    } else {
        // Production - use same host as frontend
        return `http://${window.location.hostname}:8000`;
    }
};

const getWslIp = () => {
    // Method 1: Check if we have it in global config (set by dev-connect-dynamic.sh)
    if (typeof window !== 'undefined' && window.devConfig && window.devConfig.wslIp) {
        return window.devConfig.wslIp;
    }
    
    // Method 2: Warn and use localhost fallback - NO hardcoded IPs!
    console.warn('⚠️ No WSL IP found in dev-config! Please run ./dev-connect-dynamic.sh');
    console.warn('⚠️ Falling back to localhost - this may not work in WSL environments');
    return 'localhost';
};

const API_BASE_URL = getApiBaseUrl();
const API_V1_URL = `${API_BASE_URL}/api/v1`;

console.log('API Configuration:', { API_BASE_URL, API_V1_URL });

// API Client class
class APIClient {
    constructor() {
        this.token = localStorage.getItem('authToken');
    }

    // Set authentication token
    setToken(token) {
        this.token = token;
        localStorage.setItem('authToken', token);
    }

    // Remove authentication token
    removeToken() {
        this.token = null;
        localStorage.removeItem('authToken');
    }

    // Get headers with authentication
    getHeaders(includeAuth = true) {
        const headers = {
            'Content-Type': 'application/json',
        };

        if (includeAuth && this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        return headers;
    }

    // Generic API request method
    async request(endpoint, options = {}) {
        const url = `${API_V1_URL}${endpoint}`;
        const config = {
            headers: this.getHeaders(options.auth !== false),
            // Don't use credentials with wildcard CORS
            mode: 'cors',
            ...options,
        };

        try {
            const response = await fetch(url, config);
            
            if (!response.ok) {
                const error = await response.json().catch(() => ({ detail: 'Request failed' }));
                throw new Error(error.detail || `HTTP ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API Request failed:', error);
            throw error;
        }
    }

    // Authentication endpoints
    async register(email, password) {
        return this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
            auth: false,
        });
    }

    async login(email, password) {
        const response = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
            auth: false,
        });
        
        if (response.access_token) {
            this.setToken(response.access_token);
        }
        
        return response;
    }

    // User endpoints
    async getCurrentUser() {
        return this.request('/users/me');
    }

    async updateCurrentUser(userData) {
        return this.request('/users/me', {
            method: 'PUT',
            body: JSON.stringify(userData),
        });
    }

    async getOnlineUsers(limit = 50) {
        return this.request(`/users/online?limit=${limit}`);
    }

    // Task endpoints
    async getTasks(skip = 0, limit = 100) {
        return this.request(`/tasks/?skip=${skip}&limit=${limit}`);
    }

    async getTask(taskId) {
        return this.request(`/tasks/${taskId}`);
    }

    async createTask(taskData) {
        return this.request('/tasks/', {
            method: 'POST',
            body: JSON.stringify(taskData),
        });
    }

    async updateTask(taskId, taskData) {
        return this.request(`/tasks/${taskId}`, {
            method: 'PUT',
            body: JSON.stringify(taskData),
        });
    }

    async deleteTask(taskId) {
        return this.request(`/tasks/${taskId}`, {
            method: 'DELETE',
        });
    }

    async assignTask(taskId, userId) {
        return this.request(`/tasks/${taskId}/assign`, {
            method: 'POST',
            body: JSON.stringify({ user_id: userId }),
        });
    }

    async claimTask(taskId) {
        return this.request(`/tasks/${taskId}/claim`, {
            method: 'POST',
        });
    }

    async updateTaskStatus(taskId, status) {
        return this.request(`/tasks/${taskId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status }),
        });
    }

    // Comment endpoints
    async createComment(taskId, content) {
        return this.request('/comments/', {
            method: 'POST',
            body: JSON.stringify({ task_id: taskId, content }),
        });
    }

    async getTaskComments(taskId) {
        return this.request(`/comments/task/${taskId}`);
    }

    async updateComment(commentId, content) {
        return this.request(`/comments/${commentId}`, {
            method: 'PUT',
            body: JSON.stringify({ content }),
        });
    }

    async deleteComment(commentId) {
        return this.request(`/comments/${commentId}`, {
            method: 'DELETE',
        });
    }

    // Chat endpoints
    async sendTaskChatMessage(taskId, content) {
        return this.request(`/chat/task/${taskId}/messages`, {
            method: 'POST',
            body: JSON.stringify({ content }),
        });
    }

    async getTaskChatMessages(taskId, limit = 50, offset = 0) {
        return this.request(`/chat/task/${taskId}/messages?limit=${limit}&offset=${offset}`);
    }

    async getTaskChatRooms() {
        return this.request('/chat/task-rooms');
    }

    async sendDirectMessage(recipientId, content) {
        return this.request(`/chat/direct/${recipientId}/messages`, {
            method: 'POST',
            body: JSON.stringify({ content }),
        });
    }

    async getDirectMessages(otherUserId, limit = 50, offset = 0) {
        return this.request(`/chat/direct/${otherUserId}/messages?limit=${limit}&offset=${offset}`);
    }

    // Dashboard endpoints
    async getDashboardSummary() {
        return this.request('/dashboard/summary', { auth: false });
    }

    async getLiveStatus() {
        return this.request('/dashboard/live-status', { auth: false });
    }

    async getDashboardOnlineUsers(limit = 20) {
        return this.request(`/dashboard/online-users?limit=${limit}`);
    }

    // Health check
    async healthCheck() {
        const response = await fetch(`${API_BASE_URL}/health`);
        return response.json();
    }

    // File management methods
    async uploadFile(taskId, fileData) {
        return this.request(`/files/upload/${taskId}`, {
            method: 'POST',
            body: JSON.stringify(fileData)
        });
    }

    async getTaskFiles(taskId) {
        return this.request(`/files/task/${taskId}`);
    }

    async deleteFile(fileId) {
        return this.request(`/files/${fileId}`, {
            method: 'DELETE'
        });
    }

    // Help request method
    async sendHelpRequest(helpData) {
        return this.request('/help-requests/', {
            method: 'POST',
            body: JSON.stringify(helpData)
        });
    }

    // Definition of Done methods
    async updateDoDItem(taskId, dodItemId, completed) {
        return this.request(`/tasks/${taskId}/dod`, {
            method: 'POST',
            body: JSON.stringify({
                dod_item_id: dodItemId,
                completed: completed
            })
        });
    }

    // Check if user is authenticated
    isAuthenticated() {
        return !!this.token;
    }
}

// Create global API client instance (DEPRECATED - use contractApi instead)
// const api = new APIClient();
console.warn('⚠️ api.js is deprecated - use contractApi from api-contract.js instead');