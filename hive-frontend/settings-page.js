// Settings Page Manager
class SettingsPageManager {
    constructor(app) {
        this.app = app;
    }

    // Show settings page
    showSettingsPage() {
        const settingsPageHTML = `
            <div class="settings-page">
                <!-- Settings Header -->
                <div class="settings-header">
                    <button class="back-btn" onclick="router.navigate('/')">← Back to Dashboard</button>
                    <h1>Settings</h1>
                </div>

                <!-- Settings Content -->
                <div class="settings-content">
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
        
        // Enable scrolling
        document.body.style.overflow = 'auto';
        
        // Setup event listeners
        this.setupSettingsEventListeners();
        
        // Render user skills
        this.app.renderUserSkills();
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
    }
}

// Global settings page manager instance
let settingsPageManager;