// API Configuration
// For WSL users: Replace localhost with your WSL IP (run: hostname -I)
const API_BASE_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:8000' 
    : `http://${window.location.hostname}:8000`;
const API_V1_URL = `${API_BASE_URL}/api/v1`;

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

    // Check if user is authenticated
    isAuthenticated() {
        return !!this.token;
    }
}

// Create global API client instance
const api = new APIClient();