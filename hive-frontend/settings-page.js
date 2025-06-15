// Settings Page Manager
class SettingsPageManager {
    constructor(app) {
        this.app = app;
    }

    // Show settings page
    showSettingsPage() {
        try {
            const isAdmin = this.app.currentUser && this.app.currentUser.permissions && this.app.currentUser.permissions.includes('manage_team');
        
        const settingsPageHTML = `
            <div class="settings-page">
                <!-- Settings Header -->
                <div class="settings-header">
                    <button class="back-btn" onclick="window.router.navigate('/')">← Back to Dashboard</button>
                    <h1>Settings</h1>
                </div>

                <!-- Settings Tabs -->
                <div class="settings-tabs">
                    <button class="tab-btn active" data-tab="profile">Profile & Skills</button>
                    <button class="tab-btn" data-tab="preferences">Preferences</button>
                    ${isAdmin ? '<button class="tab-btn" data-tab="admin">User Management</button>' : ''}
                </div>

                <!-- Settings Content -->
                <div class="settings-content">
                    <!-- Profile & Skills Tab -->
                    <div id="profile-tab" class="tab-content active">
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

                        <div class="settings-section">
                            <h3>Account</h3>
                            <button id="logoutBtnSettings" class="logout-btn" style="background: #e57373; width: auto;">Logout</button>
                        </div>
                    </div>

                    <!-- Preferences Tab -->
                    <div id="preferences-tab" class="tab-content">
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
                    </div>

                    ${isAdmin ? this.renderAdminTab() : ''}
                </div>
            </div>
        `;

        // Hide the dashboard layout and show settings page
        const mainContainer = document.querySelector('.main-container');
        mainContainer.style.display = 'none';
        
        // Hide settings modal if it's open
        const settingsModal = document.getElementById('settingsModal');
        if (settingsModal) {
            settingsModal.classList.remove('show');
        }
        
        // Create or get settings container
        let settingsContainer = document.getElementById('settings-page-container');
        if (!settingsContainer) {
            settingsContainer = document.createElement('div');
            settingsContainer.id = 'settings-page-container';
            document.body.appendChild(settingsContainer);
        }
        
        settingsContainer.innerHTML = settingsPageHTML;
        settingsContainer.style.display = 'block';
        settingsContainer.style.position = 'fixed';
        settingsContainer.style.top = '0';
        settingsContainer.style.left = '0';
        settingsContainer.style.width = '100%';
        settingsContainer.style.height = '100%';
        settingsContainer.style.zIndex = '1000';
        
        // Enable scrolling
        document.body.style.overflow = 'auto';
        
        // Setup event listeners
        this.setupSettingsEventListeners();
        
        // Render user skills
        this.app.renderUserSkills();
        
        } catch (error) {
            console.error('Failed to load settings page:', error);
        }
    }

