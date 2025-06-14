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

    // HTTP method helpers
    async get(endpoint, options = {}) {
        return this.request(endpoint, {
            method: 'GET',
            ...options,
        });
    }

    async post(endpoint, data, options = {}) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data),
            ...options,
        });
    }

    async put(endpoint, data, options = {}) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data),
            ...options,
        });
    }

    async delete(endpoint, options = {}) {
        return this.request(endpoint, {
            method: 'DELETE',
            ...options,
        });
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

    // Project endpoints
    async getProjects(skip = 0, limit = 100, status = null) {
        let url = `/projects/?skip=${skip}&limit=${limit}`;
        if (status) {
            url += `&status=${status}`;
        }
        return this.request(url);
    }

    async getMyProjects(skip = 0, limit = 100, status = null) {
        let url = `/projects/my?skip=${skip}&limit=${limit}`;
        if (status) {
            url += `&status=${status}`;
        }
        return this.request(url);
    }

    async getProject(projectId) {
        return this.request(`/projects/${projectId}`);
    }

    async createProject(projectData) {
        return this.request('/projects/', {
            method: 'POST',
            body: JSON.stringify(projectData),
        });
    }

    async updateProject(projectId, projectData) {
        return this.request(`/projects/${projectId}`, {
            method: 'PUT',
            body: JSON.stringify(projectData),
        });
    }

    async deleteProject(projectId) {
        return this.request(`/projects/${projectId}`, {
            method: 'DELETE',
        });
    }

    async getProjectTasks(projectId) {
        return this.request(`/projects/${projectId}/tasks`);
    }

    async getProjectsSummary() {
        return this.request('/projects/summary');
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

    // Comments endpoints
    async getTaskComments(taskId) {
        return this.request(`/comments/task/${taskId}`);
    }

    async createComment(commentData) {
        return this.request('/comments/', {
            method: 'POST',
            body: JSON.stringify(commentData),
        });
    }

    async updateComment(commentId, commentData) {
        return this.request(`/comments/${commentId}`, {
            method: 'PUT',
            body: JSON.stringify(commentData),
        });
    }

    async deleteComment(commentId) {
        return this.request(`/comments/${commentId}`, {
            method: 'DELETE',
        });
    }

    // Milestone endpoints
    async createMilestone(milestoneData) {
        return this.request('/milestones/', {
            method: 'POST',
            body: JSON.stringify(milestoneData),
        });
    }

    async getMilestone(milestoneId) {
        return this.request(`/milestones/${milestoneId}`);
    }

    async updateMilestone(milestoneId, milestoneData) {
        return this.request(`/milestones/${milestoneId}`, {
            method: 'PUT',
            body: JSON.stringify(milestoneData),
        });
    }

    async deleteMilestone(milestoneId) {
        return this.request(`/milestones/${milestoneId}`, {
            method: 'DELETE',
        });
    }

    async getTaskMilestones(taskId) {
        return this.request(`/tasks/${taskId}/milestones`);
    }

    // Chat endpoints
    async getTaskChatMessages(taskId, limit = 50, offset = 0) {
        return this.request(`/chat/task/${taskId}/messages?limit=${limit}&offset=${offset}`);
    }

    async sendTaskChatMessage(taskId, messageData) {
        return this.request(`/chat/task/${taskId}/messages`, {
            method: 'POST',
            body: JSON.stringify(messageData),
        });
    }

    async getUserTaskChatRooms() {
        return this.request('/chat/task-rooms');
    }

    async sendDirectMessage(recipientId, messageData) {
        return this.request(`/chat/direct/${recipientId}/messages`, {
            method: 'POST',
            body: JSON.stringify(messageData),
        });
    }

    async getDirectMessages(otherUserId, limit = 50, offset = 0) {
        return this.request(`/chat/direct/${otherUserId}/messages?limit=${limit}&offset=${offset}`);
    }

    // Check if user is authenticated
    isAuthenticated() {
        return !!this.token;
    }
}

// Create global API client instance
const api = new APIClient();