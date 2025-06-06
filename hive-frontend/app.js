// Main Application Class
class HIVEApp {
    constructor() {
        this.currentUser = null;
        this.tasks = [];
        this.filteredTasks = [];
        this.currentFilter = 'all';
        this.dashboardStats = null;
        
        this.init();
    }

    // Initialize the application
    async init() {
        console.log('Initializing HIVE Application...');
        
        this.setupEventListeners();
        this.setupWebSocket();
        
        // Check if user is authenticated
        if (api.isAuthenticated()) {
            try {
                await this.loadUser();
                this.showMainInterface();
                await this.loadInitialData();
            } catch (error) {
                console.error('Failed to load user:', error);
                this.showLoginModal();
            }
        } else {
            this.showLoginModal();
        }
    }

    // Setup event listeners
    setupEventListeners() {
        // Authentication
        document.getElementById('loginForm').addEventListener('submit', (e) => this.handleLogin(e));
        document.getElementById('registerForm').addEventListener('submit', (e) => this.handleRegister(e));
        document.getElementById('logoutBtn').addEventListener('click', () => this.handleLogout());

        // Auth tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchAuthTab(e));
        });

        // Task creation
        document.getElementById('createTaskBtn').addEventListener('click', () => this.showTaskModal());
        document.getElementById('fabBtn').addEventListener('click', () => this.showTaskModal());
        document.getElementById('taskForm').addEventListener('submit', (e) => this.handleCreateTask(e));

        // Filters
        document.querySelectorAll('.filter-item').forEach(item => {
            item.addEventListener('click', (e) => this.handleFilterClick(e));
        });

        // View toggle
        document.querySelectorAll('.toggle-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.toggleView(e));
        });

        // Modal close buttons
        document.querySelectorAll('.close').forEach(btn => {
            btn.addEventListener('click', (e) => this.closeModal(e));
        });

        // Close modals when clicking outside
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal(e);
                }
            });
        });
    }

    // Setup WebSocket connection
    setupWebSocket() {
        wsManager.addMessageHandler((type, data) => {
            this.handleWebSocketMessage(type, data);
        });
    }

    // Handle WebSocket messages
    handleWebSocketMessage(type, data) {
        switch (type) {
            case 'task_update':
                this.showNotification(`Task status updated: ${data.new_status}`);
                break;
            case 'task_assignment':
                this.showNotification('Task assignment updated');
                break;
            case 'chat':
                // Handle chat messages if needed
                break;
        }
    }

    // Authentication methods
    async handleLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        const errorEl = document.getElementById('authError');

        try {
            await api.login(email, password);
            await this.loadUser();
            this.hideLoginModal();
            this.showMainInterface();
            await this.loadInitialData();
            this.showNotification('Successfully logged in!');
        } catch (error) {
            errorEl.textContent = error.message;
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        const errorEl = document.getElementById('authError');

        try {
            await api.register(email, password);
            await api.login(email, password);
            await this.loadUser();
            this.hideLoginModal();
            this.showMainInterface();
            await this.loadInitialData();
            this.showNotification('Account created successfully!');
        } catch (error) {
            errorEl.textContent = error.message;
        }
    }

    handleLogout() {
        api.removeToken();
        wsManager.disconnect();
        this.currentUser = null;
        this.showLoginModal();
        this.showNotification('Logged out successfully');
    }

    // Switch between login and register tabs
    switchAuthTab(e) {
        const tab = e.target.dataset.tab;
        
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');
        
        // Update forms
        document.querySelectorAll('.auth-form').forEach(form => form.classList.remove('active'));
        document.getElementById(`${tab}Form`).classList.add('active');
        
        // Clear error
        document.getElementById('authError').textContent = '';
    }

    // Load current user
    async loadUser() {
        this.currentUser = await api.getCurrentUser();
        this.updateUserInterface();
        
        // Connect WebSocket after user is loaded
        if (api.token) {
            wsManager.connect(api.token);
        }
    }

    // Update user interface elements
    updateUserInterface() {
        if (this.currentUser) {
            const avatar = document.getElementById('userAvatar');
            const initials = this.currentUser.email.substring(0, 2).toUpperCase();
            avatar.textContent = initials;
        }
    }

    // Load initial data
    async loadInitialData() {
        await Promise.all([
            this.loadTasks(),
            this.loadDashboardStats(),
            this.loadOnlineUsers()
        ]);
    }

    // Task management
    async loadTasks() {
        try {
            this.tasks = await api.getTasks();
            this.filterTasks();
            this.updateTaskCounts();
        } catch (error) {
            console.error('Failed to load tasks:', error);
            this.showNotification('Failed to load tasks', 'error');
        }
    }

    async refreshTasks() {
        await this.loadTasks();
    }

    filterTasks() {
        if (this.currentFilter === 'all') {
            this.filteredTasks = [...this.tasks];
        } else {
            this.filteredTasks = this.tasks.filter(task => task.status === this.currentFilter);
        }
        this.renderTasks();
    }

    updateTaskCounts() {
        const counts = {
            all: this.tasks.length,
            draft: this.tasks.filter(t => t.status === 'draft').length,
            available: this.tasks.filter(t => t.status === 'available').length,
            in_progress: this.tasks.filter(t => t.status === 'in_progress').length,
            completed: this.tasks.filter(t => t.status === 'completed').length
        };

        Object.entries(counts).forEach(([status, count]) => {
            const el = document.getElementById(`${status}Count`);
            if (el) el.textContent = count;
        });
    }

    renderTasks() {
        const container = document.getElementById('taskGrid');
        
        if (this.filteredTasks.length === 0) {
            container.innerHTML = '<div class="loading">No tasks found</div>';
            return;
        }

        container.innerHTML = this.filteredTasks.map(task => this.createTaskCard(task)).join('');
        
        // Add event listeners to task cards
        this.setupTaskEventListeners();
    }

    createTaskCard(task) {
        const isOwner = task.owner_id === this.currentUser?.id;
        const canUpdate = isOwner || task.assignee_id === this.currentUser?.id;
        
        return `
            <div class="task-card" data-task-id="${task.id}">
                <div class="task-meta">
                    <div class="task-status status-${task.status}">${task.status}</div>
                    <div class="task-type">Task</div>
                </div>
                <div class="task-title">${task.title}</div>
                <div class="task-description">${task.description || 'No description provided'}</div>
                <div class="task-footer">
                    <div class="task-info">
                        <small>Created: ${new Date(task.created_at).toLocaleDateString()}</small>
                        ${task.assignee_id ? `<br><small>Assigned</small>` : ''}
                    </div>
                    <div class="task-actions">
                        ${isOwner && !task.assignee_id ? 
                            `<button class="action-btn assign-btn" data-task-id="${task.id}">Assign</button>` : ''
                        }
                        ${canUpdate ? 
                            `<button class="action-btn status-btn" data-task-id="${task.id}">Update Status</button>` : ''
                        }
                        ${isOwner ? 
                            `<button class="action-btn delete-btn" data-task-id="${task.id}">Delete</button>` : ''
                        }
                    </div>
                </div>
            </div>
        `;
    }

    setupTaskEventListeners() {
        // Assign buttons
        document.querySelectorAll('.assign-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleAssignTask(e));
        });

        // Status buttons
        document.querySelectorAll('.status-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleUpdateStatus(e));
        });

        // Delete buttons
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleDeleteTask(e));
        });
    }

    async handleAssignTask(e) {
        e.stopPropagation();
        const taskId = e.target.dataset.taskId;
        
        // For now, assign to current user
        if (this.currentUser) {
            try {
                await api.assignTask(taskId, this.currentUser.id);
                await this.loadTasks();
                this.showNotification('Task assigned successfully!');
            } catch (error) {
                this.showNotification('Failed to assign task', 'error');
            }
        }
    }

    async handleUpdateStatus(e) {
        e.stopPropagation();
        const taskId = e.target.dataset.taskId;
        const task = this.tasks.find(t => t.id === taskId);
        
        if (!task) return;
        
        // Simple status progression
        const statusFlow = {
            'draft': 'available',
            'available': 'in_progress',
            'in_progress': 'completed'
        };
        
        const newStatus = statusFlow[task.status];
        if (newStatus) {
            try {
                await api.updateTaskStatus(taskId, newStatus);
                await this.loadTasks();
                this.showNotification(`Task status updated to ${newStatus}!`);
            } catch (error) {
                this.showNotification('Failed to update task status', 'error');
            }
        }
    }

    async handleDeleteTask(e) {
        e.stopPropagation();
        const taskId = e.target.dataset.taskId;
        
        if (confirm('Are you sure you want to delete this task?')) {
            try {
                await api.deleteTask(taskId);
                await this.loadTasks();
                this.showNotification('Task deleted successfully!');
            } catch (error) {
                this.showNotification('Failed to delete task', 'error');
            }
        }
    }

    async handleCreateTask(e) {
        e.preventDefault();
        
        const title = document.getElementById('taskTitle').value;
        const description = document.getElementById('taskDescription').value;
        const errorEl = document.getElementById('taskError');

        try {
            await api.createTask({ title, description });
            await this.loadTasks();
            this.hideTaskModal();
            this.showNotification('Task created successfully!');
            
            // Reset form
            document.getElementById('taskForm').reset();
        } catch (error) {
            errorEl.textContent = error.message;
        }
    }

    // Filter handling
    handleFilterClick(e) {
        const filter = e.currentTarget.dataset.filter;
        if (!filter) return;
        
        // Update active filter
        document.querySelectorAll('.filter-item').forEach(item => item.classList.remove('active'));
        e.currentTarget.classList.add('active');
        
        this.currentFilter = filter;
        this.filterTasks();
    }

    // View toggle
    toggleView(e) {
        const isGrid = e.target.textContent.includes('Grid');
        
        document.querySelectorAll('.toggle-btn').forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');
        
        const grid = document.getElementById('taskGrid');
        if (isGrid) {
            grid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(320px, 1fr))';
        } else {
            grid.style.gridTemplateColumns = '1fr';
        }
    }

    // Dashboard data
    async loadDashboardStats() {
        try {
            this.dashboardStats = await api.getDashboardSummary();
            this.renderDashboardStats();
        } catch (error) {
            console.error('Failed to load dashboard stats:', error);
        }
    }

    renderDashboardStats() {
        const container = document.getElementById('dashboardStats');
        if (!this.dashboardStats) return;
        
        const { tasks, users } = this.dashboardStats;
        
        container.innerHTML = `
            <div class="stat-item">
                <span>Total Tasks:</span>
                <span class="stat-value">${tasks.total}</span>
            </div>
            <div class="stat-item">
                <span>Completed:</span>
                <span class="stat-value">${tasks.by_status.completed || 0}</span>
            </div>
            <div class="stat-item">
                <span>In Progress:</span>
                <span class="stat-value">${tasks.by_status.in_progress || 0}</span>
            </div>
            <div class="stat-item">
                <span>Total Users:</span>
                <span class="stat-value">${users.total_users}</span>
            </div>
            <div class="stat-item">
                <span>Online Users:</span>
                <span class="stat-value">${users.online_users}</span>
            </div>
        `;
    }

    async loadOnlineUsers() {
        try {
            const users = await api.getDashboardOnlineUsers();
            this.renderOnlineUsers(users);
        } catch (error) {
            console.error('Failed to load online users:', error);
        }
    }

    renderOnlineUsers(users) {
        const container = document.getElementById('onlineUsers');
        
        if (users.length === 0) {
            container.innerHTML = '<div class="team-member">No users online</div>';
            return;
        }
        
        container.innerHTML = users.map(user => `
            <div class="team-member">
                <div class="member-avatar">${user.email.substring(0, 2).toUpperCase()}</div>
                <div class="member-info">
                    <div class="member-name">${user.email.split('@')[0]}</div>
                    <div class="member-email">${user.email}</div>
                </div>
                <div class="member-status status-online">Online</div>
            </div>
        `).join('');
    }

    // UI helpers
    showLoginModal() {
        document.getElementById('loginModal').classList.add('show');
    }

    hideLoginModal() {
        document.getElementById('loginModal').classList.remove('show');
    }

    showTaskModal() {
        document.getElementById('taskModal').classList.add('show');
    }

    hideTaskModal() {
        document.getElementById('taskModal').classList.remove('show');
    }

    showMainInterface() {
        document.querySelector('.main-container').style.display = 'grid';
    }

    closeModal(e) {
        const modal = e.target.closest('.modal');
        if (modal) {
            modal.classList.remove('show');
        }
    }

    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 32px;
            background: ${type === 'error' ? '#f44336' : '#4caf50'};
            color: white;
            padding: 16px 24px;
            border-radius: 12px;
            font-weight: 600;
            z-index: 10000;
            transform: translateX(400px);
            transition: transform 0.3s ease;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
            max-width: 300px;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        setTimeout(() => {
            notification.style.transform = 'translateX(400px)';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Initialize the application when the page loads
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new HIVEApp();
    window.app = app; // Make available globally for WebSocket callbacks
});