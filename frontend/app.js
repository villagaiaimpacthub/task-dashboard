// Main Application Class
class HIVEApp {
    constructor() {
        this.currentUser = null;
        this.tasks = [];
        this.filteredTasks = [];
        this.currentFilter = 'all';
        this.dashboardStats = null;
        this.currentView = 'tasks';
        this.userData = null;
        
        this.init();
    }

    // Initialize the application
    async init() {
        console.log('Initializing HIVE Application...');
        
        this.setupEventListeners();
        this.setupWebSocket();
        
        // Check if user is authenticated
        if (contractApi.isAuthenticated()) {
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

    // Setup navigation handlers
    setupNavigationHandlers() {
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                const view = e.target.dataset.view;
                this.switchView(view);
            });
        });
        
        // Notification button
        const notificationBtn = document.getElementById('notificationBtn');
        if (notificationBtn) {
            notificationBtn.addEventListener('click', () => this.toggleNotifications());
        }
    }

    switchView(view) {
        this.currentView = view;
        
        // Update nav active state
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.toggle('active', link.dataset.view === view);
        });
        
        // Show/hide content based on view
        const mainContent = document.querySelector('.main-content');
        const contentHeader = mainContent.querySelector('.content-header h2');
        
        switch(view) {
            case 'tasks':
                contentHeader.textContent = 'Available Tasks';
                this.showTasksView();
                break;
            case 'teamspace':
                contentHeader.textContent = 'Teamspace';
                this.showTeamspaceView();
                break;
            case 'settings':
                contentHeader.textContent = 'Settings';
                this.showSettingsView();
                break;
            case 'create-task':
                contentHeader.textContent = 'Create New Task';
                this.showCreateTaskPage();
                break;
            case 'task-detail':
                contentHeader.textContent = 'Task Details';
                this.showTaskDetailPage();
                break;
            case 'messages':
                contentHeader.textContent = 'Messages';
                this.showMessagesPage();
                break;
            case 'help':
                contentHeader.textContent = 'Help Request';
                this.showHelpPage();
                break;
        }
    }

    // Utility method to clear main content and show specific elements
    clearMainContent() {
        const mainContent = document.querySelector('.main-content');
        
        // Hide all existing elements
        const actionButtons = mainContent.querySelector('.action-buttons');
        const searchContainer = mainContent.querySelector('.search-container');
        const taskGrid = mainContent.querySelector('#taskGrid');
        
        if (actionButtons) actionButtons.style.display = 'none';
        if (searchContainer) searchContainer.style.display = 'none';
        if (taskGrid) taskGrid.style.display = 'none';
        
        // Remove any dynamic content
        ['settings-content', 'page-content', 'create-task-content', 'task-detail-content', 'messages-content', 'help-content'].forEach(className => {
            const element = mainContent.querySelector(`.${className}`);
            if (element) element.remove();
        });
        
        return mainContent;
    }

    showTasksView() {
        const mainContent = this.clearMainContent();
        
        // Show task view elements
        mainContent.querySelector('.action-buttons').style.display = 'flex';
        mainContent.querySelector('.search-container').style.display = 'block';
        mainContent.querySelector('#taskGrid').style.display = 'grid';
        
        // Reload tasks
        this.loadTasks();
    }

    showTeamspaceView() {
        const mainContent = this.clearMainContent();
        
        // Show task grid for team tasks
        const taskGrid = mainContent.querySelector('#taskGrid');
        taskGrid.style.display = 'grid';
        taskGrid.innerHTML = '<div class="loading">Loading team tasks...</div>';
        
        // Load team-relevant tasks
        this.loadTeamTasks();
    }

    showSettingsView() {
        const mainContent = this.clearMainContent();
        
        // Create settings content
        this.createSettingsPage();
    }

    showCreateTaskPage() {
        const mainContent = this.clearMainContent();
        this.createTaskCreationPage(mainContent);
    }

    showTaskDetailPage() {
        const mainContent = this.clearMainContent();
        
        if (this.selectedTaskId) {
            this.createTaskDetailPage(mainContent, this.selectedTaskId);
        } else {
            mainContent.innerHTML = '<div class="error-message">No task selected</div>';
        }
    }

    showMessagesPage() {
        const mainContent = this.clearMainContent();
        this.createMessagesPage(mainContent);
    }

    showHelpPage() {
        const mainContent = this.clearMainContent();
        this.createHelpPage(mainContent);
    }

    toggleNotifications() {
        // Show notifications in right sidebar
        this.showNotificationsSidebar();
    }

    showNotificationsSidebar() {
        // Sample notifications data
        const notifications = [
            {
                id: 'notif1',
                type: 'comment',
                title: 'New comment on Solar Panel Analysis',
                message: 'Bob commented: "Great progress on the efficiency metrics!"',
                time: '2 minutes ago',
                unread: true,
                taskId: '2'
            },
            {
                id: 'notif2', 
                type: 'task_assignment',
                title: 'Task assigned to you',
                message: 'You have been assigned to "Ocean Cleanup Strategy"',
                time: '1 hour ago', 
                unread: true,
                taskId: '3'
            },
            {
                id: 'notif3',
                type: 'chat',
                title: 'Team chat message',
                message: 'Carol: "Can we schedule a sync meeting for the garden project?"',
                time: '3 hours ago',
                unread: false,
                taskId: '1'
            },
            {
                id: 'notif4',
                type: 'help_request',
                title: 'Help request from team member',
                message: 'Alice needs help with solar panel calculations',
                time: '5 hours ago',
                unread: true,
                projectId: 'proj1'
            },
            {
                id: 'notif5',
                type: 'task_update',
                title: 'Task status updated',
                message: 'Permaculture Garden task moved to In Progress',
                time: '1 day ago',
                unread: false,
                taskId: '1'
            }
        ];

        this.renderNotificationsSidebar(notifications);
    }

    renderNotificationsSidebar(notifications) {
        // Find or create notifications section in right panel
        const rightPanel = document.querySelector('.right-panel');
        let notificationsSection = rightPanel.querySelector('.notifications-section');
        
        if (!notificationsSection) {
            notificationsSection = document.createElement('div');
            notificationsSection.className = 'panel-section notifications-section';
            rightPanel.insertBefore(notificationsSection, rightPanel.firstChild);
        }

        const unreadCount = notifications.filter(n => n.unread).length;
        
        notificationsSection.innerHTML = `
            <div class="panel-title">
                Notifications 
                ${unreadCount > 0 ? `<span class="unread-count">(${unreadCount} new)</span>` : ''}
            </div>
            <div class="notifications-list">
                ${notifications.length > 0 ? notifications.map(notif => this.renderNotificationItem(notif)).join('') : 
                  '<div class="no-notifications">No notifications</div>'}
            </div>
            <div class="notifications-actions">
                <button class="mark-all-read-btn" onclick="app.markAllNotificationsRead()">Mark all read</button>
                <button class="clear-notifications-btn" onclick="app.clearNotifications()">Clear all</button>
            </div>
        `;

        // Update notification badge
        const notificationBadge = document.getElementById('notificationBadge');
        if (notificationBadge) {
            notificationBadge.textContent = unreadCount;
            notificationBadge.style.display = unreadCount > 0 ? 'block' : 'none';
        }

        // Scroll notifications into view
        notificationsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    renderNotificationItem(notification) {
        const iconMap = {
            comment: '💬',
            task_assignment: '📋', 
            chat: '💭',
            help_request: '🆘',
            task_update: '✅'
        };

        return `
            <div class="notification-item ${notification.unread ? 'unread' : ''}" data-notification-id="${notification.id}">
                <div class="notification-icon">${iconMap[notification.type] || '📢'}</div>
                <div class="notification-content">
                    <div class="notification-title">${notification.title}</div>
                    <div class="notification-message">${notification.message}</div>
                    <div class="notification-time">${notification.time}</div>
                </div>
                <div class="notification-actions">
                    ${notification.unread ? `<button class="mark-read-btn" onclick="app.markNotificationRead('${notification.id}')">×</button>` : ''}
                </div>
            </div>
        `;
    }

    markNotificationRead(notificationId) {
        const notificationItem = document.querySelector(`[data-notification-id="${notificationId}"]`);
        if (notificationItem) {
            notificationItem.classList.remove('unread');
            const markReadBtn = notificationItem.querySelector('.mark-read-btn');
            if (markReadBtn) markReadBtn.remove();
            
            // Update badge count
            this.updateNotificationBadge();
        }
    }

    markAllNotificationsRead() {
        document.querySelectorAll('.notification-item.unread').forEach(item => {
            item.classList.remove('unread');
            const markReadBtn = item.querySelector('.mark-read-btn');
            if (markReadBtn) markReadBtn.remove();
        });
        this.updateNotificationBadge();
    }

    clearNotifications() {
        const notificationsList = document.querySelector('.notifications-list');
        if (notificationsList) {
            notificationsList.innerHTML = '<div class="no-notifications">No notifications</div>';
        }
        this.updateNotificationBadge();
    }

    updateNotificationBadge() {
        const unreadCount = document.querySelectorAll('.notification-item.unread').length;
        const notificationBadge = document.getElementById('notificationBadge');
        if (notificationBadge) {
            notificationBadge.textContent = unreadCount;
            notificationBadge.style.display = unreadCount > 0 ? 'block' : 'none';
        }
        
        // Update panel title
        const unreadCountEl = document.querySelector('.unread-count');
        if (unreadCountEl) {
            if (unreadCount > 0) {
                unreadCountEl.textContent = `(${unreadCount} new)`;
            } else {
                unreadCountEl.remove();
            }
        }
    }

    // Setup event listeners
    setupEventListeners() {
        this.setupNavigationHandlers();
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
        document.getElementById('createTaskBtn').addEventListener('click', () => this.switchView('create-task'));
        document.getElementById('fabBtn').addEventListener('click', () => this.switchView('create-task'));
        document.getElementById('taskForm').addEventListener('submit', (e) => this.handleCreateTask(e));
        document.getElementById('settingsBtn').addEventListener('click', () => this.switchView('settings'));
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

        // Search functionality
        this.setupSearchListeners();

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
        
        // Direct Messages
        const openMessagesBtn = document.getElementById('openMessagesBtn');
        const startDmBtn = document.getElementById('startDmBtn');
        
        if (openMessagesBtn) {
            openMessagesBtn.addEventListener('click', () => this.openDirectMessages());
        }
        if (startDmBtn) {
            startDmBtn.addEventListener('click', () => this.openDirectMessages());
        }

        // File Upload (event delegation will be used when modal opens)
        document.addEventListener('click', (e) => {
            if (e.target.id === 'uploadFileBtn') {
                this.handleFileUpload();
            }
            if (e.target.classList.contains('download-btn')) {
                this.handleFileDownload(e.target.dataset.fileId);
            }
            if (e.target.classList.contains('delete-file-btn')) {
                this.handleFileDelete(e.target.dataset.fileId);
            }
            if (e.target.id === 'taskHelpBtn') {
                this.showHelpRequestModal();
            }
        });

        // Help Request Form
        document.addEventListener('submit', (e) => {
            if (e.target.id === 'helpRequestForm') {
                e.preventDefault();
                this.handleHelpRequest(e);
            }
        });

        // Help Request Modal close
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('cancel-btn')) {
                this.closeModal(e);
            }
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
            await contractApi.login(email, password);
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
            await contractApi.register(email, password);
            await contractApi.login(email, password);
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
        contractApi.removeToken();
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
        this.currentUser = await contractApi.getCurrentUser();
        this.userData = this.currentUser;
        this.updateUserInterface();
        
        // Connect WebSocket after user is loaded
        if (contractApi.token) {
            wsManager.connect(contractApi.token);
        }
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
            
            // Update notification badge
            const notificationBadge = document.getElementById('notificationBadge');
            if (notificationBadge) {
                const notificationCount = 5; // Demo: 3 comments + 2 chat messages
                notificationBadge.textContent = notificationCount;
                notificationBadge.style.display = notificationCount > 0 ? 'block' : 'none';
            }
            
            // Render user skills
            this.renderUserSkills();
        }
    }

    // Load initial data
    async loadInitialData() {
        try {
            console.log('Loading initial data...');
            
            // Load tasks first, then others depend on it
            await this.loadTasks();
            
            // Load other data in parallel
            await Promise.all([
                this.loadDashboardStats(),
                this.loadOnlineUsers(),
                this.loadActiveTasks()
            ]);
            
            console.log('Initial data loaded successfully');
        } catch (error) {
            console.error('Failed to load initial data:', error);
            this.showNotification('Failed to load data. Please refresh the page.', 'error');
        }
    }

    async loadTeamTasks() {
        try {
            // Get all tasks and projects relevant to the team
            const allTasks = await contractApi.getTasks();
            const currentUserId = this.currentUser?.id || 'user1';
            
            // Define demo projects for the teamspace
            const projects = [
                {
                    id: 'proj1',
                    name: 'Solar Panel Optimization',
                    description: 'Improving efficiency and performance of solar installations',
                    status: 'active',
                    priority: 'high',
                    team_members: ['user1', 'user2'],
                    progress: 65
                },
                {
                    id: 'proj2', 
                    name: 'Ocean Cleanup Initiative',
                    description: 'Community-based coastal restoration and plastic removal',
                    status: 'planning',
                    priority: 'medium',
                    team_members: ['user1', 'user3'],
                    progress: 25
                },
                {
                    id: 'proj3',
                    name: 'Permaculture Garden Network',
                    description: 'Designing sustainable food systems for communities',
                    status: 'active',
                    priority: 'high', 
                    team_members: ['user1'],
                    progress: 40
                }
            ];

            // Filter tasks relevant to team projects and add project association
            const teamTasks = allTasks.map(task => {
                // Assign tasks to projects based on category/keywords
                let projectId = null;
                if (task.category === 'Clean Energy' || task.title.toLowerCase().includes('solar')) {
                    projectId = 'proj1';
                } else if (task.category === 'Ocean Health' || task.title.toLowerCase().includes('ocean')) {
                    projectId = 'proj2';
                } else if (task.category === 'Regenerative Ag' || task.title.toLowerCase().includes('garden')) {
                    projectId = 'proj3';
                }
                
                return { ...task, project_id: projectId };
            }).filter(task => {
                // Only show tasks relevant to user's projects
                return task.owner_id === currentUserId ||
                       task.assignee_id === currentUserId ||
                       (task.project_id && projects.some(p => 
                           p.team_members.includes(currentUserId) && p.id === task.project_id
                       ));
            });

            this.renderTeamspaceProjects(projects, teamTasks);
            
        } catch (error) {
            console.error('Error loading team tasks:', error);
            document.getElementById('taskGrid').innerHTML = '<div class="error">Failed to load team projects</div>';
        }
    }

    renderTeamspaceProjects(projects, tasks) {
        const taskGrid = document.getElementById('taskGrid');
        taskGrid.innerHTML = '';

        if (projects.length === 0) {
            taskGrid.innerHTML = '<div class="no-tasks">No team projects found. Create or join projects to see them here!</div>';
            return;
        }

        projects.forEach(project => {
            const projectTasks = tasks.filter(t => t.project_id === project.id);
            const unassignedTasks = tasks.filter(t => !t.project_id && (t.owner_id === this.currentUser?.id || t.assignee_id === this.currentUser?.id));

            const projectSection = document.createElement('div');
            projectSection.className = 'project-section';
            projectSection.innerHTML = `
                <div class="project-header" data-project-id="${project.id}">
                    <div class="project-info">
                        <div class="project-title">
                            <span class="project-name">${project.name}</span>
                            <span class="project-status status-${project.status}">${project.status}</span>
                            <span class="project-priority priority-${project.priority}">${project.priority}</span>
                        </div>
                        <div class="project-description">${project.description}</div>
                        <div class="project-meta">
                            <span class="project-progress">
                                <div class="progress-bar-small">
                                    <div class="progress-fill-small" style="width: ${project.progress}%"></div>
                                </div>
                                ${project.progress}% Complete
                            </span>
                            <span class="project-tasks-count">${projectTasks.length} tasks</span>
                            <span class="project-team">Team: ${project.team_members.length} members</span>
                        </div>
                    </div>
                    <div class="project-actions">
                        <button class="toggle-project-btn" data-project-id="${project.id}">
                            <span class="toggle-icon">▼</span>
                        </button>
                    </div>
                </div>
                <div class="project-tasks" id="project-${project.id}-tasks" style="display: block;">
                    ${projectTasks.length > 0 ? `
                        <div class="project-tasks-grid">
                            ${projectTasks.map(task => this.createTaskCard(task)).join('')}
                        </div>
                    ` : `
                        <div class="no-project-tasks">No tasks in this project yet. <button class="add-task-btn" data-project-id="${project.id}">Add Task</button></div>
                    `}
                </div>
            `;
            taskGrid.appendChild(projectSection);
        });

        // Add unassigned tasks section if any
        if (tasks.filter(t => !t.project_id).length > 0) {
            const unassignedSection = document.createElement('div');
            unassignedSection.className = 'project-section';
            unassignedSection.innerHTML = `
                <div class="project-header">
                    <div class="project-info">
                        <div class="project-title">
                            <span class="project-name">Unassigned Tasks</span>
                            <span class="project-status status-pending">needs assignment</span>
                        </div>
                        <div class="project-description">Tasks that haven't been assigned to a project yet</div>
                    </div>
                    <div class="project-actions">
                        <button class="toggle-project-btn" data-project-id="unassigned">
                            <span class="toggle-icon">▼</span>
                        </button>
                    </div>
                </div>
                <div class="project-tasks" id="project-unassigned-tasks" style="display: block;">
                    <div class="project-tasks-grid">
                        ${tasks.filter(t => !t.project_id).map(task => this.createTaskCard(task)).join('')}
                    </div>
                </div>
            `;
            taskGrid.appendChild(unassignedSection);
        }

        // Setup project interaction handlers
        this.setupTeamspaceEventListeners();
        this.setupTaskEventListeners();
    }

    setupTeamspaceEventListeners() {
        // Project toggle functionality
        document.querySelectorAll('.toggle-project-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const projectId = e.currentTarget.dataset.projectId;
                this.toggleProject(projectId);
            });
        });

        // Add task buttons
        document.querySelectorAll('.add-task-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const projectId = e.currentTarget.dataset.projectId;
                this.showTaskModal(projectId);
            });
        });

        // Project header clicks (for expansion/collapse)
        document.querySelectorAll('.project-header').forEach(header => {
            header.addEventListener('click', (e) => {
                if (!e.target.closest('.project-actions')) {
                    const projectId = header.dataset.projectId;
                    if (projectId) this.toggleProject(projectId);
                }
            });
        });
    }

    toggleProject(projectId) {
        const tasksContainer = document.getElementById(`project-${projectId}-tasks`);
        const toggleIcon = document.querySelector(`[data-project-id="${projectId}"] .toggle-icon`);
        
        if (tasksContainer) {
            const isVisible = tasksContainer.style.display !== 'none';
            tasksContainer.style.display = isVisible ? 'none' : 'block';
            if (toggleIcon) {
                toggleIcon.textContent = isVisible ? '▶' : '▼';
            }
        }
    }

    createSettingsPage() {
        const mainContent = document.querySelector('.main-content');
        const settingsContent = document.createElement('div');
        settingsContent.className = 'settings-content';
        settingsContent.innerHTML = `
            <div class="settings-page">
                <div class="settings-section skills-management">
                    <h3>Your Skills</h3>
                    <div id="currentSkills" class="current-skills">
                        <!-- User skills will be loaded here -->
                    </div>
                    <form id="addSkillForm" class="add-skill-form">
                        <input type="text" id="newSkillInput" placeholder="Add a new skill (e.g., Python)" required>
                        <button type="submit" class="submit-btn">Add Skill</button>
                    </form>
                </div>

                <div class="settings-section profile-settings">
                    <h3>Profile</h3>
                    <div class="form-group">
                        <label for="displayName">Display Name</label>
                        <input type="text" id="displayName" placeholder="Enter your display name">
                    </div>
                    <div class="form-group">
                        <label for="userBio">Bio</label>
                        <textarea id="userBio" rows="3" placeholder="Tell us a little about yourself"></textarea>
                    </div>
                </div>

                <div class="settings-section notification-settings">
                    <h3>Notifications</h3>
                    <div class="toggle-group">
                        <label for="taskAssignmentNotifs">Task assignments</label>
                        <label class="switch">
                            <input type="checkbox" id="taskAssignmentNotifs" checked>
                            <span class="slider round"></span>
                        </label>
                    </div>
                    <div class="toggle-group">
                        <label for="taskUpdateNotifs">Task status updates</label>
                        <label class="switch">
                            <input type="checkbox" id="taskUpdateNotifs" checked>
                            <span class="slider round"></span>
                        </label>
                    </div>
                    <div class="toggle-group">
                        <label for="commentNotifs">New comments on your tasks</label>
                        <label class="switch">
                            <input type="checkbox" id="commentNotifs" checked>
                            <span class="slider round"></span>
                        </label>
                    </div>
                    <div class="toggle-group">
                        <label for="chatNotifs">Team chat messages</label>
                        <label class="switch">
                            <input type="checkbox" id="chatNotifs" checked>
                            <span class="slider round"></span>
                        </label>
                    </div>
                </div>

                <div class="settings-section theme-settings">
                    <h3>Theme</h3>
                    <div class="toggle-group">
                        <label for="themeToggle">Dark Mode</label>
                        <label class="switch">
                            <input type="checkbox" id="themeToggle">
                            <span class="slider round"></span>
                        </label>
                    </div>
                </div>

                <div class="settings-section">
                    <h3>Account</h3>
                    <button id="logoutBtnSettings" class="logout-btn" style="background: #e57373; width: auto;">Logout</button>
                </div>
            </div>
        `;
        
        mainContent.appendChild(settingsContent);
        
        // Load user skills and setup event listeners
        this.loadUserSkills();
        this.setupSettingsEventListeners();
    }

    loadUserSkills() {
        // This would normally fetch from API, using current user data
        const currentSkillsEl = document.getElementById('currentSkills');
        if (currentSkillsEl && this.currentUser && this.currentUser.skills) {
            currentSkillsEl.innerHTML = this.currentUser.skills.map(skill => `
                <div class="skill-item">
                    <span>${skill}</span>
                    <button class="remove-skill-btn" data-skill="${skill}">&times;</button>
                </div>
            `).join('');
        }
    }

    setupSettingsEventListeners() {
        // Add skill form
        const addSkillForm = document.getElementById('addSkillForm');
        if (addSkillForm) {
            addSkillForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const skillInput = document.getElementById('newSkillInput');
                const skill = skillInput.value.trim();
                if (skill) {
                    await this.addUserSkill(skill);
                    skillInput.value = '';
                }
            });
        }
        
        // Logout button in settings
        const logoutBtn = document.getElementById('logoutBtnSettings');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }
        
        // Profile updates
        const displayNameInput = document.getElementById('displayName');
        const userBioInput = document.getElementById('userBio');
        
        if (displayNameInput) {
            displayNameInput.value = this.currentUser?.name || this.currentUser?.email?.split('@')[0] || '';
            displayNameInput.addEventListener('blur', () => {
                // Save display name (would normally call API)
                console.log('Saving display name:', displayNameInput.value);
            });
        }
        
        if (userBioInput) {
            userBioInput.value = this.currentUser?.bio || '';
            userBioInput.addEventListener('blur', () => {
                // Save bio (would normally call API)
                console.log('Saving bio:', userBioInput.value);
            });
        }
    }

    // Create Task Creation Page
    createTaskCreationPage(mainContent) {
        const taskCreationContent = document.createElement('div');
        taskCreationContent.className = 'create-task-content page-content';
        taskCreationContent.innerHTML = `
            <div class="task-creation-page">
                <div class="page-header">
                    <button class="back-btn" onclick="app.switchView('tasks')">← Back to Tasks</button>
                </div>
                
                <form id="taskCreationForm" class="task-form-page">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="taskTitle">Task Title *</label>
                            <input type="text" id="taskTitle" name="title" required placeholder="Enter a clear, actionable title">
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group full-width">
                            <label for="taskDescription">Description *</label>
                            <textarea id="taskDescription" name="description" rows="4" required placeholder="Describe what needs to be done and any important context"></textarea>
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="taskCategory">Category</label>
                            <select id="taskCategory" name="category">
                                <option value="">Select category</option>
                                <option value="Regenerative Ag">Regenerative Agriculture</option>
                                <option value="Clean Energy">Clean Energy</option>
                                <option value="Ocean Health">Ocean Health</option>
                                <option value="Climate Action">Climate Action</option>
                                <option value="Biodiversity">Biodiversity</option>
                                <option value="Sustainable Tech">Sustainable Technology</option>
                                <option value="Community">Community Building</option>
                                <option value="Education">Education</option>
                                <option value="Research">Research</option>
                                <option value="Policy">Policy & Advocacy</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="taskPriority">Priority</label>
                            <select id="taskPriority" name="priority">
                                <option value="low">Low</option>
                                <option value="medium" selected>Medium</option>
                                <option value="high">High</option>
                                <option value="urgent">Urgent</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="taskLocation">Location</label>
                            <input type="text" id="taskLocation" name="location" placeholder="e.g., Global, North America, San Francisco">
                        </div>
                        
                        <div class="form-group">
                            <label for="taskTeamSize">Team Size</label>
                            <input type="text" id="taskTeamSize" name="team_size" placeholder="e.g., 2-4 people">
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="taskEstimatedHours">Estimated Hours</label>
                            <input type="text" id="taskEstimatedHours" name="estimated_hours" placeholder="e.g., 4-6 hours">
                        </div>
                        
                        <div class="form-group">
                            <label for="taskDueDate">Due Date</label>
                            <input type="text" id="taskDueDate" name="due_date" placeholder="e.g., 2 weeks, March 15">
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="taskImpactPoints">Impact Points</label>
                            <input type="number" id="taskImpactPoints" name="impact_points" value="100" min="0" max="1000">
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group full-width">
                            <label for="taskSkills">Required Skills (one per line)</label>
                            <textarea id="taskSkills" name="required_skills" rows="3" placeholder="Python\nData Analysis\nProject Management"></textarea>
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group full-width">
                            <label for="taskDOD">Definition of Done (one criteria per line)</label>
                            <textarea id="taskDOD" name="definition_of_done" rows="4" placeholder="All requirements documented\nCode reviewed and tested\nDeployment completed\nDocumentation updated"></textarea>
                        </div>
                    </div>
                    
                    <div class="form-actions">
                        <button type="button" class="cancel-btn" onclick="app.switchView('tasks')">Cancel</button>
                        <button type="submit" class="submit-btn">Create Task</button>
                    </div>
                </form>
            </div>
        `;
        
        mainContent.appendChild(taskCreationContent);
        
        // Setup form submission
        document.getElementById('taskCreationForm').addEventListener('submit', (e) => this.handleCreateTaskPage(e));
    }

    // Create Task Detail Page
    async createTaskDetailPage(mainContent, taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) {
            mainContent.innerHTML = '<div class="error-message">Task not found</div>';
            return;
        }

        const taskDetailContent = document.createElement('div');
        taskDetailContent.className = 'task-detail-content page-content';
        taskDetailContent.innerHTML = `
            <div class="task-detail-page">
                <div class="page-header">
                    <button class="back-btn" onclick="app.switchView('tasks')">← Back to Tasks</button>
                    <div class="task-actions">
                        ${task.status === 'available' ? `<button class="claim-btn primary-btn" data-task-id="${task.id}">Claim Task</button>` : ''}
                        ${task.assignee_id === this.currentUser?.id ? `
                            <select class="status-select" data-task-id="${task.id}">
                                <option value="in_progress" ${task.status === 'in_progress' ? 'selected' : ''}>In Progress</option>
                                <option value="completed" ${task.status === 'completed' ? 'selected' : ''}>Completed</option>
                                <option value="on_hold" ${task.status === 'on_hold' ? 'selected' : ''}>On Hold</option>
                            </select>
                        ` : ''}
                        <button class="help-btn secondary-btn" data-task-id="${task.id}">I Need Help</button>
                    </div>
                </div>
                
                <div class="task-detail-grid">
                    <div class="task-main-info">
                        <h1 class="task-title">${task.title}</h1>
                        <p class="task-description">${task.description}</p>
                        
                        <div class="task-metadata">
                            <div class="metadata-row">
                                <span class="label">Status:</span>
                                <span class="status-badge ${task.status}">${task.status.replace('_', ' ')}</span>
                            </div>
                            <div class="metadata-row">
                                <span class="label">Priority:</span>
                                <span class="priority-badge ${task.priority}">${task.priority}</span>
                            </div>
                            <div class="metadata-row">
                                <span class="label">Category:</span>
                                <span>${task.category}</span>
                            </div>
                            <div class="metadata-row">
                                <span class="label">Impact Points:</span>
                                <span class="impact-points">${task.impact_points}</span>
                            </div>
                            <div class="metadata-row">
                                <span class="label">Estimated Time:</span>
                                <span>${task.estimated_hours}</span>
                            </div>
                            <div class="metadata-row">
                                <span class="label">Location:</span>
                                <span>${task.location}</span>
                            </div>
                            <div class="metadata-row">
                                <span class="label">Team Size:</span>
                                <span>${task.team_size}</span>
                            </div>
                            <div class="metadata-row">
                                <span class="label">Due Date:</span>
                                <span>${task.due_date}</span>
                            </div>
                        </div>
                        
                        ${task.required_skills?.length ? `
                            <div class="required-skills">
                                <h3>Required Skills</h3>
                                <div class="skills-list">
                                    ${task.required_skills.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
                                </div>
                            </div>
                        ` : ''}
                        
                        ${task.definition_of_done?.length ? `
                            <div class="definition-of-done">
                                <h3>Definition of Done</h3>
                                <div class="dod-list">
                                    ${task.definition_of_done.map(item => `
                                        <div class="dod-item">
                                            <input type="checkbox" ${item.completed ? 'checked' : ''} data-dod-id="${item.id}" data-task-id="${task.id}">
                                            <span>${item.text}</span>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}
                    </div>
                    
                    <div class="task-sidebar">
                        <div class="file-management">
                            <h3>Files</h3>
                            <div class="file-upload-area">
                                <input type="file" id="fileUpload" style="display: none;" multiple>
                                <button class="upload-btn" onclick="document.getElementById('fileUpload').click()">Upload Files</button>
                            </div>
                            <div id="filesList" class="files-list">
                                <!-- Files will be loaded here -->
                            </div>
                        </div>
                        
                        <div class="communication-section">
                            <div class="comm-tabs">
                                <button class="comm-tab active" data-tab="comments">Comments</button>
                                <button class="comm-tab" data-tab="chat">Team Chat</button>
                            </div>
                            
                            <div class="comm-content">
                                <div id="commentsTab" class="comm-panel active">
                                    <div id="commentsList" class="comments-list">
                                        <!-- Comments will be loaded here -->
                                    </div>
                                    <form id="commentForm" class="comment-form">
                                        <textarea placeholder="Add a comment..." required></textarea>
                                        <button type="submit">Post Comment</button>
                                    </form>
                                </div>
                                
                                <div id="chatTab" class="comm-panel">
                                    <div id="chatMessages" class="chat-messages">
                                        <!-- Chat messages will be loaded here -->
                                    </div>
                                    <form id="chatForm" class="chat-form">
                                        <input type="text" placeholder="Type a message..." required>
                                        <button type="submit">Send</button>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        mainContent.appendChild(taskDetailContent);
        
        // Setup event listeners for the task detail page
        this.setupTaskDetailEventListeners(task);
        
        // Load task-specific data
        this.loadTaskFiles(taskId);
        this.loadTaskComments(taskId);
        this.loadTaskChat(taskId);
    }

    async addUserSkill(skill) {
        try {
            if (this.currentUser.skills.includes(skill)) {
                this.showNotification('Skill already exists', 'error');
                return;
            }
            
            this.currentUser.skills.push(skill);
            this.showNotification(`Skill "${skill}" added successfully!`);
            this.loadUserSkills();
            this.renderUserSkills();
        } catch (error) {
            console.error('Failed to add skill:', error);
            this.showNotification('Failed to add skill', 'error');
        }
    }

    // Create Messages Page
    createMessagesPage(mainContent) {
        const messagesContent = document.createElement('div');
        messagesContent.className = 'messages-content page-content';
        messagesContent.innerHTML = `
            <div class="messages-page">
                <div class="page-header">
                    <button class="back-btn" onclick="app.switchView('tasks')">← Back to Tasks</button>
                </div>
                
                <div class="messages-layout">
                    <div class="conversations-sidebar">
                        <div class="search-users">
                            <input type="text" id="userSearch" placeholder="Search users...">
                            <button id="newConversationBtn">New Conversation</button>
                        </div>
                        
                        <div class="conversations-list">
                            <div class="conversation-item active">
                                <div class="user-avatar">B</div>
                                <div class="conversation-info">
                                    <div class="user-name">Bob Energy</div>
                                    <div class="last-message">Great work on the solar analysis!</div>
                                    <div class="timestamp">2 min ago</div>
                                </div>
                                <div class="unread-count">1</div>
                            </div>
                            
                            <div class="conversation-item">
                                <div class="user-avatar">C</div>
                                <div class="conversation-info">
                                    <div class="user-name">Carol Ocean</div>
                                    <div class="last-message">Can we sync on the cleanup strategy?</div>
                                    <div class="timestamp">1 hour ago</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="chat-area">
                        <div class="chat-header">
                            <div class="chat-user-info">
                                <div class="user-avatar">B</div>
                                <div class="user-details">
                                    <div class="user-name">Bob Energy</div>
                                    <div class="user-status">● Online</div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="chat-messages">
                            <div class="message received">
                                <div class="message-content">
                                    <p>Hey! I saw your progress on the permaculture design. The soil analysis looks comprehensive.</p>
                                    <span class="message-time">10:30 AM</span>
                                </div>
                            </div>
                            
                            <div class="message sent">
                                <div class="message-content">
                                    <p>Thanks! I'm particularly excited about the water management system we mapped out.</p>
                                    <span class="message-time">10:32 AM</span>
                                </div>
                            </div>
                            
                            <div class="message received">
                                <div class="message-content">
                                    <p>Great work on the solar analysis! The efficiency improvements you identified could save tons of carbon.</p>
                                    <span class="message-time">2 min ago</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="chat-input">
                            <form id="dmForm">
                                <input type="text" placeholder="Type a message..." required>
                                <button type="submit">Send</button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        mainContent.appendChild(messagesContent);
        
        // Setup messages event listeners
        this.setupMessagesEventListeners();
    }

    // Create Help Page
    createHelpPage(mainContent) {
        const helpContent = document.createElement('div');
        helpContent.className = 'help-content page-content';
        helpContent.innerHTML = `
            <div class="help-page">
                <div class="page-header">
                    <button class="back-btn" onclick="app.switchView('tasks')">← Back to Tasks</button>
                </div>
                
                <div class="help-form-container">
                    <h2>Request Help</h2>
                    <p>Need assistance with a task or have a question for the community? We're here to help!</p>
                    
                    <form id="helpRequestForm" class="help-form">
                        <div class="form-group">
                            <label for="helpTaskSelect">Related Task (optional)</label>
                            <select id="helpTaskSelect" name="task_id">
                                <option value="">Select a task...</option>
                                <!-- Tasks will be populated dynamically -->
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="helpCategory">Category</label>
                            <select id="helpCategory" name="category" required>
                                <option value="">Select category...</option>
                                <option value="technical">Technical Question</option>
                                <option value="resources">Need Resources</option>
                                <option value="collaboration">Looking for Collaborators</option>
                                <option value="guidance">Need Guidance</option>
                                <option value="blocked">Task Blocked</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="helpUrgency">Urgency Level</label>
                            <select id="helpUrgency" name="urgency" required>
                                <option value="low">Low - Can wait a few days</option>
                                <option value="medium" selected>Medium - Need help within 24 hours</option>
                                <option value="high">High - Need help today</option>
                                <option value="urgent">Urgent - Blocking critical work</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="helpDescription">Description</label>
                            <textarea id="helpDescription" name="description" rows="6" required 
                                placeholder="Please describe what you need help with. Include any relevant context, what you've already tried, and what kind of assistance would be most helpful."></textarea>
                        </div>
                        
                        <div class="form-group">
                            <label for="helpSkills">Specific Skills Needed (optional)</label>
                            <input type="text" id="helpSkills" name="skills" placeholder="e.g., Python, Solar Technology, Project Management">
                            <small>Separate multiple skills with commas</small>
                        </div>
                        
                        <div class="form-actions">
                            <button type="button" class="cancel-btn" onclick="app.switchView('tasks')">Cancel</button>
                            <button type="submit" class="submit-btn">Send Help Request</button>
                        </div>
                    </form>
                </div>
                
                <div class="help-tips">
                    <h3>Tips for Getting Great Help</h3>
                    <ul>
                        <li><strong>Be specific:</strong> The more details you provide, the better help you'll receive</li>
                        <li><strong>Include context:</strong> Explain what you're trying to accomplish and what you've already tried</li>
                        <li><strong>Set clear urgency:</strong> Help teammates prioritize when to respond</li>
                        <li><strong>Tag relevant skills:</strong> This helps the right experts find your request</li>
                        <li><strong>Follow up:</strong> Update your request with new information or mark it resolved</li>
                    </ul>
                </div>
            </div>
        `;
        
        mainContent.appendChild(helpContent);
        
        // Populate task options
        this.populateHelpTaskOptions();
        
        // Setup help form event listener
        document.getElementById('helpRequestForm').addEventListener('submit', (e) => this.handleHelpRequest(e));
    }

    // Setup event listeners for new page systems
    setupTaskDetailEventListeners(task) {
        // Claim button
        const claimBtn = document.querySelector('.claim-btn');
        if (claimBtn) {
            claimBtn.addEventListener('click', (e) => this.handleClaimTask(e));
        }
        
        // Status select
        const statusSelect = document.querySelector('.status-select');
        if (statusSelect) {
            statusSelect.addEventListener('change', (e) => this.handleStatusChange(e));
        }
        
        // Help button
        const helpBtn = document.querySelector('.help-btn');
        if (helpBtn) {
            helpBtn.addEventListener('click', (e) => {
                this.selectedTaskId = task.id;
                this.switchView('help');
            });
        }
        
        // Communication tabs
        document.querySelectorAll('.comm-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabName = e.target.dataset.tab;
                this.switchCommTab(tabName);
            });
        });
        
        // Comment form
        const commentForm = document.getElementById('commentForm');
        if (commentForm) {
            commentForm.addEventListener('submit', (e) => this.handleCommentSubmit(e, task.id));
        }
        
        // Chat form
        const chatForm = document.getElementById('chatForm');
        if (chatForm) {
            chatForm.addEventListener('submit', (e) => this.handleChatSubmit(e, task.id));
        }
        
        // File upload
        const fileUpload = document.getElementById('fileUpload');
        if (fileUpload) {
            fileUpload.addEventListener('change', (e) => this.handleFileUpload(e, task.id));
        }
        
        // DOD checkboxes
        document.querySelectorAll('[data-dod-id]').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => this.handleDODUpdate(e));
        });
    }

    setupMessagesEventListeners() {
        // DM form
        const dmForm = document.getElementById('dmForm');
        if (dmForm) {
            dmForm.addEventListener('submit', (e) => this.handleDirectMessage(e));
        }
        
        // Conversation switching
        document.querySelectorAll('.conversation-item').forEach(item => {
            item.addEventListener('click', (e) => this.switchConversation(e));
        });
    }

    populateHelpTaskOptions() {
        const taskSelect = document.getElementById('helpTaskSelect');
        if (taskSelect && this.tasks) {
            // Clear existing options except the first one
            taskSelect.innerHTML = '<option value="">Select a task...</option>';
            
            // Add user's tasks
            this.tasks.forEach(task => {
                if (task.assignee_id === this.currentUser?.id || task.owner_id === this.currentUser?.id) {
                    const option = document.createElement('option');
                    option.value = task.id;
                    option.textContent = task.title;
                    taskSelect.appendChild(option);
                }
            });
        }
    }

    // Handle form submission for new task creation page
    async handleCreateTaskPage(e) {
        e.preventDefault();
        
        const form = e.target;
        const formData = new FormData(form);
        
        // Process required skills
        const skillsText = formData.get('required_skills');
        const requiredSkills = skillsText ? skillsText.split('\n').map(s => s.trim()).filter(s => s) : [];
        
        // Process definition of done
        const dodText = formData.get('definition_of_done');
        const definitionOfDone = dodText ? dodText.split('\n').map(s => s.trim()).filter(s => s) : [];
        
        const taskData = {
            title: formData.get('title'),
            description: formData.get('description'),
            category: formData.get('category'),
            priority: formData.get('priority'),
            location: formData.get('location'),
            team_size: formData.get('team_size'),
            estimated_hours: formData.get('estimated_hours'),
            due_date: formData.get('due_date'),
            impact_points: parseInt(formData.get('impact_points')) || 100,
            required_skills: requiredSkills,
            definition_of_done: definitionOfDone
        };
        
        try {
            const newTask = await contractApi.createTask(taskData);
            this.showNotification('Task created successfully!');
            this.switchView('tasks');
            this.loadTasks(); // Refresh task list
        } catch (error) {
            console.error('Failed to create task:', error);
            this.showNotification('Failed to create task', 'error');
        }
    }

    // Utility methods for page interactions
    switchCommTab(tabName) {
        // Hide all panels
        document.querySelectorAll('.comm-panel').forEach(panel => {
            panel.classList.remove('active');
        });
        
        // Remove active from all tabs
        document.querySelectorAll('.comm-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        
        // Show selected panel and activate tab
        const selectedPanel = document.getElementById(tabName + 'Tab');
        const selectedTab = document.querySelector(`[data-tab="${tabName}"]`);
        
        if (selectedPanel) selectedPanel.classList.add('active');
        if (selectedTab) selectedTab.classList.add('active');
    }

    async handleCommentSubmit(e, taskId) {
        e.preventDefault();
        const textarea = e.target.querySelector('textarea');
        const content = textarea.value.trim();
        
        if (!content) return;
        
        try {
            await contractApi.createComment({
                content,
                task_id: taskId
            });
            
            textarea.value = '';
            this.loadTaskComments(taskId);
            this.showNotification('Comment added successfully!');
        } catch (error) {
            console.error('Failed to add comment:', error);
            this.showNotification('Failed to add comment', 'error');
        }
    }

    async handleChatSubmit(e, taskId) {
        e.preventDefault();
        const input = e.target.querySelector('input');
        const content = input.value.trim();
        
        if (!content) return;
        
        try {
            await contractApi.createTaskChatMessage(taskId, {
                content
            });
            
            input.value = '';
            this.loadTaskChat(taskId);
        } catch (error) {
            console.error('Failed to send chat message:', error);
            this.showNotification('Failed to send message', 'error');
        }
    }

    async handleDirectMessage(e) {
        e.preventDefault();
        const input = e.target.querySelector('input');
        const content = input.value.trim();
        
        if (!content) return;
        
        // Add message to chat UI immediately for better UX
        const chatMessages = document.querySelector('.chat-messages');
        if (chatMessages) {
            const messageDiv = document.createElement('div');
            messageDiv.className = 'message sent';
            messageDiv.innerHTML = `
                <div class="message-content">
                    <p>${content}</p>
                    <span class="message-time">Just now</span>
                </div>
            `;
            chatMessages.appendChild(messageDiv);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
        
        input.value = '';
        
        // TODO: Send to backend when DM API is implemented
        console.log('Direct message would be sent:', content);
    }

    switchConversation(e) {
        // Remove active class from all conversations
        document.querySelectorAll('.conversation-item').forEach(item => {
            item.classList.remove('active');
        });
        
        // Add active class to clicked conversation
        const conversationItem = e.currentTarget;
        conversationItem.classList.add('active');
        
        // Update chat header and messages based on selected conversation
        const userName = conversationItem.querySelector('.user-name').textContent;
        const userAvatar = conversationItem.querySelector('.user-avatar').textContent;
        
        // Update chat header
        const chatUserName = document.querySelector('.chat-area .user-name');
        const chatUserAvatar = document.querySelector('.chat-area .user-avatar');
        
        if (chatUserName) chatUserName.textContent = userName;
        if (chatUserAvatar) chatUserAvatar.textContent = userAvatar;
        
        // TODO: Load conversation messages from backend
        console.log('Switched to conversation with:', userName);
    }

    async loadTaskFiles(taskId) {
        try {
            const files = await contractApi.getTaskFiles(taskId);
            const filesList = document.getElementById('filesList');
            
            if (filesList && files) {
                filesList.innerHTML = files.map(file => `
                    <div class="file-item">
                        <span class="file-name">${file.name}</span>
                        <span class="file-size">${this.formatFileSize(file.size)}</span>
                        <button class="download-btn" onclick="window.open('${contractApi.baseUrl}/api/v1/files/download/${file.id}', '_blank')">
                            Download
                        </button>
                    </div>
                `).join('');
            }
        } catch (error) {
            console.error('Failed to load task files:', error);
        }
    }

    async loadTaskComments(taskId) {
        try {
            const comments = await contractApi.getTaskComments(taskId);
            const commentsList = document.getElementById('commentsList');
            
            if (commentsList && comments) {
                commentsList.innerHTML = comments.map(comment => `
                    <div class="comment-item">
                        <div class="comment-author">${comment.author_email}</div>
                        <div class="comment-content">${comment.content}</div>
                        <div class="comment-time">${this.formatTime(comment.created_at)}</div>
                    </div>
                `).join('');
            }
        } catch (error) {
            console.error('Failed to load task comments:', error);
        }
    }

    async loadTaskChat(taskId) {
        try {
            const messages = await contractApi.getTaskChatMessages(taskId);
            const chatMessages = document.getElementById('chatMessages');
            
            if (chatMessages && messages) {
                chatMessages.innerHTML = messages.map(message => `
                    <div class="chat-message">
                        <div class="message-author">${message.sender_email}</div>
                        <div class="message-content">${message.content}</div>
                        <div class="message-time">${this.formatTime(message.created_at)}</div>
                    </div>
                `).join('');
                
                chatMessages.scrollTop = chatMessages.scrollHeight;
            }
        } catch (error) {
            console.error('Failed to load task chat:', error);
        }
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    formatTime(dateString) {
        return new Date(dateString).toLocaleString();
    }

    // Task management
    async loadTasks() {
        try {
            console.log('Loading tasks...');
            const tasks = await contractApi.getTasks();
            console.log('Tasks loaded:', tasks);
            
            if (Array.isArray(tasks)) {
                this.tasks = tasks;
                this.filterTasks();
                this.updateTaskCounts();
                console.log('Tasks processed successfully:', this.tasks.length);
            } else {
                console.error('Invalid tasks data received:', tasks);
                this.tasks = [];
                this.renderTasks();
            }
        } catch (error) {
            console.error('Failed to load tasks:', error);
            this.showNotification('Failed to load tasks', 'error');
            // Show empty state instead of broken UI
            this.tasks = [];
            this.renderTasks();
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
            <div class="active-task clickable-task" data-task-id="${task.id}" title="Click to open task workspace">
                <div class="active-task-header">
                    <div class="active-task-title">${task.title}</div>
                    <div class="task-indicators">
                        <div class="indicator-item" title="Messages">
                            <span class="indicator-icon">💬</span>
                            <span class="indicator-count">3</span>
                        </div>
                        <div class="indicator-item" title="Comments">
                            <span class="indicator-icon">💭</span>
                            <span class="indicator-count">7</span>
                        </div>
                        <div class="activity-dot ${task.status === 'in_progress' ? 'active' : ''}"></div>
                    </div>
                </div>
                <div class="active-task-status">${task.status} • +${task.impact_points || 0} impact</div>
                <div class="task-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${task.status === 'in_progress' ? '60%' : '20%'}"></div>
                    </div>
                    <div class="progress-text">${task.status === 'in_progress' ? '60%' : '20%'} Complete</div>
                </div>
                <div class="task-quick-actions">
                    <button class="quick-action-btn" data-action="chat" title="Open team chat">
                        <span>💬</span>
                    </button>
                    <button class="quick-action-btn" data-action="comments" title="View comments">
                        <span>💭</span>
                    </button>
                    <button class="quick-action-btn" data-action="files" title="Task files">
                        <span>📎</span>
                    </button>
                </div>
            </div>
        `).join('');
        
        // Add click event listeners to active tasks
        this.setupActiveTaskListeners();
    }

    setupActiveTaskListeners() {
        // Main task click - navigate to task workspace
        document.querySelectorAll('.clickable-task').forEach(taskElement => {
            taskElement.addEventListener('click', (e) => {
                // Don't trigger if clicking on action buttons
                if (e.target.closest('.quick-action-btn')) return;
                
                const taskId = taskElement.dataset.taskId;
                this.openTaskWorkspace(taskId);
            });
        });

        // Quick action buttons
        document.querySelectorAll('.quick-action-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const action = btn.dataset.action;
                const taskId = btn.closest('.clickable-task').dataset.taskId;
                this.handleQuickAction(action, taskId);
            });
        });
    }

    async openTaskWorkspace(taskId) {
        this.selectedTaskId = taskId;
        this.switchView('task-detail');
    }

    async openTaskWorkspaceOld(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;
        
        this.showTaskDetailModal(task);
        await this.loadTaskComments(taskId);
    }

    handleQuickAction(action, taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;

        switch (action) {
            case 'chat':
                this.showNotification(`Team chat for "${task.title}" - Coming in Phase 3! 💬`);
                break;
            case 'comments':
                this.showNotification(`Comments for "${task.title}" - Coming in Phase 2! 💭`);
                break;
            case 'files':
                this.showNotification(`Files for "${task.title}" - Coming soon! 📎`);
                break;
        }
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
        
        // Apply search if active
        if (this.searchState && (this.searchState.query || this.searchState.status || this.searchState.priority)) {
            this.applySearchToTasks();
        } else {
            this.renderTasks();
        }
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

    updateTaskDisplays() {
        this.filterTasks();
        this.updateActiveTasks();
        this.updateTaskCounts();
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
                <div class="task-impact">
                    <div class="impact-points">+${task.impact_points || 100} Impact</div>
                    ${this.renderDoDProgress(task)}
                </div>
                <div class="task-footer">
                    <div class="task-actions">
                        ${actionButton}
                        <button class="help-btn" data-task-id="${task.id}" title="Request help from team">🆘 Help</button>
                        ${isOwner ? `<button class="delete-btn" data-task-id="${task.id}">Delete</button>` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    renderDoDProgress(task) {
        if (!task.definition_of_done || task.definition_of_done.length === 0) {
            return '';
        }

        const completedCount = task.definition_of_done.filter(item => item.completed).length;
        const totalCount = task.definition_of_done.length;
        const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

        return `
            <div class="dod-progress">
                <div class="dod-progress-bar">
                    <div class="dod-progress-fill" style="width: ${percentage}%"></div>
                </div>
                <span class="dod-progress-text">${percentage}% DoD Complete</span>
            </div>
        `;
    }

    renderTaskDoDChecklist(task) {
        if (!task.definition_of_done || task.definition_of_done.length === 0) {
            return '';
        }

        const completedCount = task.definition_of_done.filter(item => item.completed).length;
        const totalCount = task.definition_of_done.length;
        const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

        return `
            <div class="dod-checklist">
                <div class="dod-checklist-title">
                    <span>Definition of Done</span>
                    <span class="dod-progress-text">(${completedCount}/${totalCount} complete - ${percentage}%)</span>
                </div>
                ${task.definition_of_done.map((item, index) => `
                    <div class="dod-checklist-item ${item.completed ? 'completed' : ''}" data-task-id="${task.id}" data-item-index="${index}">
                        <div class="dod-checkbox ${item.completed ? 'completed' : ''}" onclick="app.toggleDoDItem('${task.id}', ${index})"></div>
                        <span class="dod-item-text">${item.text}</span>
                    </div>
                `).join('')}
            </div>
        `;
    }

    toggleDoDItem(taskId, itemIndex) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task || !task.definition_of_done || !task.definition_of_done[itemIndex]) return;

        // Toggle completion status
        task.definition_of_done[itemIndex].completed = !task.definition_of_done[itemIndex].completed;

        // Update UI
        const checklistItem = document.querySelector(`[data-task-id="${taskId}"][data-item-index="${itemIndex}"]`);
        const checkbox = checklistItem.querySelector('.dod-checkbox');
        
        if (task.definition_of_done[itemIndex].completed) {
            checklistItem.classList.add('completed');
            checkbox.classList.add('completed');
        } else {
            checklistItem.classList.remove('completed');
            checkbox.classList.remove('completed');
        }

        // Update progress display
        const completedCount = task.definition_of_done.filter(item => item.completed).length;
        const totalCount = task.definition_of_done.length;
        const percentage = Math.round((completedCount / totalCount) * 100);

        // Update progress text
        const progressText = document.querySelector('.dod-checklist-title .dod-progress-text');
        if (progressText) {
            progressText.textContent = `(${completedCount}/${totalCount} complete - ${percentage}%)`;
        }

        // Update any task cards that might be visible
        this.updateTaskDisplays();

        // In a real app, save to backend
        console.log(`DoD item ${itemIndex} for task ${taskId} marked as ${task.definition_of_done[itemIndex].completed ? 'completed' : 'incomplete'}`);
        
        // Show completion notification if all items are done
        if (completedCount === totalCount && completedCount > 0) {
            this.showNotification(`🎉 All Definition of Done criteria completed for "${task.title}"!`);
        }
    }

    setupTaskEventListeners() {
        // Task card clicks (open detail modal)
        document.querySelectorAll('.task-card').forEach(card => {
            card.addEventListener('click', (e) => {
                // Don't open modal if clicking on action buttons
                if (e.target.closest('button')) return;
                
                const taskId = card.dataset.taskId;
                this.openTaskWorkspace(taskId);
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

        // Help buttons
        document.querySelectorAll('.help-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleHelpRequest(e));
        });
    }

    async handleClaimTask(e) {
        e.stopPropagation();
        const taskId = e.target.dataset.taskId;
        const task = this.tasks.find(t => t.id === taskId);
        
        if (!task || !this.currentUser) return;
        
        try {
            // Claim task (this will assign and update status in one call)
            await contractApi.claimTask(taskId);
            
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
                await contractApi.assignTask(taskId, this.currentUser.id);
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
                await contractApi.updateTaskStatus(taskId, newStatus);
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
                await contractApi.deleteTask(taskId);
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
        const dod = document.getElementById('taskDod').value;
        const category = document.getElementById('taskCategory').value;
        const priority = document.getElementById('taskPriority').value;
        const errorEl = document.getElementById('taskError');

        try {
            // Process DoD into array
            const dodCriteria = dod ? dod.split('\n').filter(line => line.trim()).map(line => ({
                id: Date.now() + Math.random(),
                text: line.trim(),
                completed: false
            })) : [];

            const taskData = { 
                title, 
                description,
                category: category || 'General',
                priority: priority || 'medium',
                definition_of_done: dodCriteria,
                project_id: this.newTaskProjectId || null
            };
            
            await contractApi.createTask(taskData);
            
            // Reload the appropriate view
            if (this.currentView === 'teamspace') {
                await this.loadTeamTasks();
            } else {
                await this.loadTasks();
            }
            
            this.hideTaskModal();
            this.showNotification('Task created successfully!');
            
            // Reset form and project assignment
            document.getElementById('taskForm').reset();
            this.newTaskProjectId = null;
        } catch (error) {
            errorEl.textContent = error.message;
        }
    }

    async handleHelpRequest(e) {
        e.stopPropagation();
        const taskId = e.target.dataset.taskId;
        const task = this.tasks.find(t => t.id === taskId);
        
        if (!task) return;

        // Show help request dialog
        this.showHelpRequestDialog(task);
    }

    showHelpRequestDialog(task) {
        // Create modal HTML
        const helpModal = document.createElement('div');
        helpModal.className = 'modal help-request-modal';
        helpModal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Request Help - ${task.title}</h2>
                    <span class="close" onclick="this.closest('.modal').remove()">&times;</span>
                </div>
                <div class="modal-body">
                    <div class="help-request-form">
                        <div class="form-group">
                            <label for="helpCategory">What kind of help do you need?</label>
                            <select id="helpCategory" required>
                                <option value="">Select category...</option>
                                <option value="technical">Technical assistance</option>
                                <option value="resources">Additional resources</option>
                                <option value="collaboration">Collaboration/brainstorming</option>
                                <option value="review">Review/feedback</option>
                                <option value="blocker">Blocked/stuck</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="helpDescription">Describe what you need help with:</label>
                            <textarea id="helpDescription" rows="4" placeholder="Please provide details about what you're working on and what specific help you need..." required></textarea>
                        </div>
                        <div class="form-group">
                            <label for="helpUrgency">Urgency level:</label>
                            <select id="helpUrgency" required>
                                <option value="low">Low - when convenient</option>
                                <option value="medium" selected>Medium - this week</option>
                                <option value="high">High - today/tomorrow</option>
                                <option value="urgent">Urgent - blocking progress</option>
                            </select>
                        </div>
                        <div class="form-actions">
                            <button type="button" class="cancel-btn" onclick="this.closest('.modal').remove()">Cancel</button>
                            <button type="button" class="submit-btn" onclick="app.submitHelpRequest('${task.id}')">Send Help Request</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(helpModal);
        helpModal.classList.add('show');
        
        // Focus on first input
        helpModal.querySelector('#helpCategory').focus();
    }

    async submitHelpRequest(taskId) {
        const modal = document.querySelector('.help-request-modal');
        const category = modal.querySelector('#helpCategory').value;
        const description = modal.querySelector('#helpDescription').value;
        const urgency = modal.querySelector('#helpUrgency').value;

        if (!category || !description.trim()) {
            this.showNotification('Please fill in all required fields', 'error');
            return;
        }

        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;

        try {
            // Create help request notification
            const helpRequest = {
                id: Date.now().toString(),
                taskId: taskId,
                taskTitle: task.title,
                requesterName: this.currentUser.email.split('@')[0],
                requesterId: this.currentUser.id,
                category: category,
                description: description,
                urgency: urgency,
                timestamp: new Date().toISOString(),
                status: 'open'
            };

            // In a real app, this would send to the backend
            console.log('Help request created:', helpRequest);

            // Show success message
            this.showNotification(`Help request sent to team for "${task.title}"!`);
            
            // Add notification for team members (demo)
            this.addHelpRequestNotification(helpRequest);

            // Close modal
            modal.remove();

        } catch (error) {
            console.error('Failed to send help request:', error);
            this.showNotification('Failed to send help request', 'error');
        }
    }

    addHelpRequestNotification(helpRequest) {
        // This simulates adding a notification that team members would see
        const urgencyEmoji = {
            low: '💙',
            medium: '💛', 
            high: '🧡',
            urgent: '🔴'
        };

        // In a real app, this would be sent via WebSocket to team members
        console.log(`🆘 HELP REQUEST [${urgencyEmoji[helpRequest.urgency]}${helpRequest.urgency.toUpperCase()}]`);
        console.log(`Task: ${helpRequest.taskTitle}`);
        console.log(`From: ${helpRequest.requesterName}`);
        console.log(`Category: ${helpRequest.category}`);
        console.log(`Details: ${helpRequest.description}`);
        
        // Update notification badge
        const currentCount = parseInt(document.getElementById('notificationBadge').textContent) || 0;
        document.getElementById('notificationBadge').textContent = currentCount + 1;
        document.getElementById('notificationBadge').style.display = 'block';
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
            this.dashboardStats = await contractApi.getDashboardSummary();
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
            const users = await contractApi.getDashboardOnlineUsers();
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
            skillsSidebar.innerHTML = skillsHtml;

            const skillsSettingsHtml = this.currentUser.skills.map(skill => `
                <div class="skill-item">
                    <span>${skill}</span>
                    <button class="remove-skill-btn" data-skill="${skill}">&times;</button>
                </div>
            `).join('');
            skillsSettings.innerHTML = skillsSettingsHtml;
        } else {
            skillsSidebar.innerHTML = '<p>No skills added yet.</p>';
            skillsSettings.innerHTML = '';
        }
    }

    async handleAddSkill(e) {
        e.preventDefault();
        const input = document.getElementById('newSkillInput');
        const newSkill = input.value.trim();

        if (newSkill && !this.currentUser.skills.includes(newSkill)) {
            try {
                this.currentUser.skills.push(newSkill);
                await contractApi.updateCurrentUser({ skills: this.currentUser.skills });
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
                await contractApi.updateCurrentUser({ skills: this.currentUser.skills });
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

    showTaskModal(projectId = null) {
        const modal = document.getElementById('taskModal');
        if (modal) {
            modal.classList.add('show');
            
            // Store project ID for task creation
            this.newTaskProjectId = projectId;
            
            // Update modal title if creating for specific project
            const modalTitle = modal.querySelector('.modal-header h2');
            if (projectId && modalTitle) {
                modalTitle.textContent = 'Create New Task for Project';
            } else if (modalTitle) {
                modalTitle.textContent = 'Create New Task';
            }
        }
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
        // Handle different types of close events
        let modal = null;
        
        if (e.target.classList.contains('modal')) {
            // Clicked outside modal content
            modal = e.target;
        } else if (e.target.classList.contains('close')) {
            // Clicked close button
            modal = e.target.closest('.modal');
        } else if (e.target.classList.contains('cancel-btn')) {
            // Clicked cancel button
            modal = e.target.closest('.modal');
        } else {
            // Try to find modal from event target
            modal = e.target.closest('.modal');
        }
        
        if (modal) {
            modal.classList.remove('show');
            
            // Reset specific modals
            if (modal.id === 'taskDetailModal') {
                this.hideTaskDetailModal();
            } else if (modal.id === 'directMessagesModal') {
                this.currentDMUserId = null;
            }
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

    // Task Detail Modal Methods
    showTaskDetailModal(task) {
        this.currentTask = task;
        this.currentTaskId = task.id;  // Set current task ID for file uploads
        this.currentChatMessages = [];
        
        document.getElementById('taskDetailTitle').textContent = task.title;
        
        // Setup communication tabs
        this.setupCommunicationTabs();
        
        const taskInfo = document.getElementById('taskDetailInfo');
        taskInfo.innerHTML = `
            <h3>${task.title}</h3>
            <div class="task-meta-item">
                <span class="task-meta-label">Description:</span>
                <span class="task-meta-value">${task.description || 'No description provided'}</span>
            </div>
            <div class="task-meta-item">
                <span class="task-meta-label">Status:</span>
                <span class="task-meta-value">${task.status}</span>
            </div>
            <div class="task-meta-item">
                <span class="task-meta-label">Priority:</span>
                <span class="task-meta-value">${task.priority}</span>
            </div>
            <div class="task-meta-item">
                <span class="task-meta-label">Category:</span>
                <span class="task-meta-value">${task.category || 'Uncategorized'}</span>
            </div>
            <div class="task-meta-item">
                <span class="task-meta-label">Impact Points:</span>
                <span class="task-meta-value">+${task.impact_points || 0}</span>
            </div>
            <div class="task-meta-item">
                <span class="task-meta-label">Estimated Hours:</span>
                <span class="task-meta-value">${task.estimated_hours || 'Not specified'}</span>
            </div>
            <div class="task-meta-item">
                <span class="task-meta-label">Location:</span>
                <span class="task-meta-value">${task.location || 'Not specified'}</span>
            </div>
            <div class="task-meta-item">
                <span class="task-meta-label">Team Size:</span>
                <span class="task-meta-value">${task.team_size || 'Not specified'}</span>
            </div>
            <div class="task-meta-item">
                <span class="task-meta-label">Due Date:</span>
                <span class="task-meta-value">${task.due_date || 'Not specified'}</span>
            </div>
            <div class="task-meta-item">
                <span class="task-meta-label">Required Skills:</span>
                <span class="task-meta-value">${task.required_skills?.join(', ') || 'None specified'}</span>
            </div>
            ${this.renderTaskDoDChecklist(task)}
        `;

        // Setup task action buttons
        this.setupTaskActions(task);
        
        // Setup comment functionality
        this.setupCommentForm();
        
        // Load task files
        this.loadTaskFiles(task.id);
        
        document.getElementById('taskDetailModal').classList.add('show');
    }

    hideTaskDetailModal() {
        document.getElementById('taskDetailModal').classList.remove('show');
        this.currentTask = null;
        this.chatInitialized = false;
        this.currentChatMessages = [];
    }

    setupTaskActions(task) {
        const claimBtn = document.getElementById('taskClaimBtn');
        const statusBtn = document.getElementById('taskUpdateStatusBtn');

        // Remove existing event listeners
        claimBtn.replaceWith(claimBtn.cloneNode(true));
        statusBtn.replaceWith(statusBtn.cloneNode(true));

        const newClaimBtn = document.getElementById('taskClaimBtn');
        const newStatusBtn = document.getElementById('taskUpdateStatusBtn');

        // Setup claim button
        if (task.status === 'available' && task.assignee_id !== this.currentUser.id) {
            newClaimBtn.style.display = 'block';
            newClaimBtn.textContent = 'Claim Task';
            newClaimBtn.addEventListener('click', () => this.claimTaskFromDetail(task.id));
        } else if (task.assignee_id === this.currentUser.id) {
            newClaimBtn.style.display = 'block';
            newClaimBtn.textContent = 'Already Claimed';
            newClaimBtn.disabled = true;
        } else {
            newClaimBtn.style.display = 'none';
        }

        // Setup status button
        if (task.assignee_id === this.currentUser.id || task.owner_id === this.currentUser.id) {
            newStatusBtn.style.display = 'block';
            newStatusBtn.addEventListener('click', () => this.updateTaskStatusFromDetail(task.id));
        } else {
            newStatusBtn.style.display = 'none';
        }
    }

    async claimTaskFromDetail(taskId) {
        try {
            await contractApi.claimTask(taskId);
            this.showNotification('Task claimed successfully!');
            
            // Update local task data
            const task = this.tasks.find(t => t.id === taskId);
            if (task) {
                task.assignee_id = this.currentUser.id;
                task.status = 'in_progress';
                this.setupTaskActions(task);
                this.updateTaskDisplays();
            }
        } catch (error) {
            this.showNotification('Failed to claim task: ' + error.message, 'error');
        }
    }

    async updateTaskStatusFromDetail(taskId) {
        const statuses = ['draft', 'available', 'in_progress', 'completed'];
        const currentTask = this.tasks.find(t => t.id === taskId);
        const currentIndex = statuses.indexOf(currentTask.status);
        const nextStatus = statuses[(currentIndex + 1) % statuses.length];

        try {
            await contractApi.updateTaskStatus(taskId, nextStatus);
            this.showNotification(`Task status updated to ${nextStatus}`);
            
            // Update local task data
            currentTask.status = nextStatus;
            this.setupTaskActions(currentTask);
            this.updateTaskDisplays();
        } catch (error) {
            this.showNotification('Failed to update status: ' + error.message, 'error');
        }
    }

    // Comment System Methods
    setupCommentForm() {
        const postBtn = document.getElementById('postCommentBtn');
        const textarea = document.getElementById('newCommentText');

        // Remove existing event listeners
        postBtn.replaceWith(postBtn.cloneNode(true));
        
        document.getElementById('postCommentBtn').addEventListener('click', () => this.postComment());
        
        // Allow posting with Ctrl+Enter
        textarea.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                this.postComment();
            }
        });
    }

    async loadTaskComments(taskId) {
        try {
            const comments = await contractApi.getTaskComments(taskId);
            this.displayComments(comments);
        } catch (error) {
            console.error('Failed to load comments:', error);
            this.displayComments([]);
        }
    }

    displayComments(comments) {
        const commentsList = document.getElementById('commentsList');
        const commentCount = document.getElementById('commentCount');
        
        commentCount.textContent = `${comments.length} comment${comments.length !== 1 ? 's' : ''}`;

        if (comments.length === 0) {
            commentsList.innerHTML = '<div class="no-comments">No comments yet. Be the first to share your thoughts!</div>';
            return;
        }

        commentsList.innerHTML = comments.map(comment => this.renderComment(comment)).join('');
        
        // Setup comment action listeners
        this.setupCommentActions();
    }

    renderComment(comment) {
        const date = new Date(comment.created_at).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        const isOwner = comment.author_id === this.currentUser.id;
        const actionsHTML = isOwner ? `
            <div class="comment-actions">
                <button class="comment-action edit-comment" data-comment-id="${comment.id}">Edit</button>
                <button class="comment-action delete-comment" data-comment-id="${comment.id}">Delete</button>
            </div>
        ` : '';

        return `
            <div class="comment-item" data-comment-id="${comment.id}">
                <div class="comment-header">
                    <div>
                        <span class="comment-author">${comment.author_email || 'Unknown User'}</span>
                        ${comment.author_role ? `<span class="comment-role">${comment.author_role}</span>` : ''}
                    </div>
                    <span class="comment-date">${date}</span>
                </div>
                <div class="comment-content">${comment.content}</div>
                ${actionsHTML}
            </div>
        `;
    }

    setupCommentActions() {
        // Edit comment buttons
        document.querySelectorAll('.edit-comment').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const commentId = e.target.dataset.commentId;
                this.editComment(commentId);
            });
        });

        // Delete comment buttons
        document.querySelectorAll('.delete-comment').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const commentId = e.target.dataset.commentId;
                this.deleteComment(commentId);
            });
        });
    }

    async postComment() {
        const textarea = document.getElementById('newCommentText');
        const content = textarea.value.trim();

        if (!content) {
            this.showNotification('Please enter a comment', 'error');
            return;
        }

        if (!this.currentTask) {
            this.showNotification('No task selected', 'error');
            return;
        }

        try {
            await contractApi.createComment(this.currentTask.id, content);
            textarea.value = '';
            this.showNotification('Comment posted successfully!');
            await this.loadTaskComments(this.currentTask.id);
        } catch (error) {
            this.showNotification('Failed to post comment: ' + error.message, 'error');
        }
    }

    async editComment(commentId) {
        const commentElement = document.querySelector(`[data-comment-id="${commentId}"]`);
        const contentElement = commentElement.querySelector('.comment-content');
        const currentContent = contentElement.textContent;

        const newContent = prompt('Edit your comment:', currentContent);
        if (newContent === null || newContent.trim() === currentContent) return;

        try {
            await contractApi.updateComment(commentId, newContent.trim());
            this.showNotification('Comment updated successfully!');
            await this.loadTaskComments(this.currentTask.id);
        } catch (error) {
            this.showNotification('Failed to update comment: ' + error.message, 'error');
        }
    }

    async deleteComment(commentId) {
        if (!confirm('Are you sure you want to delete this comment?')) return;

        try {
            await contractApi.deleteComment(commentId);
            this.showNotification('Comment deleted successfully!');
            await this.loadTaskComments(this.currentTask.id);
        } catch (error) {
            this.showNotification('Failed to delete comment: ' + error.message, 'error');
        }
    }

    // Communication Tabs
    setupCommunicationTabs() {
        const tabs = document.querySelectorAll('.comm-tab');
        const sections = document.querySelectorAll('.comm-section');

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const targetTab = tab.dataset.tab;
                
                // Update active states
                tabs.forEach(t => t.classList.remove('active'));
                sections.forEach(s => s.classList.remove('active'));
                
                tab.classList.add('active');
                
                if (targetTab === 'comments') {
                    document.getElementById('commentsSection').classList.add('active');
                } else if (targetTab === 'team-chat') {
                    document.getElementById('teamChatSection').classList.add('active');
                    // Load chat messages when switching to chat tab
                    if (!this.chatInitialized) {
                        this.initializeTaskChat();
                    }
                }
            });
        });
    }

    // Team Chat Methods
    async initializeTaskChat() {
        if (!this.currentTask) return;
        
        this.chatInitialized = true;
        this.setupChatInterface();
        await this.loadTaskChatMessages();
        
        // Check if user has access to chat (owner or assignee)
        const hasAccess = this.currentTask.owner_id === this.currentUser.id || 
                         this.currentTask.assignee_id === this.currentUser.id;
        
        if (!hasAccess) {
            document.getElementById('chatMessages').innerHTML = 
                '<div class="chat-empty">Only the task owner and assignee can access team chat.</div>';
            document.getElementById('chatInput').disabled = true;
            document.getElementById('sendChatBtn').disabled = true;
            return;
        }
        
        // Display participants
        this.displayChatParticipants();
    }

    setupChatInterface() {
        const chatInput = document.getElementById('chatInput');
        const sendBtn = document.getElementById('sendChatBtn');
        
        // Remove existing listeners
        chatInput.replaceWith(chatInput.cloneNode(true));
        sendBtn.replaceWith(sendBtn.cloneNode(true));
        
        const newChatInput = document.getElementById('chatInput');
        const newSendBtn = document.getElementById('sendChatBtn');
        
        // Send on button click
        newSendBtn.addEventListener('click', () => this.sendChatMessage());
        
        // Send on Enter key
        newChatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendChatMessage();
            }
        });
    }

    async loadTaskChatMessages() {
        try {
            const messages = await contractApi.getTaskChatMessages(this.currentTask.id);
            this.currentChatMessages = messages;
            this.displayChatMessages(messages);
        } catch (error) {
            console.error('Failed to load chat messages:', error);
            document.getElementById('chatMessages').innerHTML = 
                '<div class="chat-empty">Failed to load messages.</div>';
        }
    }

    displayChatMessages(messages) {
        const container = document.getElementById('chatMessages');
        
        if (messages.length === 0) {
            container.innerHTML = '<div class="chat-empty">No messages yet. Start the conversation!</div>';
            return;
        }
        
        container.innerHTML = messages.map(msg => this.renderChatMessage(msg)).join('');
        
        // Scroll to bottom
        container.scrollTop = container.scrollHeight;
    }

    renderChatMessage(message) {
        const time = new Date(message.created_at).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
        
        const isOwnMessage = message.sender_id === this.currentUser.id;
        
        return `
            <div class="chat-message ${isOwnMessage ? 'own-message' : ''}">
                <div class="chat-message-header">
                    <span class="chat-message-author">${message.sender_email}</span>
                    <span class="chat-message-time">${time}</span>
                </div>
                <div class="chat-message-content">${message.content}</div>
            </div>
        `;
    }

    displayChatParticipants() {
        const participantsEl = document.getElementById('chatParticipants');
        const participants = [];
        
        // Add owner info
        if (this.currentTask.owner_id === this.currentUser.id) {
            participants.push('You (Owner)');
        } else {
            participants.push('Task Owner');
        }
        
        // Add assignee info
        if (this.currentTask.assignee_id) {
            if (this.currentTask.assignee_id === this.currentUser.id) {
                participants.push('You (Assigned)');
            } else {
                participants.push('Assignee');
            }
        }
        
        participantsEl.textContent = participants.join(' & ');
    }

    async sendChatMessage() {
        const input = document.getElementById('chatInput');
        const content = input.value.trim();
        
        if (!content) return;
        
        // Disable input while sending
        input.disabled = true;
        document.getElementById('sendChatBtn').disabled = true;
        
        try {
            const message = await contractApi.sendTaskChatMessage(this.currentTask.id, content);
            
            // Clear input
            input.value = '';
            
            // Add message to display
            const messageWithSender = {
                ...message,
                sender_email: this.currentUser.email,
                sender_role: this.currentUser.role
            };
            
            this.currentChatMessages.push(messageWithSender);
            this.displayChatMessages(this.currentChatMessages);
            
            // Send via WebSocket for real-time updates
            if (wsManager.isConnected()) {
                wsManager.send({
                    type: 'task_chat_message',
                    payload: {
                        task_id: this.currentTask.id,
                        message: content,
                        sender_id: this.currentUser.id,
                        sender_email: this.currentUser.email,
                        sender_role: this.currentUser.role
                    }
                });
            }
        } catch (error) {
            this.showNotification('Failed to send message: ' + error.message, 'error');
        } finally {
            input.disabled = false;
            document.getElementById('sendChatBtn').disabled = false;
            input.focus();
        }
    }

    // Handle incoming chat messages from WebSocket
    handleIncomingChatMessage(data) {
        // Only process if we're viewing this task
        if (!this.currentTask || this.currentTask.id !== data.task_id) return;
        
        // Don't duplicate our own messages
        if (data.sender_id === this.currentUser.id) return;
        
        // Add to current messages
        const message = {
            content: data.message,
            sender_id: data.sender_id,
            sender_email: data.sender_email,
            sender_role: data.sender_role,
            created_at: new Date().toISOString()
        };
        
        this.currentChatMessages.push(message);
        this.displayChatMessages(this.currentChatMessages);
    }

    // Search Functionality
    setupSearchListeners() {
        const searchInput = document.getElementById('taskSearchInput');
        const statusFilter = document.getElementById('searchStatusFilter');
        const priorityFilter = document.getElementById('searchPriorityFilter');
        const clearBtn = document.getElementById('clearSearchBtn');

        // Debounce search input
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                this.performSearch();
            }, 300);
        });

        // Filter changes
        statusFilter.addEventListener('change', () => this.performSearch());
        priorityFilter.addEventListener('change', () => this.performSearch());

        // Clear search
        clearBtn.addEventListener('click', () => this.clearSearch());

        // Store search state
        this.searchState = {
            query: '',
            status: '',
            priority: ''
        };
    }

    performSearch() {
        const searchInput = document.getElementById('taskSearchInput');
        const statusFilter = document.getElementById('searchStatusFilter');
        const priorityFilter = document.getElementById('searchPriorityFilter');

        this.searchState = {
            query: searchInput.value.toLowerCase().trim(),
            status: statusFilter.value,
            priority: priorityFilter.value
        };

        // Apply search to current filter
        this.applySearchToTasks();
    }

    applySearchToTasks() {
        const { query, status, priority } = this.searchState;

        // If no search criteria, just use regular filtered tasks
        if (!query && !status && !priority) {
            this.renderTasks();
            return;
        }

        // Filter tasks based on search criteria
        const searchResults = this.filteredTasks.filter(task => {
            // Text search
            let matchesQuery = true;
            if (query) {
                matchesQuery = 
                    task.title.toLowerCase().includes(query) ||
                    (task.description && task.description.toLowerCase().includes(query)) ||
                    (task.required_skills && task.required_skills.some(skill => 
                        skill.toLowerCase().includes(query)
                    )) ||
                    (task.category && task.category.toLowerCase().includes(query));
            }

            // Status filter
            let matchesStatus = true;
            if (status) {
                matchesStatus = task.status === status;
            }

            // Priority filter
            let matchesPriority = true;
            if (priority) {
                matchesPriority = task.priority === priority;
            }

            return matchesQuery && matchesStatus && matchesPriority;
        });

        // Display search results
        this.displaySearchResults(searchResults);
    }

    displaySearchResults(results) {
        const container = document.getElementById('taskGrid');
        
        if (!container) return;

        // Add search results info
        const resultsInfo = document.querySelector('.search-results-info');
        if (resultsInfo) {
            resultsInfo.remove();
        }

        // Show results count if searching
        if (this.searchState.query || this.searchState.status || this.searchState.priority) {
            const info = document.createElement('div');
            info.className = 'search-results-info';
            info.textContent = `Found ${results.length} task${results.length !== 1 ? 's' : ''}`;
            container.parentNode.insertBefore(info, container);
        }

        if (results.length === 0) {
            container.innerHTML = '<div class="loading">No tasks match your search criteria</div>';
            return;
        }

        container.innerHTML = results.map(task => this.createTaskCard(task)).join('');
        
        // Re-setup event listeners
        this.setupTaskEventListeners();
    }

    clearSearch() {
        document.getElementById('taskSearchInput').value = '';
        document.getElementById('searchStatusFilter').value = '';
        document.getElementById('searchPriorityFilter').value = '';
        
        this.searchState = {
            query: '',
            status: '',
            priority: ''
        };

        // Remove results info
        const resultsInfo = document.querySelector('.search-results-info');
        if (resultsInfo) {
            resultsInfo.remove();
        }

        // Show all tasks for current filter
        this.renderTasks();
    }

    // Direct Messages functionality
    openDirectMessages() {
        const modal = document.getElementById('directMessagesModal');
        if (modal) {
            modal.classList.add('show');
            this.loadDirectMessages();
        }
    }

    async loadDirectMessages() {
        try {
            // Load conversations and users for demo
            const conversations = [
                {
                    id: 'conv1',
                    user: { id: 'user2', name: 'Bob', email: 'bob@example.com', status: 'online' },
                    lastMessage: 'Hey, let\'s discuss the solar panel project',
                    lastMessageTime: '2 min ago',
                    unreadCount: 2
                },
                {
                    id: 'conv2', 
                    user: { id: 'user3', name: 'Carol', email: 'carol@example.com', status: 'offline' },
                    lastMessage: 'Thanks for the ocean cleanup insights!',
                    lastMessageTime: '1 hour ago',
                    unreadCount: 0
                }
            ];

            const users = [
                { id: 'user2', name: 'Bob', email: 'bob@example.com', status: 'online' },
                { id: 'user3', name: 'Carol', email: 'carol@example.com', status: 'offline' },
                { id: 'user4', name: 'David', email: 'david@example.com', status: 'online' }
            ];

            this.renderDMConversations(conversations);
            this.renderDMUsers(users);
            this.setupDMEventListeners();

        } catch (error) {
            console.error('Failed to load direct messages:', error);
        }
    }

    renderDMConversations(conversations) {
        const conversationsList = document.getElementById('dmConversationsList');
        if (!conversationsList) return;

        if (conversations.length === 0) {
            conversationsList.innerHTML = '<div class="no-conversations">No conversations yet</div>';
            return;
        }

        conversationsList.innerHTML = conversations.map(conv => `
            <div class="conversation-item" data-conversation-id="${conv.id}" data-user-id="${conv.user.id}">
                <div class="user-avatar">${conv.user.name.charAt(0)}</div>
                <div class="user-info">
                    <div class="user-name">${conv.user.name}</div>
                    <div class="last-message">${conv.lastMessage}</div>
                </div>
                <div class="conversation-meta">
                    <div class="message-time">${conv.lastMessageTime}</div>
                    ${conv.unreadCount > 0 ? `<div class="unread-badge">${conv.unreadCount}</div>` : ''}
                </div>
            </div>
        `).join('');
    }

    renderDMUsers(users) {
        const usersList = document.getElementById('dmUsersList');
        if (!usersList) return;

        usersList.innerHTML = users.map(user => `
            <div class="user-item" data-user-id="${user.id}">
                <div class="user-avatar">${user.name.charAt(0)}</div>
                <div class="user-info">
                    <div class="user-name">${user.name}</div>
                    <div class="user-status ${user.status}">${user.status}</div>
                </div>
            </div>
        `).join('');
    }

    setupDMEventListeners() {
        // Conversation clicks
        document.querySelectorAll('.conversation-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const conversationId = e.currentTarget.dataset.conversationId;
                const userId = e.currentTarget.dataset.userId;
                this.openDMConversation(conversationId, userId);
            });
        });

        // User clicks (start new conversation)
        document.querySelectorAll('.user-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const userId = e.currentTarget.dataset.userId;
                this.startNewDMConversation(userId);
            });
        });

        // Send message
        const sendBtn = document.getElementById('sendDmBtn');
        const dmInput = document.getElementById('dmInput');
        
        if (sendBtn) {
            sendBtn.addEventListener('click', () => this.sendDirectMessage());
        }
        
        if (dmInput) {
            dmInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendDirectMessage();
                }
            });
        }
    }

    openDMConversation(conversationId, userId) {
        // Mark conversation as active
        document.querySelectorAll('.conversation-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-conversation-id="${conversationId}"]`).classList.add('active');

        // Load messages for this conversation
        this.loadDMConversation(conversationId, userId);
        
        // Enable input
        document.getElementById('dmInput').disabled = false;
        document.getElementById('sendDmBtn').disabled = false;
        this.currentDMUserId = userId;
    }

    startNewDMConversation(userId) {
        const user = { id: userId, name: 'User' }; // Would get from user data
        
        // Update chat header
        document.querySelector('.chat-user-name').textContent = user.name;
        document.querySelector('.chat-user-status').textContent = 'online';
        
        // Clear messages
        document.getElementById('dmMessages').innerHTML = '<div class="dm-placeholder">Start a conversation!</div>';
        
        // Enable input
        document.getElementById('dmInput').disabled = false;
        document.getElementById('sendDmBtn').disabled = false;
        this.currentDMUserId = userId;
    }

    async loadDMConversation(conversationId, userId) {
        try {
            // Demo messages
            const messages = [
                {
                    id: '1',
                    content: 'Hey! I saw your work on the solar panel efficiency analysis. Great insights!',
                    sender_id: userId,
                    created_at: new Date(Date.now() - 3600000).toISOString()
                },
                {
                    id: '2', 
                    content: 'Thanks! I think we could collaborate on optimizing the performance models.',
                    sender_id: this.currentUser.id,
                    created_at: new Date(Date.now() - 3000000).toISOString()
                },
                {
                    id: '3',
                    content: 'Absolutely! Let me know when you\'re free to discuss the technical details.',
                    sender_id: userId,
                    created_at: new Date(Date.now() - 600000).toISOString()
                }
            ];

            this.displayDMMessages(messages);
            
            // Update chat header
            const userName = document.querySelector(`[data-user-id="${userId}"] .user-name`).textContent;
            document.querySelector('.chat-user-name').textContent = userName;
            document.querySelector('.chat-user-status').textContent = 'online';

        } catch (error) {
            console.error('Failed to load DM conversation:', error);
        }
    }

    displayDMMessages(messages) {
        const container = document.getElementById('dmMessages');
        if (!container) return;

        if (messages.length === 0) {
            container.innerHTML = '<div class="dm-placeholder">No messages yet. Start the conversation!</div>';
            return;
        }

        container.innerHTML = messages.map(msg => this.renderDMMessage(msg)).join('');
        container.scrollTop = container.scrollHeight;
    }

    renderDMMessage(message) {
        const isOwnMessage = message.sender_id === this.currentUser.id;
        const time = new Date(message.created_at).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });

        return `
            <div class="dm-message ${isOwnMessage ? 'own-message' : ''}">
                <div class="dm-message-content">${message.content}</div>
                <div class="dm-message-time">${time}</div>
            </div>
        `;
    }

    async sendDirectMessage() {
        const input = document.getElementById('dmInput');
        const content = input.value.trim();
        
        if (!content || !this.currentDMUserId) return;

        try {
            // Disable input while sending
            input.disabled = true;
            document.getElementById('sendDmBtn').disabled = true;

            // Create message object
            const message = {
                id: Date.now().toString(),
                content: content,
                sender_id: this.currentUser.id,
                created_at: new Date().toISOString()
            };

            // Add to display
            const container = document.getElementById('dmMessages');
            const placeholder = container.querySelector('.dm-placeholder');
            if (placeholder) {
                placeholder.remove();
            }
            
            container.innerHTML += this.renderDMMessage(message);
            container.scrollTop = container.scrollHeight;

            // Clear input
            input.value = '';
            
            this.showNotification('Message sent!');

        } catch (error) {
            this.showNotification('Failed to send message: ' + error.message, 'error');
        } finally {
            input.disabled = false;
            document.getElementById('sendDmBtn').disabled = false;
            input.focus();
        }
    }

    // File Upload Methods
    async handleFileUpload() {
        const fileInput = document.getElementById('taskFileInput');
        const files = fileInput.files;
        
        if (!files || files.length === 0) {
            this.showNotification('Please select files to upload', 'error');
            return;
        }

        if (!this.currentTaskId) {
            this.showNotification('No task selected for file upload', 'error');
            return;
        }

        const uploadBtn = document.getElementById('uploadFileBtn');
        uploadBtn.disabled = true;
        uploadBtn.textContent = 'Uploading...';

        try {
            for (const file of files) {
                await this.uploadSingleFile(file, this.currentTaskId);
            }
            
            // Refresh file list
            await this.loadTaskFiles(this.currentTaskId);
            
            // Clear file input
            fileInput.value = '';
            
            this.showNotification(`Successfully uploaded ${files.length} file(s)`);
        } catch (error) {
            this.showNotification('File upload failed: ' + error.message, 'error');
        } finally {
            uploadBtn.disabled = false;
            uploadBtn.textContent = '📎 Upload Files';
        }
    }

    async uploadSingleFile(file, taskId) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async () => {
                try {
                    const base64Content = reader.result.split(',')[1]; // Remove data URL prefix
                    
                    const fileData = {
                        name: file.name,
                        content: base64Content,
                        type: file.type || 'application/octet-stream',
                        size: file.size
                    };

                    const response = await contractApi.uploadFile(taskId, fileData);
                    resolve(response);
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsDataURL(file);
        });
    }

    async loadTaskFiles(taskId) {
        try {
            const files = await contractApi.getTaskFiles(taskId);
            this.renderTaskFiles(files);
        } catch (error) {
            console.error('Failed to load task files:', error);
        }
    }

    renderTaskFiles(files) {
        const filesList = document.getElementById('taskFilesList');
        
        if (!files || files.length === 0) {
            filesList.innerHTML = '<div class="no-files">No files uploaded yet</div>';
            return;
        }

        filesList.innerHTML = files.map(file => this.renderFileItem(file)).join('');
    }

    renderFileItem(file) {
        const fileIcon = this.getFileIcon(file.type);
        const fileSize = this.formatFileSize(file.size);
        
        return `
            <div class="file-item" data-file-id="${file.id}">
                <div class="file-icon">${fileIcon}</div>
                <div class="file-info">
                    <div class="file-name">${file.name}</div>
                    <div class="file-size">${fileSize} • ${this.formatDate(file.uploaded_at)}</div>
                </div>
                <div class="file-actions">
                    <button class="download-btn" data-file-id="${file.id}">Download</button>
                    <button class="delete-file-btn" data-file-id="${file.id}">Delete</button>
                </div>
            </div>
        `;
    }

    getFileIcon(mimeType) {
        const iconMap = {
            'application/pdf': '📄',
            'text/plain': '📝',
            'text/markdown': '📝',
            'text/html': '🌐',
            'application/msword': '📄',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '📄',
            'image/png': '🖼️',
            'image/jpeg': '🖼️',
            'image/jpg': '🖼️'
        };
        
        return iconMap[mimeType] || '📁';
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    async handleFileDownload(fileId) {
        try {
            window.open(`${contractApi.baseUrl}/api/v1/files/download/${fileId}`, '_blank');
        } catch (error) {
            this.showNotification('Download failed: ' + error.message, 'error');
        }
    }

    async handleFileDelete(fileId) {
        if (!confirm('Are you sure you want to delete this file?')) {
            return;
        }

        try {
            await contractApi.deleteFile(fileId);
            await this.loadTaskFiles(this.currentTaskId);
            this.showNotification('File deleted successfully');
        } catch (error) {
            this.showNotification('Delete failed: ' + error.message, 'error');
        }
    }

    // Help Request Methods
    showHelpRequestModal() {
        const modal = document.getElementById('helpRequestModal');
        modal.classList.add('show');
        
        // Reset form
        const form = document.getElementById('helpRequestForm');
        form.reset();
    }

    async handleHelpRequest(e) {
        e.preventDefault();
        
        const urgency = document.getElementById('helpUrgency').value;
        const description = document.getElementById('helpDescription').value.trim();
        
        if (!urgency || !description) {
            this.showNotification('Please fill in all fields', 'error');
            return;
        }

        try {
            const helpData = {
                task_id: this.currentTaskId || '',
                urgency: urgency,
                description: description
            };

            const response = await contractApi.sendHelpRequest(helpData);
            
            this.closeModal(e);
            this.showNotification('Help request sent to team successfully! 🆘');
            
            // Add notification to simulate team notification
            setTimeout(() => {
                this.showNotification(`Team members have been notified of your ${urgency} priority help request`);
            }, 1000);

        } catch (error) {
            this.showNotification('Failed to send help request: ' + error.message, 'error');
        }
    }
}

// Initialize the application when the page loads
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new HIVEApp();
    window.app = app; // Make available globally for WebSocket callbacks
});