    setupSettingsEventListeners() {
        // Add skill form
        const addSkillForm = document.getElementById('addSkillForm');
        if (addSkillForm) {
            addSkillForm.addEventListener('submit', (e) => this.app.handleAddSkill(e));
        }

        // Remove skill buttons
        const currentSkills = document.getElementById('currentSkills');
        if (currentSkills) {
            currentSkills.addEventListener('click', (e) => this.app.handleRemoveSkill(e));
        }

        // Logout button
        const logoutBtn = document.getElementById('logoutBtnSettings');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.app.handleLogout());
        }

        // Setup tab switching
        this.setupTabSwitching();
    }

    // Render admin tab content
    renderAdminTab() {
        return `
            <!-- Admin Tab -->
            <div id="admin-tab" class="tab-content">
                <div class="settings-section admin-overview">
                    <h3>User Management</h3>
                    <p>Manage user roles and permissions across the TaskMaster system.</p>
                    
                    <div class="admin-stats">
                        <div class="stat-card">
                            <div class="stat-number" id="totalUsers">-</div>
                            <div class="stat-label">Total Users</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number" id="activeUsers">-</div>
                            <div class="stat-label">Active Users</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number" id="adminUsers">-</div>
                            <div class="stat-label">Admins</div>
                        </div>
                    </div>
                </div>

                <div class="settings-section user-management">
                    <h3>Users</h3>
                    <div id="usersList" class="users-list">
                        <!-- Users will be loaded here -->
                    </div>
                </div>

                <div class="settings-section role-templates">
                    <h3>Role Templates</h3>
                    <div id="rolesList" class="roles-list">
                        <!-- Roles will be loaded here -->
                    </div>
                </div>
            </div>
        `;
    }

    // Setup tab switching
    setupTabSwitching() {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const targetTab = e.target.dataset.tab;
                
                // Update tab buttons
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                
                // Update tab content
                document.querySelectorAll('.tab-content').forEach(content => {
                    content.classList.remove('active');
                });
                document.getElementById(targetTab + '-tab').classList.add('active');
                
                // Load admin data if switching to admin tab
                if (targetTab === 'admin') {
                    this.loadAdminData();
                }
            });
        });
    }

    // Load admin data
    async loadAdminData() {
        try {
            const [users, roles] = await Promise.all([
                api.get('/admin/users'),
                api.get('/admin/roles')
            ]);
            
            this.renderUsers(users);
            this.renderRoles(roles);
            this.updateAdminStats(users);
        } catch (error) {
            console.error('Error loading admin data:', error);
        }
    }

    // Render users list
    renderUsers(users) {
        const usersList = document.getElementById('usersList');
        if (!usersList) return;

        usersList.innerHTML = users.map(user => `
            <div class="user-card" data-user-id="${user.id}">
                <div class="user-info">
                    <div class="user-email">${user.email}</div>
                    <div class="user-role ${user.role.replace(/\s+/g, '-').toLowerCase()}">${user.role}</div>
                    <div class="user-status ${user.status}">${user.status}</div>
                    <div class="user-last-login">Last login: ${new Date(user.last_login).toLocaleDateString()}</div>
                </div>
                <div class="user-actions">
                    <button class="promote-btn" onclick="settingsPageManager.promoteUser('${user.id}')">Promote</button>
                    <button class="demote-btn" onclick="settingsPageManager.demoteUser('${user.id}')">Demote</button>
                    <button class="toggle-status-btn" onclick="settingsPageManager.toggleUserStatus('${user.id}')">${user.status === 'active' ? 'Deactivate' : 'Activate'}</button>
                </div>
            </div>
        `).join('');
    }

    // Render roles list
    renderRoles(roles) {
        const rolesList = document.getElementById('rolesList');
        if (!rolesList) return;

        rolesList.innerHTML = Object.entries(roles).map(([roleName, roleData]) => `
            <div class="role-card">
                <div class="role-name">${roleName}</div>
                <div class="role-description">${roleData.description}</div>
                <div class="role-permissions">
                    <strong>Permissions:</strong>
                    <div class="permissions-list">
                        ${roleData.permissions.map(perm => `<span class="permission-tag">${perm}</span>`).join('')}
                    </div>
                </div>
            </div>
        `).join('');
    }

    // Update admin stats
    updateAdminStats(users) {
        const totalUsers = users.length;
        const activeUsers = users.filter(u => u.status === 'active').length;
        const adminUsers = users.filter(u => u.role === 'TaskMaster Admin').length;

        document.getElementById('totalUsers').textContent = totalUsers;
        document.getElementById('activeUsers').textContent = activeUsers;
        document.getElementById('adminUsers').textContent = adminUsers;
    }

    // Admin actions
    async promoteUser(userId) {
        try {
            const result = await api.post(`/admin/users/${userId}/promote`);
            console.log('User promoted:', result);
            this.loadAdminData(); // Refresh data
        } catch (error) {
            console.error('Error promoting user:', error);
            alert('Failed to promote user');
        }
    }

    async demoteUser(userId) {
        try {
            const result = await api.post(`/admin/users/${userId}/demote`);
            console.log('User demoted:', result);
            this.loadAdminData(); // Refresh data
        } catch (error) {
            console.error('Error demoting user:', error);
            alert('Failed to demote user');
        }
    }

    async toggleUserStatus(userId) {
        try {
            const result = await api.post(`/admin/users/${userId}/toggle-status`);
            console.log('User status toggled:', result);
            this.loadAdminData(); // Refresh data
        } catch (error) {
            console.error('Error toggling user status:', error);
            alert('Failed to toggle user status');
        }
    }

    cleanup() {
        const container = document.getElementById('settings-page-container');
        if (container) {
            container.style.display = 'none';
        }
        
        // Restore main container
        const mainContainer = document.querySelector('.main-container');
        if (mainContainer) {
            mainContainer.style.display = 'grid';
        }
        
        document.body.style.overflow = 'hidden';
    }
}

// Global settings page manager instance
let settingsPageManager;