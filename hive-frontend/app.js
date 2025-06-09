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
        this.setupRouting();
        // WebSocket disabled - backend doesn't support real WebSocket
        // this.setupWebSocket();
        
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
        document.getElementById('logoutBtnInsideModal').addEventListener('click', () => this.handleLogout());

        // Auth tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchAuthTab(e));
        });

        // Task creation
        document.getElementById('createTaskBtn').addEventListener('click', () => this.showTaskModal());
        document.getElementById('fabBtn').addEventListener('click', () => this.showTaskModal());
        document.getElementById('taskForm').addEventListener('submit', (e) => this.handleCreateTask(e));
        document.getElementById('settingsBtn').addEventListener('click', () => router.navigate('/settings'));
        document.getElementById('addSkillForm').addEventListener('submit', (e) => this.handleAddSkill(e));
        document.getElementById('currentSkills').addEventListener('click', (e) => this.handleRemoveSkill(e));

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

        // Skill tag filtering
        const skillsContainer = document.querySelector('.sidebar .filter-group:last-of-type');
        skillsContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('skill-tag')) {
                this.handleSkillFilterClick(e.target);
            }
        });
    }

    // WebSocket setup removed - backend doesn't support real WebSocket

    // WebSocket message handling removed - backend doesn't support real WebSocket

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
        // WebSocket disconnect removed - backend doesn't support real WebSocket
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
        
        // WebSocket connection removed - backend doesn't support real WebSocket
    }

    // Update user interface elements
    updateUserInterface() {
        if (this.currentUser) {
            const avatar = document.getElementById('userAvatar');
            if (avatar) {
                const initials = this.currentUser.email.substring(0, 2).toUpperCase();
                avatar.textContent = initials;
            }
            
            // Update impact score
            const impactScore = document.querySelector('.impact-score');
            if (impactScore) {
                impactScore.textContent = `+${this.currentUser.impact_score || 0} Impact`;
            }
            // Render user skills
            this.renderUserSkills();
        }
    }

    // Load initial data
    async loadInitialData() {
        await Promise.all([
            this.loadTasks(),
            this.loadDashboardStats(),
            this.loadOnlineUsers(),
            this.loadActiveTasks()
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
        await this.loadActiveTasks();
    }

    async loadActiveTasks() {
        try {
            if (!this.currentUser) return;
            
            // Filter tasks assigned to current user that are in progress
            const activeTasks = this.tasks.filter(task => 
                task.assignee_id === this.currentUser.id && 
                ['in_progress', 'available'].includes(task.status)
            );
            
            this.renderActiveTasks(activeTasks);
        } catch (error) {
            console.error('Failed to load active tasks:', error);
        }
    }

    renderActiveTasks(activeTasks) {
        const container = document.getElementById('activeTasks');
        
        if (!container) {
            console.error('Active tasks container not found');
            return;
        }
        
        if (activeTasks.length === 0) {
            container.innerHTML = '<div class="active-task">No active tasks</div>';
            return;
        }
        
        container.innerHTML = activeTasks.map(task => `
            <div class="active-task" data-task-id="${task.id}">
                <div class="active-task-title">${task.title}</div>
                <div class="active-task-status">${task.status} • +${task.impact_points || 0} impact</div>
                <div class="task-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${task.status === 'in_progress' ? '60%' : '20%'}"></div>
                    </div>
                </div>
            </div>
        `).join('');
        
        // Add click handlers to active tasks
        container.querySelectorAll('.active-task[data-task-id]').forEach(taskEl => {
            taskEl.addEventListener('click', () => {
                const taskId = taskEl.dataset.taskId;
                if (taskId) {
                    router.navigate(`/task/${taskId}`);
                }
            });
        });
    }

    filterTasks() {
        const filter = this.currentFilter;
        if (filter === 'all') {
            this.filteredTasks = [...this.tasks];
        } else if (['urgent', 'high', 'medium', 'low'].includes(filter)) {
            // Priority filtering
            this.filteredTasks = this.tasks.filter(task => task.priority === filter);
        } else if (['regenerative-ag', 'clean-energy', 'circular-economy', 'restoration', 'community', 'ocean-health'].includes(filter)) {
            // Category filtering
            const categoryMap = {
                'regenerative-ag': 'Regenerative Ag',
                'clean-energy': 'Clean Energy',
                'circular-economy': 'Circular Economy',
                'restoration': 'Restoration',
                'community': 'Community',
                'ocean-health': 'Ocean Health'
            };
            this.filteredTasks = this.tasks.filter(task => task.category === categoryMap[filter]);
        } else if (['my-created', 'my-active', 'my-completed', 'assigned-to-me'].includes(filter)) {
            // My Work filtering
            switch (filter) {
                case 'my-created':
                    this.filteredTasks = this.tasks.filter(task => task.owner_id === this.currentUser?.id);
                    break;
                case 'my-active':
                    this.filteredTasks = this.tasks.filter(task => 
                        task.assignee_id === this.currentUser?.id && 
                        ['available', 'in_progress'].includes(task.status)
                    );
                    break;
                case 'my-completed':
                    this.filteredTasks = this.tasks.filter(task => 
                        (task.owner_id === this.currentUser?.id || task.assignee_id === this.currentUser?.id) && 
                        task.status === 'completed'
                    );
                    break;
                case 'assigned-to-me':
                    this.filteredTasks = this.tasks.filter(task => task.assignee_id === this.currentUser?.id);
                    break;
            }
        } else {
            this.filteredTasks = this.tasks.filter(task => task.status === filter);
        }
        this.renderTasks();
    }

    updateTaskCounts() {
        if (!this.currentUser) return;
        
        const counts = {
            all: this.tasks.length,
            urgent: this.tasks.filter(t => t.priority === 'urgent').length,
            high: this.tasks.filter(t => t.priority === 'high').length,
            medium: this.tasks.filter(t => t.priority === 'medium').length,
            low: this.tasks.filter(t => t.priority === 'low').length,
            myCreated: this.tasks.filter(t => t.owner_id === this.currentUser.id).length,
            myActive: this.tasks.filter(t => 
                t.assignee_id === this.currentUser.id && 
                ['available', 'in_progress'].includes(t.status)
            ).length,
            myCompleted: this.tasks.filter(t => 
                (t.owner_id === this.currentUser.id || t.assignee_id === this.currentUser.id) && 
                t.status === 'completed'
            ).length,
            assignedToMe: this.tasks.filter(t => t.assignee_id === this.currentUser.id).length
        };

        Object.entries(counts).forEach(([key, count]) => {
            const el = document.getElementById(`${key}Count`);
            if (el) el.textContent = count;
        });
    }

    renderTasks() {
        const container = document.getElementById('taskGrid');
        
        if (!container) {
            console.error('Task grid container not found');
            return;
        }
        
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
        const canAssign = isOwner && !task.assignee_id && task.status === 'available';
        const canClaim = !task.assignee_id && task.status === 'available' && !isOwner;
        
        // Generate skills HTML
        const skillsHtml = (task.required_skills || []).map(skill => 
            `<div class="skill-tag">${skill}</div>`
        ).join('');
        
        // Determine action button
        let actionButton = '';
        
        if (canClaim) {
            actionButton = `<button class="claim-btn" data-task-id="${task.id}">Claim Task</button>`;
        } else if (canAssign) {
            actionButton = `<button class="assign-btn" data-task-id="${task.id}">Assign</button>`;
        } else if (task.assignee_id === this.currentUser?.id) {
            actionButton = `<button class="update-status-btn" data-task-id="${task.id}">Update Status</button>`;
        } else if (isOwner && task.status === 'draft') {
            actionButton = `<button class="assign-btn" data-task-id="${task.id}">Make Available</button>`;
        }
        
        return `
            <div class="task-card" data-task-id="${task.id}">
                <div class="task-meta">
                    <div class="task-priority priority-${task.priority}">${task.priority}</div>
                    <div class="task-type">${task.category || 'General'}</div>
                </div>
                <div class="task-title">${task.title}</div>
                <div class="task-description">
                    ${task.description || 'No description provided'}
                </div>
                <div class="task-details">
                    <div class="detail-item">
                        <span class="detail-icon">⏱️</span>
                        <span>${task.estimated_hours || '2-4 hours'}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-icon">👥</span>
                        <span>${task.team_size || '3-5 collaborators'}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-icon">📍</span>
                        <span>${task.location || 'Global'}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-icon">📅</span>
                        <span>Due: ${task.due_date || '1 week'}</span>
                    </div>
                </div>
                <div class="task-skills">
                    ${skillsHtml}
                </div>
                <div class="task-footer">
                    <div class="impact-points">+${task.impact_points || 100} Impact</div>
                    <div class="task-actions">
                        ${actionButton}
                        ${isOwner ? `<button class="delete-btn" data-task-id="${task.id}">Delete</button>` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    setupTaskEventListeners() {
        // Task card clicks - navigate to task page
        document.querySelectorAll('.task-card').forEach(card => {
            card.addEventListener('click', (e) => {
                // Don't navigate if clicking on action buttons or their children
                if (e.target.tagName === 'BUTTON' || e.target.closest('button')) {
                    console.log('Button clicked, not navigating');
                    return;
                }
                
                const taskId = card.dataset.taskId;
                console.log('Task card clicked, taskId:', taskId);
                
                if (taskId) {
                    console.log('Navigating to task:', taskId);
                    if (typeof router !== 'undefined' && router.navigate) {
                        router.navigate(`/task/${taskId}`);
                    } else {
                        console.error('Router not available');
                    }
                }
            });
        });

        // Claim buttons
        document.querySelectorAll('.claim-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleClaimTask(e));
        });

        // Assign buttons
        document.querySelectorAll('.assign-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleAssignTask(e));
        });

        // Update status buttons
        document.querySelectorAll('.update-status-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleUpdateStatus(e));
        });

        // Status buttons (legacy)
        document.querySelectorAll('.status-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleUpdateStatus(e));
        });

        // Delete buttons
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleDeleteTask(e));
        });
    }

    async handleClaimTask(e) {
        e.stopPropagation();
        const taskId = e.target.dataset.taskId;
        const task = this.tasks.find(t => t.id === taskId);
        
        if (!task || !this.currentUser) return;
        
        try {
            // Claim task (this will assign and update status in one call)
            await api.claimTask(taskId);
            
            // Update user's impact score
            const newImpactScore = this.currentUser.impact_score + (task.impact_points || 0);
            this.currentUser.impact_score = newImpactScore;
            
            // Update UI
            const impactScoreEl = document.querySelector('.impact-score');
            if (impactScoreEl) {
                impactScoreEl.textContent = `+${newImpactScore} Impact`;
            }
            
            await this.loadTasks();
            await this.loadActiveTasks();
            this.showNotification(`Task claimed! +${task.impact_points || 0} impact points earned!`);
        } catch (error) {
            console.error('Failed to claim task:', error);
            this.showNotification('Failed to claim task', 'error');
        }
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
        
        const errorEl = document.getElementById('taskError');

        try {
            // Collect all form data
            const taskData = {
                // Basic information
                title: document.getElementById('taskTitle').value,
                description: document.getElementById('taskDescription').value,
                
                // Timeline & Priority
                start_date: document.getElementById('startDate').value || null,
                due_date: document.getElementById('dueDate').value || null,
                priority: document.getElementById('priority').value,
                category: document.getElementById('category').value,
                
                // Team & Authority
                team_size: parseInt(document.getElementById('teamSize').value) || 1,
                authority_level: document.getElementById('authorityLevel').value,
                
                // Scope & Impact
                scope: document.getElementById('scope').value,
                impact_points: parseInt(document.getElementById('impactPoints').value) || 10,
                location: document.getElementById('location').value || null,
                
                // Effort & Resources
                estimated_hours: parseInt(document.getElementById('estimatedHours').value) || null,
                budget: document.getElementById('budget').value || null,
                resources_needed: document.getElementById('resourcesNeeded').value || null,
                
                // Required Skills
                required_skills: document.getElementById('requiredSkills').value
                    ? document.getElementById('requiredSkills').value.split(',').map(s => s.trim()).filter(s => s)
                    : [],
                
                // Success Metrics & Deliverables
                success_metrics: document.getElementById('successMetrics').value
                    ? document.getElementById('successMetrics').value.split('\n').map(s => s.trim()).filter(s => s)
                    : [],
                deliverables: document.getElementById('deliverables').value
                    ? document.getElementById('deliverables').value.split('\n').map(s => s.trim()).filter(s => s)
                    : [],
                
                // Status (default)
                status: 'available'
            };

            await api.createTask(taskData);
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
        document.querySelectorAll('.filter-item').forEach(item => item.classList.remove('active'));
        document.querySelectorAll('.skill-tag').forEach(tag => tag.classList.remove('active'));
        
        const filterItem = e.currentTarget;
        filterItem.classList.add('active');
        this.currentFilter = filterItem.dataset.filter;
        this.filterTasks();
    }

    handleSkillFilterClick(skillTag) {
        document.querySelectorAll('.filter-item').forEach(item => item.classList.remove('active'));

        const skill = skillTag.textContent;
        const wasActive = skillTag.classList.contains('active');
        
        document.querySelectorAll('.skill-tag').forEach(tag => tag.classList.remove('active'));

        if (wasActive) {
            // If the skill was active, deselect it and show all tasks
            this.currentFilter = 'all';
            document.querySelector('.filter-item[data-filter="all"]').classList.add('active');
        } else {
            skillTag.classList.add('active');
            this.currentFilter = `skill:${skill}`;
        }
        
        this.filterTasks();
    }

    // View toggle
    toggleView(e) {
        const viewType = e.target.textContent.toLowerCase().includes('grid') ? 'grid' : 'list';
        
        document.querySelectorAll('.toggle-btn').forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');
        
        const grid = document.getElementById('taskGrid');
        if (grid) {
            if (viewType === 'grid') {
                grid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(320px, 1fr))';
            } else {
                grid.style.gridTemplateColumns = '1fr';
            }
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
        if (!container || !this.dashboardStats) return;
        
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
        
        if (!container) {
            console.error('Online users container not found');
            return;
        }
        
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

    // Skill management
    renderUserSkills() {
        const skillsSidebar = document.querySelector('.sidebar .filter-group:last-of-type');
        const skillsSettings = document.getElementById('currentSkills');
        
        if (this.currentUser && this.currentUser.skills) {
            const skillsHtml = this.currentUser.skills.map(skill => `<div class="skill-tag">${skill}</div>`).join('');
            if (skillsSidebar) {
                skillsSidebar.innerHTML = skillsHtml;
            }

            const skillsSettingsHtml = this.currentUser.skills.map(skill => `
                <div class="skill-item">
                    <span>${skill}</span>
                    <button class="remove-skill-btn" data-skill="${skill}">&times;</button>
                </div>
            `).join('');
            if (skillsSettings) {
                skillsSettings.innerHTML = skillsSettingsHtml;
            }
        } else {
            if (skillsSidebar) {
                skillsSidebar.innerHTML = '<p>No skills added yet.</p>';
            }
            if (skillsSettings) {
                skillsSettings.innerHTML = '';
            }
        }
    }

    async handleAddSkill(e) {
        e.preventDefault();
        const input = document.getElementById('newSkillInput');
        const newSkill = input.value.trim();

        if (newSkill && !this.currentUser.skills.includes(newSkill)) {
            try {
                this.currentUser.skills.push(newSkill);
                await api.updateCurrentUser({ skills: this.currentUser.skills });
                this.renderUserSkills();
                input.value = '';
                this.showNotification(`Skill "${newSkill}" added successfully!`);
            } catch (error) {
                console.error('Failed to add skill:', error);
                this.showNotification('Failed to add skill.', 'error');
                // Revert optimistic update
                this.currentUser.skills = this.currentUser.skills.filter(s => s !== newSkill);
            }
        }
    }

    async handleRemoveSkill(e) {
        if (e.target.classList.contains('remove-skill-btn')) {
            const skillToRemove = e.target.dataset.skill;
            const originalSkills = [...this.currentUser.skills];
            this.currentUser.skills = this.currentUser.skills.filter(s => s !== skillToRemove);

            try {
                await api.updateCurrentUser({ skills: this.currentUser.skills });
                this.renderUserSkills();
                this.showNotification(`Skill "${skillToRemove}" removed.`);
            } catch (error) {
                console.error('Failed to remove skill:', error);
                this.showNotification('Failed to remove skill.', 'error');
                this.currentUser.skills = originalSkills; // Revert
            }
        }
    }

    // UI helpers
    showLoginModal() {
        const modal = document.getElementById('loginModal');
        if (modal) modal.classList.add('show');
    }

    hideLoginModal() {
        const modal = document.getElementById('loginModal');
        if (modal) modal.classList.remove('show');
    }

    showTaskModal() {
        const modal = document.getElementById('taskModal');
        if (modal) modal.classList.add('show');
    }

    hideTaskModal() {
        const modal = document.getElementById('taskModal');
        if (modal) modal.classList.remove('show');
    }

    showMainInterface() {
        const container = document.querySelector('.main-container');
        if (container) container.style.display = 'grid';
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

    showSettingsModal() {
        this.renderUserSkills(); // Make sure skills are up-to-date
        document.getElementById('settingsModal').classList.add('show');
    }

    hideSettingsModal() {
        document.getElementById('settingsModal').classList.remove('show');
    }

    // Setup routing system
    setupRouting() {
        console.log('Setting up routing...');
        
        // Initialize page managers
        taskPageManager = new TaskPageManager(this);
        settingsPageManager = new SettingsPageManager(this);
        
        // Make globally accessible for cleanup
        window.taskPageManager = taskPageManager;
        window.settingsPageManager = settingsPageManager;
        
        console.log('Page managers initialized');
        
        // Register routes
        router.register('/', () => {
            console.log('Dashboard route triggered');
            // Hide all page containers
            const taskContainer = document.getElementById('task-page-container');
            if (taskContainer) {
                taskContainer.style.display = 'none';
            }
            const settingsContainer = document.getElementById('settings-page-container');
            if (settingsContainer) {
                settingsContainer.style.display = 'none';
            }
            // Restore body overflow to hidden for dashboard
            document.body.style.overflow = 'hidden';
            // Show dashboard - restore default layout
            this.showMainInterface();
            this.loadInitialData();
        });
        
        router.register('/task/:id', (params) => {
            console.log('Task route triggered with params:', params);
            // Show task page
            if (params.taskId) {
                taskPageManager.showTaskPage(params.taskId);
            }
        });
        
        router.register('/settings', () => {
            console.log('Settings route triggered');
            settingsPageManager.showSettingsPage();
        });
        
        console.log('Router initialized:', router);
        
        // Now handle the current route
        router.handleRoute();
    }
}

// Initialize the application when the page loads
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new HIVEApp();
    window.app = app; // Make available globally for WebSocket callbacks
});