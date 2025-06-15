// Main Application Class
class HIVEApp {
    constructor() {
        this.currentUser = null;
        this.projects = [];
        this.filteredProjects = [];
        this.currentFilter = 'all';
        this.searchQuery = '';
        this.dashboardStats = null;
        this.categories = new Set();
        
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

        // Project creation (using task modal for now, should create dedicated project modal later)
        document.getElementById('createProjectBtn').addEventListener('click', () => this.showTaskModal());
        document.getElementById('fabBtn').addEventListener('click', () => this.showTaskModal());
        document.getElementById('taskForm').addEventListener('submit', (e) => this.handleCreateTask(e));
        document.getElementById('settingsBtn').addEventListener('click', () => router.navigate('/settings'));
        document.getElementById('messagesBtn').addEventListener('click', () => router.navigate('/messages'));
        document.getElementById('notificationsBtn').addEventListener('click', () => router.navigate('/notifications'));
        document.getElementById('walletScore').addEventListener('click', () => router.navigate('/wallet'));
        
        // Impact score should go to impact history page
        document.querySelector('.impact-score').addEventListener('click', () => router.navigate('/impact'));
        document.getElementById('addSkillForm').addEventListener('submit', (e) => this.handleAddSkill(e));
        document.getElementById('currentSkills').addEventListener('click', (e) => this.handleRemoveSkill(e));
        
        // Master Plan Import
        document.getElementById('importMasterPlanBtn').addEventListener('click', () => this.showMasterPlanModal());

        // Search functionality
        document.getElementById('taskSearch').addEventListener('input', (e) => this.handleSearch(e));
        document.getElementById('clearSearch').addEventListener('click', () => this.clearSearch());

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
            
            // Show/hide TaskMaster layers based on permissions
            this.updateTaskMasterAccess();
            
            // Render user skills
            this.renderUserSkills();
        }
    }

    // Update TaskMaster access based on user permissions
    updateTaskMasterAccess() {
        const taskMasterSection = document.querySelector('.section-header:nth-of-type(3)'); // TaskMaster Layers section
        const taskMasterGroup = taskMasterSection?.nextElementSibling;
        
        if (this.currentUser && this.currentUser.permissions) {
            const hasTaskMasterAccess = this.currentUser.permissions.some(permission => 
                ['view_protocols', 'view_implementations', 'view_projects', 'full_access'].includes(permission)
            );
            
            if (hasTaskMasterAccess) {
                // Show TaskMaster section
                if (taskMasterSection) taskMasterSection.style.display = 'block';
                if (taskMasterGroup) taskMasterGroup.style.display = 'block';
                
                // Add user role badge to show access level
                const roleIndicator = document.createElement('div');
                roleIndicator.className = 'role-indicator';
                roleIndicator.innerHTML = `
                    <div style="padding: 4px 8px; background: rgba(76, 175, 80, 0.1); color: #2e7d32; border-radius: 6px; font-size: 11px; margin-top: 8px; text-align: center;">
                        ${this.currentUser.role}
                    </div>
                `;
                
                // Remove existing role indicator
                const existingIndicator = document.querySelector('.role-indicator');
                if (existingIndicator) existingIndicator.remove();
                
                // Add new role indicator after TaskMaster section
                if (taskMasterGroup) {
                    taskMasterGroup.after(roleIndicator);
                }
            } else {
                // Hide TaskMaster section for regular users
                if (taskMasterSection) taskMasterSection.style.display = 'none';
                if (taskMasterGroup) taskMasterGroup.style.display = 'none';
            }
        }
    }

    // Load initial data
    async loadInitialData() {
        try {
            await Promise.all([
                this.loadProjects(),
                this.loadDashboardStats(),
                this.loadOnlineUsers(),
                this.loadActiveTasks()
            ]);
        } catch (error) {
            console.error('Error loading initial data:', error);
            // Don't show error notification if projects actually loaded
            if (!this.projects || this.projects.length === 0) {
                this.showNotification('Failed to load projects', 'error');
            }
        }
    }

    // Project management
    async loadProjects() {
        try {
            this.projects = await api.getProjects();
            this.updateCategories();
            this.filterProjects();
            this.updateProjectCounts();
        } catch (error) {
            console.error('Failed to load projects:', error);
            this.showNotification('Failed to load projects', 'error');
        }
    }

    async refreshProjects() {
        await this.loadProjects();
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

    filterProjects() {
        const filter = this.currentFilter;
        let filtered = [];
        
        if (filter === 'all') {
            filtered = [...this.projects];
        } else if (['urgent', 'high', 'medium', 'low'].includes(filter)) {
            // Priority filtering
            filtered = this.projects.filter(project => project.priority === filter);
        } else if (this.categories.has(filter)) {
            // Dynamic category filtering
            filtered = this.projects.filter(project => project.category === filter);
        } else if (['my-created', 'my-active', 'my-completed', 'assigned-to-me'].includes(filter)) {
            // My Work filtering
            switch (filter) {
                case 'my-created':
                    filtered = this.projects.filter(project => project.owner_id === this.currentUser?.id);
                    break;
                case 'my-active':
                    filtered = this.projects.filter(project => 
                        project.assignee_id === this.currentUser?.id && 
                        ['planning', 'active'].includes(project.status)
                    );
                    break;
                case 'my-completed':
                    filtered = this.projects.filter(project => 
                        (project.owner_id === this.currentUser?.id || project.assignee_id === this.currentUser?.id) && 
                        project.status === 'completed'
                    );
                    break;
                case 'assigned-to-me':
                    filtered = this.projects.filter(project => project.assignee_id === this.currentUser?.id);
                    break;
            }
        } else if (filter.startsWith('skill:')) {
            // Skill filtering
            const skill = filter.substring(6);
            filtered = this.projects.filter(project => 
                project.required_skills && project.required_skills.includes(skill)
            );
        } else {
            filtered = this.projects.filter(project => project.status === filter);
        }
        
        // Apply search filter if there's a search query
        if (this.searchQuery.trim()) {
            const query = this.searchQuery.toLowerCase().trim();
            filtered = filtered.filter(project => 
                project.title.toLowerCase().includes(query) ||
                project.description.toLowerCase().includes(query) ||
                (project.category && project.category.toLowerCase().includes(query)) ||
                (project.required_skills && project.required_skills.some(skill => 
                    skill.toLowerCase().includes(query)
                ))
            );
        }
        
        this.filteredProjects = filtered;
        this.renderProjects();
    }

    updateProjectCounts() {
        if (!this.currentUser) return;
        
        const counts = {
            all: this.projects.length,
            urgent: this.projects.filter(p => p.priority === 'urgent').length,
            high: this.projects.filter(p => p.priority === 'high').length,
            medium: this.projects.filter(p => p.priority === 'medium').length,
            low: this.projects.filter(p => p.priority === 'low').length,
            myCreated: this.projects.filter(p => p.owner_id === this.currentUser.id).length,
            myActive: this.projects.filter(p => 
                p.assignee_id === this.currentUser.id && 
                ['planning', 'active'].includes(p.status)
            ).length,
            myCompleted: this.projects.filter(p => 
                (p.owner_id === this.currentUser.id || p.assignee_id === this.currentUser.id) && 
                p.status === 'completed'
            ).length,
            assignedToMe: this.projects.filter(p => p.assignee_id === this.currentUser.id).length
        };

        Object.entries(counts).forEach(([key, count]) => {
            const el = document.getElementById(`${key}Count`);
            if (el) el.textContent = count;
        });
    }

    renderProjects() {
        const container = document.getElementById('taskGrid');
        
        if (!container) {
            console.error('Project grid container not found');
            return;
        }
        
        if (this.filteredProjects.length === 0) {
            container.innerHTML = '<div class="loading">No projects found</div>';
            return;
        }

        container.innerHTML = this.filteredProjects.map(project => this.createProjectCard(project)).join('');
        
        // Add event listeners to project cards
        this.setupProjectEventListeners();
    }

    createProjectCard(project) {
        const isOwner = project.owner_id === this.currentUser?.id;
        const canAssign = isOwner && !project.assignee_id && project.status === 'planning';
        const canClaim = !project.assignee_id && project.status === 'planning' && !isOwner;
        
        // Generate skills HTML
        const skillsHtml = (project.required_skills || []).map(skill => 
            `<div class="skill-tag">${skill}</div>`
        ).join('');
        
        // Format dates
        const startDate = project.start_date ? new Date(project.start_date).toLocaleDateString() : 'TBD';
        const dueDate = project.due_date ? new Date(project.due_date).toLocaleDateString() : 'TBD';
        
        // Calculate progress
        const progressPercent = project.completed_tasks > 0 ? 
            Math.round((project.completed_tasks / project.task_count) * 100) : 0;
        
        // Determine action button
        let actionButton = '';
        
        if (canClaim) {
            actionButton = `<button class="claim-btn" data-project-id="${project.id}">Join Project</button>`;
        } else if (canAssign) {
            actionButton = `<button class="assign-btn" data-project-id="${project.id}">Assign</button>`;
        } else if (project.assignee_id === this.currentUser?.id) {
            actionButton = `<button class="update-status-btn" data-project-id="${project.id}">Update Status</button>`;
        }
        
        return `
            <div class="task-card project-card" data-project-id="${project.id}">
                <div class="task-meta">
                    <div class="task-priority priority-${project.priority}">${project.priority}</div>
                    <div class="task-type">${project.category || 'General'}</div>
                </div>
                <div class="task-title">${project.title}</div>
                <div class="task-description">
                    ${project.description || 'No description provided'}
                </div>
                <div class="project-progress">
                    <div class="progress-info">
                        <span>${project.completed_tasks || 0}/${project.task_count || 0} tasks completed</span>
                        <span>${progressPercent}%</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progressPercent}%"></div>
                    </div>
                </div>
                <div class="task-details">
                    <div class="detail-item">
                        <span class="detail-icon">📅</span>
                        <span>Start: ${startDate}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-icon">⏰</span>
                        <span>Due: ${dueDate}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-icon">👥</span>
                        <span>${project.team_size || 1} team members</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-icon">📍</span>
                        <span>${project.location || 'Global'}</span>
                    </div>
                </div>
                <div class="task-skills">
                    ${skillsHtml}
                </div>
                <div class="task-footer">
                    <div class="impact-points">+${project.impact_points || 100} Impact</div>
                    <div class="task-actions">
                        ${actionButton}
                        ${isOwner ? `<button class="delete-btn" data-project-id="${project.id}">Delete</button>` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    setupProjectEventListeners() {
        // Project card clicks - navigate to project page
        const projectCards = document.querySelectorAll('.project-card');
        
        projectCards.forEach(card => {
            card.addEventListener('click', (e) => {
                // Don't navigate if clicking on action buttons or their children
                if (e.target.tagName === 'BUTTON' || e.target.closest('button')) {
                    return;
                }
                
                const projectId = card.dataset.projectId;
                
                if (projectId && router && router.navigate) {
                    router.navigate(`/project/${projectId}`);
                }
            });
        });

        // Claim buttons (Join Project)
        document.querySelectorAll('.claim-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleJoinProject(e));
        });

        // Assign buttons
        document.querySelectorAll('.assign-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleAssignProject(e));
        });

        // Update status buttons
        document.querySelectorAll('.update-status-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleUpdateProjectStatus(e));
        });

        // Delete buttons
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleDeleteProject(e));
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
            
            await this.loadProjects();
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
                await this.loadProjects();
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
                await this.loadProjects();
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
                await this.loadProjects();
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
            await this.loadProjects();
            this.hideTaskModal();
            this.showNotification('Task created successfully!');
            
            // Reset form
            document.getElementById('taskForm').reset();
        } catch (error) {
            errorEl.textContent = error.message;
        }
    }

    // Project handlers
    async handleJoinProject(e) {
        e.stopPropagation();
        const projectId = e.target.dataset.projectId;
        
        try {
            await api.updateProject(projectId, { assignee_id: this.currentUser.id });
            await this.loadProjects();
            this.showNotification('Successfully joined project!');
        } catch (error) {
            console.error('Failed to join project:', error);
            this.showNotification('Failed to join project', 'error');
        }
    }

    async handleAssignProject(e) {
        e.stopPropagation();
        const projectId = e.target.dataset.projectId;
        
        // TODO: Implement project assignment UI
        this.showNotification('Project assignment feature coming soon!');
    }

    async handleUpdateProjectStatus(e) {
        e.stopPropagation();
        const projectId = e.target.dataset.projectId;
        
        // TODO: Implement project status update UI
        this.showNotification('Project status update feature coming soon!');
    }

    async handleDeleteProject(e) {
        e.stopPropagation();
        const projectId = e.target.dataset.projectId;
        
        if (confirm('Are you sure you want to delete this project?')) {
            try {
                await api.deleteProject(projectId);
                await this.loadProjects();
                this.showNotification('Project deleted successfully!');
            } catch (error) {
                console.error('Failed to delete project:', error);
                this.showNotification('Failed to delete project', 'error');
            }
        }
    }

    // Filter handling
    handleFilterClick(e) {
        document.querySelectorAll('.filter-item').forEach(item => item.classList.remove('active'));
        document.querySelectorAll('.skill-tag').forEach(tag => tag.classList.remove('active'));
        
        const filterItem = e.currentTarget;
        filterItem.classList.add('active');
        this.currentFilter = filterItem.dataset.filter;
        this.filterProjects();
    }

    handleSkillFilterClick(skillTag) {
        document.querySelectorAll('.filter-item').forEach(item => item.classList.remove('active'));

        const skill = skillTag.textContent;
        const wasActive = skillTag.classList.contains('active');
        
        document.querySelectorAll('.skill-tag').forEach(tag => tag.classList.remove('active'));

        if (wasActive) {
            // If the skill was active, deselect it and show all projects
            this.currentFilter = 'all';
            document.querySelector('.filter-item[data-filter="all"]').classList.add('active');
        } else {
            skillTag.classList.add('active');
            this.currentFilter = `skill:${skill}`;
        }
        
        this.filterProjects();
    }

    // Update categories from project data
    updateCategories() {
        this.categories.clear();
        
        // Extract unique categories from projects and normalize them to skill-based categories
        this.projects.forEach(project => {
            if (project.category && project.category.trim()) {
                const normalizedCategory = this.normalizeCategory(project.category.trim());
                this.categories.add(normalizedCategory);
            }
            
            // Also extract from required skills to create skill-based categories
            if (project.required_skills && Array.isArray(project.required_skills)) {
                project.required_skills.forEach(skill => {
                    const skillCategory = this.skillToCategory(skill);
                    if (skillCategory) {
                        this.categories.add(skillCategory);
                    }
                });
            }
        });
        
        // Add some default skill-based categories if none exist
        if (this.categories.size === 0) {
            ['Software Development', 'UI/UX Design', 'Project Management', 'Data Analysis', 'Problem Solving'].forEach(cat => {
                this.categories.add(cat);
            });
        }
        
        this.renderCategories();
    }
    
    // Normalize category names to skill-based categories
    normalizeCategory(category) {
        const categoryMap = {
            'Backend Development': 'Software Development',
            'Frontend Development': 'Software Development', 
            'User Interface': 'UI/UX Design',
            'Real-time Features': 'Software Development',
            'Communication Features': 'Software Development',
            'Data & Infrastructure': 'Data Analysis',
            'Authentication & Security': 'Software Development',
            'Authorization & Access Control': 'Software Development',
            'Core Features': 'Software Development',
            'File Management': 'Software Development',
            'General Development': 'Software Development'
        };
        
        return categoryMap[category] || category;
    }
    
    // Convert skills to categories
    skillToCategory(skill) {
        const skillLower = skill.toLowerCase();
        
        if (skillLower.includes('python') || skillLower.includes('javascript') || 
            skillLower.includes('react') || skillLower.includes('node') ||
            skillLower.includes('programming') || skillLower.includes('development') ||
            skillLower.includes('coding') || skillLower.includes('backend') ||
            skillLower.includes('frontend') || skillLower.includes('api')) {
            return 'Software Development';
        }
        
        if (skillLower.includes('design') || skillLower.includes('ui') || 
            skillLower.includes('ux') || skillLower.includes('interface') ||
            skillLower.includes('wireframe') || skillLower.includes('mockup')) {
            return 'UI/UX Design';
        }
        
        if (skillLower.includes('project') || skillLower.includes('management') || 
            skillLower.includes('planning') || skillLower.includes('coordination') ||
            skillLower.includes('scrum') || skillLower.includes('agile')) {
            return 'Project Management';
        }
        
        if (skillLower.includes('data') || skillLower.includes('analysis') || 
            skillLower.includes('analytics') || skillLower.includes('database') ||
            skillLower.includes('sql') || skillLower.includes('statistics')) {
            return 'Data Analysis';
        }
        
        if (skillLower.includes('problem') || skillLower.includes('solving') || 
            skillLower.includes('debugging') || skillLower.includes('troubleshooting') ||
            skillLower.includes('critical thinking')) {
            return 'Problem Solving';
        }
        
        return null; // Don't create category for unrecognized skills
    }

    // Render category filters dynamically
    renderCategories() {
        const categoryContainer = document.getElementById('categoryFilters');
        if (!categoryContainer) return;
        
        if (this.categories.size === 0) {
            categoryContainer.innerHTML = `
                <div class="no-categories" style="padding: 12px; color: #888; font-style: italic;">
                    Categories will appear after importing projects
                </div>
            `;
            return;
        }
        
        const categoryIcons = {
            'Software Development': '💻',
            'UI/UX Design': '🎨',
            'Project Management': '📋',
            'Data Analysis': '📊',
            'Problem Solving': '🧩',
            'DevOps': '⚙️',
            'Quality Assurance': '🔍',
            'Technical Writing': '📝',
            'Business Analysis': '💼',
            'Security': '🔐'
        };
        
        const categoryColors = [
            { bg: '#e8f5e9', color: '#2e7d32' },
            { bg: '#e3f2fd', color: '#1976d2' },
            { bg: '#fff3e0', color: '#f57c00' },
            { bg: '#f1f8e9', color: '#558b2f' },
            { bg: '#e8eaf6', color: '#3f51b5' },
            { bg: '#e0f2f1', color: '#00695c' },
            { bg: '#fce4ec', color: '#c2185b' },
            { bg: '#f3e5f5', color: '#7b1fa2' }
        ];
        
        const categoriesArray = Array.from(this.categories).sort();
        const categoryHtml = categoriesArray.map((category, index) => {
            const colorIndex = index % categoryColors.length;
            const colors = categoryColors[colorIndex];
            const icon = categoryIcons[category] || '📋';
            const slug = category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            
            return `
                <div class="filter-item" data-filter="${category}">
                    <div class="filter-icon" style="background: ${colors.bg}; color: ${colors.color};">${icon}</div>
                    <span>${category}</span>
                </div>
            `;
        }).join('');
        
        categoryContainer.innerHTML = categoryHtml;
        
        // Re-attach event listeners for new category items
        categoryContainer.querySelectorAll('.filter-item').forEach(item => {
            item.addEventListener('click', (e) => this.handleFilterClick(e));
        });
    }

    // Search handling
    handleSearch(e) {
        this.searchQuery = e.target.value;
        const clearBtn = document.getElementById('clearSearch');
        
        if (this.searchQuery.trim()) {
            clearBtn.style.display = 'block';
        } else {
            clearBtn.style.display = 'none';
        }
        
        this.filterProjects();
    }

    clearSearch() {
        const searchInput = document.getElementById('taskSearch');
        const clearBtn = document.getElementById('clearSearch');
        
        searchInput.value = '';
        this.searchQuery = '';
        clearBtn.style.display = 'none';
        
        this.filterProjects();
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
                    <div class="member-email" onclick="app.openDirectMessage('${user.id}', '${user.email}')" 
                         style="cursor: pointer; color: #4ecdc4; text-decoration: underline;" 
                         title="Click to send direct message">💬 ${user.email}</div>
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

    openDirectMessage(userId, userEmail) {
        // Create DM modal
        const modal = document.createElement('div');
        modal.className = 'modal dm-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        `;

        modal.innerHTML = `
            <div style="
                background: rgba(68, 68, 68, 0.95);
                border-radius: 16px;
                padding: 0;
                max-width: 600px;
                width: 90%;
                max-height: 80vh;
                border: 1px solid rgba(78, 205, 196, 0.2);
                display: flex;
                flex-direction: column;
                overflow: hidden;
            ">
                <!-- Header -->
                <div style="
                    background: linear-gradient(135deg, #4ecdc4 0%, #00b8a9 100%);
                    color: white;
                    padding: 16px 24px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    flex-shrink: 0;
                ">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <div style="
                            width: 40px;
                            height: 40px;
                            border-radius: 50%;
                            background: rgba(255, 255, 255, 0.2);
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            font-weight: bold;
                            font-size: 14px;
                        ">${userEmail.substring(0, 2).toUpperCase()}</div>
                        <div>
                            <div style="font-weight: 600; font-size: 16px;">💬 Direct Message</div>
                            <div style="font-size: 12px; opacity: 0.9;">${userEmail}</div>
                        </div>
                    </div>
                    <button onclick="this.closest('.modal').remove()" 
                            style="
                                background: rgba(255, 255, 255, 0.2);
                                border: none;
                                color: white;
                                border-radius: 8px;
                                width: 32px;
                                height: 32px;
                                cursor: pointer;
                                font-size: 16px;
                                transition: background 0.2s;
                            "
                            onmouseover="this.style.background='rgba(255, 255, 255, 0.3)'"
                            onmouseout="this.style.background='rgba(255, 255, 255, 0.2)'">
                        ✕
                    </button>
                </div>
                
                <!-- Messages Area -->
                <div id="dmMessages" style="
                    flex: 1;
                    padding: 20px;
                    overflow-y: auto;
                    background: rgba(40, 44, 52, 0.8);
                    border-bottom: 1px solid rgba(78, 205, 196, 0.1);
                ">
                    <div style="text-align: center; color: #d0d0d0; font-style: italic; margin: 40px 0;">
                        Start a conversation with ${userEmail.split('@')[0]}...
                    </div>
                </div>
                
                <!-- Message Input -->
                <div style="
                    padding: 16px 20px;
                    background: rgba(68, 68, 68, 0.9);
                    display: flex;
                    gap: 12px;
                    align-items: center;
                ">
                    <input type="text" id="dmMessageInput" placeholder="Type your message..." 
                           style="
                               flex: 1;
                               padding: 12px;
                               border: 1px solid rgba(78, 205, 196, 0.3);
                               border-radius: 8px;
                               background: rgba(68, 68, 68, 0.1);
                               color: #ffffff;
                               font-size: 14px;
                           "
                           onkeypress="if(event.key==='Enter') app.sendDirectMessage('${userId}', this.value); this.value=''; event.preventDefault();">
                    <button onclick="app.sendDirectMessage('${userId}', document.getElementById('dmMessageInput').value); document.getElementById('dmMessageInput').value='';" 
                            class="create-btn" style="padding: 12px 20px; white-space: nowrap;">
                        📤 Send
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        document.getElementById('dmMessageInput').focus();
        
        // Load existing messages if any
        this.loadDirectMessages(userId);
    }

    async loadDirectMessages(userId) {
        try {
            const messages = await api.getDirectMessages(userId);
            this.renderDirectMessages(messages);
        } catch (error) {
            console.log('No existing messages or error loading DMs:', error);
        }
    }

    renderDirectMessages(messages) {
        const container = document.getElementById('dmMessages');
        if (!container || !messages || messages.length === 0) return;

        const messagesHtml = messages.map(msg => {
            const isOwn = msg.sender_id === this.currentUser?.id;
            const timestamp = new Date(msg.created_at).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
            });
            
            return `
                <div style="
                    margin-bottom: 16px;
                    display: flex;
                    justify-content: ${isOwn ? 'flex-end' : 'flex-start'};
                ">
                    <div style="
                        max-width: 70%;
                        padding: 12px 16px;
                        border-radius: 16px;
                        background: ${isOwn ? 'linear-gradient(135deg, #4ecdc4 0%, #00b8a9 100%)' : 'rgba(68, 68, 68, 0.8)'};
                        color: white;
                        position: relative;
                    ">
                        <div style="font-size: 14px; line-height: 1.4;">${msg.content}</div>
                        <div style="font-size: 11px; opacity: 0.7; margin-top: 4px;">${timestamp}</div>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = messagesHtml;
        container.scrollTop = container.scrollHeight;
    }

    async sendDirectMessage(userId, content) {
        if (!content || !content.trim()) return;

        try {
            const messageData = { content: content.trim() };
            const response = await api.sendDirectMessage(userId, messageData);
            
            if (response) {
                this.showNotification('Message sent!');
                // Reload messages to show the new one
                this.loadDirectMessages(userId);
            }
        } catch (error) {
            console.error('Error sending DM:', error);
            this.showNotification('Failed to send message', 'error');
        }
    }

    // Navigation Modal Methods
    showMessagesModal() {
        const modal = document.createElement('div');
        modal.className = 'modal messages-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        `;

        modal.innerHTML = `
            <div style="
                background: rgba(68, 68, 68, 0.95);
                border-radius: 16px;
                padding: 0;
                max-width: 800px;
                width: 90%;
                max-height: 80vh;
                border: 1px solid rgba(78, 205, 196, 0.2);
                display: flex;
                flex-direction: column;
                overflow: hidden;
            ">
                <div style="
                    padding: 20px;
                    border-bottom: 1px solid rgba(78, 205, 196, 0.2);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    background: rgba(78, 205, 196, 0.1);
                ">
                    <h3 style="margin: 0; color: #ffffff; font-size: 20px;">💬 Messages</h3>
                    <button onclick="this.closest('.modal').remove()" style="
                        background: none;
                        border: none;
                        color: #ffffff;
                        font-size: 24px;
                        cursor: pointer;
                        padding: 0;
                        width: 30px;
                        height: 30px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    ">&times;</button>
                </div>
                <div style="
                    flex: 1;
                    padding: 20px;
                    overflow-y: auto;
                    color: #ffffff;
                ">
                    <div style="text-align: center; padding: 40px; color: #d0d0d0; font-style: italic;">
                        <div style="font-size: 48px; margin-bottom: 16px;">💬</div>
                        <p>Your direct messages will appear here.</p>
                        <p style="font-size: 14px; margin-top: 16px;">Click on a team member's email in the right sidebar to start a conversation!</p>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    }

    showNotificationsModal() {
        const modal = document.createElement('div');
        modal.className = 'modal notifications-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        `;

        modal.innerHTML = `
            <div style="
                background: rgba(68, 68, 68, 0.95);
                border-radius: 16px;
                padding: 0;
                max-width: 600px;
                width: 90%;
                max-height: 80vh;
                border: 1px solid rgba(78, 205, 196, 0.2);
                display: flex;
                flex-direction: column;
                overflow: hidden;
            ">
                <div style="
                    padding: 20px;
                    border-bottom: 1px solid rgba(78, 205, 196, 0.2);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    background: rgba(78, 205, 196, 0.1);
                ">
                    <h3 style="margin: 0; color: #ffffff; font-size: 20px;">🔔 Notifications</h3>
                    <button onclick="this.closest('.modal').remove()" style="
                        background: none;
                        border: none;
                        color: #ffffff;
                        font-size: 24px;
                        cursor: pointer;
                        padding: 0;
                        width: 30px;
                        height: 30px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    ">&times;</button>
                </div>
                <div style="
                    flex: 1;
                    padding: 20px;
                    overflow-y: auto;
                    color: #ffffff;
                ">
                    <div style="text-align: center; padding: 40px; color: #d0d0d0; font-style: italic;">
                        <div style="font-size: 48px; margin-bottom: 16px;">🔔</div>
                        <p>No new notifications</p>
                        <p style="font-size: 14px; margin-top: 16px;">Task assignments and updates will appear here.</p>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    }

    showWalletModal() {
        const modal = document.createElement('div');
        modal.className = 'modal wallet-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        `;

        modal.innerHTML = `
            <div style="
                background: rgba(68, 68, 68, 0.95);
                border-radius: 16px;
                padding: 0;
                max-width: 500px;
                width: 90%;
                max-height: 80vh;
                border: 1px solid rgba(255, 152, 0, 0.2);
                display: flex;
                flex-direction: column;
                overflow: hidden;
            ">
                <div style="
                    padding: 20px;
                    border-bottom: 1px solid rgba(255, 152, 0, 0.2);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    background: rgba(255, 152, 0, 0.1);
                ">
                    <h3 style="margin: 0; color: #ffffff; font-size: 20px;">💰 Task Credits Wallet</h3>
                    <button onclick="this.closest('.modal').remove()" style="
                        background: none;
                        border: none;
                        color: #ffffff;
                        font-size: 24px;
                        cursor: pointer;
                        padding: 0;
                        width: 30px;
                        height: 30px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    ">&times;</button>
                </div>
                <div style="
                    flex: 1;
                    padding: 20px;
                    overflow-y: auto;
                    color: #ffffff;
                ">
                    <div style="text-align: center; margin-bottom: 24px;">
                        <div style="font-size: 72px; margin-bottom: 16px;">💰</div>
                        <div style="font-size: 32px; font-weight: bold; color: #ff9800; margin-bottom: 8px;">0 Credits</div>
                        <p style="color: #d0d0d0; margin: 0;">Current Balance</p>
                    </div>
                    
                    <div style="background: rgba(255, 152, 0, 0.1); border-radius: 12px; padding: 20px; margin-bottom: 20px;">
                        <h4 style="margin: 0 0 12px 0; color: #ff9800;">How to earn credits:</h4>
                        <ul style="margin: 0; padding-left: 20px; color: #d0d0d0;">
                            <li>Complete assigned tasks</li>
                            <li>Achieve task milestones</li>
                            <li>Contribute to community projects</li>
                            <li>Help other team members</li>
                        </ul>
                    </div>
                    
                    <div style="background: rgba(78, 205, 196, 0.1); border-radius: 12px; padding: 20px;">
                        <h4 style="margin: 0 0 12px 0; color: #4ecdc4;">Recent Activity:</h4>
                        <p style="color: #d0d0d0; margin: 0; font-style: italic;">No recent transactions</p>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    }

    showSettingsModal() {
        this.renderUserSkills(); // Make sure skills are up-to-date
        document.getElementById('settingsModal').classList.add('show');
    }

    hideSettingsModal() {
        document.getElementById('settingsModal').classList.remove('show');
    }

    // Master Plan Import Modal
    showMasterPlanModal() {
        const modal = document.getElementById('masterPlanModal');
        if (modal) {
            modal.classList.add('show');
            this.setupMasterPlanEventListeners();
        }
    }

    hideMasterPlanModal() {
        const modal = document.getElementById('masterPlanModal');
        if (modal) {
            modal.classList.remove('show');
            this.resetMasterPlanModal();
        }
    }

    setupMasterPlanEventListeners() {
        // Upload zone
        const uploadZone = document.getElementById('uploadZone');
        const fileInput = document.getElementById('masterPlanFileInput');
        
        if (uploadZone && fileInput) {
            uploadZone.addEventListener('click', () => fileInput.click());
            
            uploadZone.addEventListener('dragover', (e) => {
                e.preventDefault();
                uploadZone.classList.add('dragover');
            });
            
            uploadZone.addEventListener('dragleave', () => {
                uploadZone.classList.remove('dragover');
            });
            
            uploadZone.addEventListener('drop', (e) => {
                e.preventDefault();
                uploadZone.classList.remove('dragover');
                const files = e.dataTransfer.files;
                if (files.length > 0) {
                    this.handleMasterPlanFile(files[0]);
                }
            });
            
            fileInput.addEventListener('change', (e) => {
                if (e.target.files.length > 0) {
                    this.handleMasterPlanFile(e.target.files[0]);
                }
            });
        }

        // Parse button
        const parseBtn = document.getElementById('parseMasterPlanBtn');
        if (parseBtn) {
            parseBtn.addEventListener('click', () => this.parseMasterPlan());
        }

        // Cancel button
        const cancelBtn = document.getElementById('cancelImportBtn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.hideMasterPlanModal());
        }

        // Confirm import button
        const confirmBtn = document.getElementById('confirmImportBtn');
        if (confirmBtn) {
            confirmBtn.addEventListener('click', () => this.confirmMasterPlanImport());
        }

        // Back to upload button
        const backBtn = document.getElementById('backToUploadBtn');
        if (backBtn) {
            backBtn.addEventListener('click', () => this.showUploadSection());
        }
    }

    async handleMasterPlanFile(file) {
        if (!file.name.endsWith('.md') && !file.name.endsWith('.markdown')) {
            this.showImportError('Please select a markdown file (.md or .markdown)');
            return;
        }

        try {
            const content = await this.readFileContent(file);
            document.getElementById('masterPlanContent').value = content;
            this.showNotification('File loaded successfully!');
        } catch (error) {
            this.showImportError('Failed to read file: ' + error.message);
        }
    }

    readFileContent(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });
    }

    async parseMasterPlan() {
        const content = document.getElementById('masterPlanContent').value.trim();
        
        if (!content) {
            this.showImportError('Please provide master plan content');
            return;
        }

        try {
            this.showImportLoading('Parsing master plan...');
            
            const response = await api.post('/import/master-plan', {
                content: content,
                format: 'markdown'
            });

            this.hideImportLoading();

            if (response.status === 'success') {
                this.previewData = response.preview;
                this.showImportPreview(response.preview);
            } else {
                this.showImportError(response.message || 'Failed to parse master plan');
            }
        } catch (error) {
            this.hideImportLoading();
            this.showImportError('Error parsing master plan: ' + error.message);
        }
    }

    showImportPreview(preview) {
        document.querySelector('.import-section').style.display = 'none';
        document.getElementById('previewSection').style.display = 'block';
        
        const previewContainer = document.getElementById('importPreview');
        let html = '<div class="preview-summary">';
        html += `<p><strong>Summary:</strong> ${preview.waypoints?.length || 0} waypoints, ${preview.projects?.length || 0} projects, ${preview.tasks?.length || 0} tasks</p>`;
        html += '</div>';
        
        if (preview.waypoints) {
            html += '<div class="preview-waypoints"><h5>Waypoints:</h5>';
            preview.waypoints.forEach(wp => {
                html += `<div class="preview-item">📍 ${wp.name}</div>`;
            });
            html += '</div>';
        }
        
        if (preview.projects) {
            html += '<div class="preview-projects"><h5>Projects:</h5>';
            preview.projects.forEach(proj => {
                html += `<div class="preview-item">📂 ${proj.name}</div>`;
            });
            html += '</div>';
        }
        
        if (preview.tasks) {
            html += '<div class="preview-tasks"><h5>Sample Tasks:</h5>';
            preview.tasks.slice(0, 5).forEach(task => {
                html += `<div class="preview-item">✓ ${task.title} (${task.priority} priority)</div>`;
            });
            if (preview.tasks.length > 5) {
                html += `<div class="preview-item">... and ${preview.tasks.length - 5} more tasks</div>`;
            }
            html += '</div>';
        }
        
        previewContainer.innerHTML = html;
    }

    async confirmMasterPlanImport() {
        if (!this.previewData) {
            this.showImportError('No preview data available');
            return;
        }

        try {
            this.showImportLoading('Importing tasks...');
            
            const response = await api.post('/import/confirm', {
                preview_data: this.previewData
            });

            this.hideImportLoading();

            if (response.status === 'success') {
                const projectsCount = response.imported_projects || 0;
                const tasksCount = response.imported_tasks || 0;
                const totalCount = response.total_imported || response.imported_count || 0;
                
                let message = `Successfully imported ${totalCount} items!`;
                if (projectsCount > 0 && tasksCount > 0) {
                    message = `Successfully imported ${projectsCount} projects and ${tasksCount} tasks!`;
                } else if (projectsCount > 0) {
                    message = `Successfully imported ${projectsCount} projects!`;
                } else if (tasksCount > 0) {
                    message = `Successfully imported ${tasksCount} tasks!`;
                }
                
                this.showNotification(message);
                this.hideMasterPlanModal();
                await this.loadProjects(); // Refresh projects
            } else {
                this.showImportError(response.message || 'Failed to import');
            }
        } catch (error) {
            this.hideImportLoading();
            this.showImportError('Error importing tasks: ' + error.message);
        }
    }

    showUploadSection() {
        document.querySelector('.import-section').style.display = 'block';
        document.getElementById('previewSection').style.display = 'none';
        this.clearImportError();
    }

    resetMasterPlanModal() {
        document.getElementById('masterPlanContent').value = '';
        document.getElementById('masterPlanFileInput').value = '';
        document.querySelector('.import-section').style.display = 'block';
        document.getElementById('previewSection').style.display = 'none';
        this.clearImportError();
        this.previewData = null;
    }

    showImportError(message) {
        const errorEl = document.getElementById('importError');
        if (errorEl) {
            errorEl.textContent = message;
            errorEl.style.display = 'block';
        }
    }

    clearImportError() {
        const errorEl = document.getElementById('importError');
        if (errorEl) {
            errorEl.style.display = 'none';
            errorEl.textContent = '';
        }
    }

    showImportLoading(message) {
        const parseBtn = document.getElementById('parseMasterPlanBtn');
        const confirmBtn = document.getElementById('confirmImportBtn');
        
        if (parseBtn) {
            parseBtn.disabled = true;
            parseBtn.textContent = message;
        }
        if (confirmBtn) {
            confirmBtn.disabled = true;
            confirmBtn.textContent = message;
        }
    }

    hideImportLoading() {
        const parseBtn = document.getElementById('parseMasterPlanBtn');
        const confirmBtn = document.getElementById('confirmImportBtn');
        
        if (parseBtn) {
            parseBtn.disabled = false;
            parseBtn.textContent = 'Parse Master Plan';
        }
        if (confirmBtn) {
            confirmBtn.disabled = false;
            confirmBtn.textContent = 'Import All Tasks';
        }
    }

    // Setup routing system
    setupRouting() {
        console.log('Setting up routing...');
        
        // Initialize page managers
        taskPageManager = new TaskPageManager(this);
        settingsPageManager = new SettingsPageManager(this);
        impactPageManager = new ImpactPageManager(this);
        walletPageManager = new WalletPageManager(this);
        notificationsPageManager = new NotificationsPageManager(this);
        messagesPageManager = new MessagesPageManager(this);
        
        // Make globally accessible for cleanup
        window.taskPageManager = taskPageManager;
        window.settingsPageManager = settingsPageManager;
        window.impactPageManager = impactPageManager;
        window.walletPageManager = walletPageManager;
        window.notificationsPageManager = notificationsPageManager;
        window.messagesPageManager = messagesPageManager;
        
        console.log('Page managers initialized');
        
        // Register routes
        router.register('/', () => {
            console.log('Dashboard route triggered');
            // Restore default page title
            document.title = 'HIVE - Task Management System';
            
            // Show main dashboard
            const mainContainer = document.querySelector('.main-container');
            if (mainContainer) mainContainer.style.display = 'grid';
            
            // Hide all page containers
            const taskContainer = document.getElementById('task-page-container');
            if (taskContainer) {
                taskContainer.style.display = 'none';
            }
            const settingsContainer = document.getElementById('settings-page-container');
            if (settingsContainer) {
                settingsContainer.style.display = 'none';
            }
            const importContainer = document.getElementById('import-page-container');
            if (importContainer) {
                importContainer.style.display = 'none';
            }
            const impactContainer = document.getElementById('impact-page-container');
            if (impactContainer) {
                impactContainer.style.display = 'none';
            }
            const walletContainer = document.getElementById('wallet-page-container');
            if (walletContainer) {
                walletContainer.style.display = 'none';
            }
            const notificationsContainer = document.getElementById('notifications-page-container');
            if (notificationsContainer) {
                notificationsContainer.style.display = 'none';
            }
            const messagesContainer = document.getElementById('messages-page-container');
            if (messagesContainer) {
                messagesContainer.style.display = 'none';
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
            if (params.id) {
                taskPageManager.showTaskPage(params.id);
            }
        });
        
        router.register('/settings', () => {
            console.log('Settings route triggered');
            settingsPageManager.showSettingsPage();
        });

        router.register('/impact', () => {
            console.log('Impact route triggered');
            impactPageManager.showImpactPage();
        });

        router.register('/wallet', () => {
            console.log('Wallet route triggered');
            walletPageManager.showWalletPage();
        });

        router.register('/notifications', () => {
            console.log('Notifications route triggered');
            notificationsPageManager.showNotificationsPage();
        });

        router.register('/messages', () => {
            console.log('Messages route triggered');
            messagesPageManager.showMessagesPage();
        });

        router.register('/protocols', () => {
            console.log('Protocols route triggered');
            protocolsPageManager.render();
        });

        router.register('/protocol/:id', (params) => {
            console.log('Protocol detail route triggered with params:', params);
            // TODO: Implement protocol detail page
        });

        router.register('/implementations', () => {
            console.log('Implementations route triggered');
            implementationsPageManager.render();
        });

        router.register('/implementation/:id', (params) => {
            console.log('Implementation detail route triggered with params:', params);
            // TODO: Implement implementation detail page
        });

        router.register('/projects', () => {
            console.log('Projects route triggered');
            projectsPageManager.render();
        });

        router.register('/project/:id', (params) => {
            console.log('Project route triggered with params:', params);
            if (params.id) {
                console.log('Calling projectPage.render with ID:', params.id);
                projectPage.render(params.id);
            } else {
                console.error('No project ID in route params');
            }
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