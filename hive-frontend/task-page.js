// Task Page Manager
class TaskPageManager {
    constructor(app) {
        this.app = app;
        this.currentTask = null;
        this.milestones = [];
    }

    // Show task page
    async showTaskPage(taskId) {
        try {
            // Load task data
            this.currentTask = await api.getTask(taskId);
            
            // Check if user has access (owner or team member)
            if (!this.hasTaskAccess(this.currentTask)) {
                this.showAccessDenied();
                return;
            }

            // Load milestones
            this.milestones = await this.loadTaskMilestones(taskId);

            // Render the task page
            this.renderTaskPage();
            
        } catch (error) {
            console.error('Failed to load task:', error);
            this.showTaskNotFound();
        }
    }

    // Check if current user has access to task
    hasTaskAccess(task) {
        const userId = this.app.currentUser?.id;
        
        // Owner has access
        if (task.owner_id === userId) return true;
        
        // Assignee has access
        if (task.assignee_id === userId) return true;
        
        // Team members have access (when we implement projects)
        // TODO: Check project team membership
        
        return false;
    }

    // Load task milestones
    async loadTaskMilestones(taskId) {
        try {
            // For now, convert DoD items to milestones
            // Later, enhance with dedicated milestone system
            const task = this.currentTask;
            
            if (task.definition_of_done) {
                return task.definition_of_done.map((dod, index) => ({
                    id: `milestone-${index}`,
                    title: dod.text,
                    completed: dod.completed,
                    dod_alignment: 'Core requirement',
                    okr_alignment: 'To be defined',
                    prime_directive_alignment: this.calculatePrimeDirectiveAlignment(dod.text),
                    files: [],
                    help_requests: [],
                    order: index
                }));
            }
            
            return [];
        } catch (error) {
            console.error('Failed to load milestones:', error);
            return [];
        }
    }

    // Calculate how milestone aligns with prime directive
    calculatePrimeDirectiveAlignment(text) {
        // Simple keyword-based alignment calculation
        const keywords = {
            'consciousness': 0.9,
            'benefit': 0.8,
            'beings': 0.8,
            'wellbeing': 0.7,
            'health': 0.6,
            'education': 0.6,
            'sustainability': 0.7,
            'environment': 0.6,
            'community': 0.6
        };

        let score = 0;
        const lowerText = text.toLowerCase();
        
        for (const [keyword, value] of Object.entries(keywords)) {
            if (lowerText.includes(keyword)) {
                score = Math.max(score, value);
            }
        }

        if (score >= 0.8) return 'High Alignment';
        if (score >= 0.6) return 'Medium Alignment';
        if (score >= 0.3) return 'Low Alignment';
        return 'Needs Review';
    }

    // Render the complete task page
    renderTaskPage() {
        const task = this.currentTask;
        
        const taskPageHTML = `
            <div class="task-page">
                <!-- Task Header -->
                <div class="task-header">
                    <button class="back-btn" onclick="router.navigate('/')">← Back to Dashboard</button>
                    <div class="task-title-section">
                        <h1 class="task-title">${task.title}</h1>
                        <div class="task-meta">
                            <span class="task-status status-${task.status}">${task.status}</span>
                            <span class="task-priority priority-${task.priority}">${task.priority}</span>
                            <span class="task-category">${task.category}</span>
                        </div>
                    </div>
                </div>

                <!-- Task Content -->
                <div class="task-content">
                    <!-- Left Column: Milestones -->
                    <div class="task-left-column">
                        <div class="task-description">
                            <h3>Description</h3>
                            <p>${task.description}</p>
                        </div>

                        <div class="milestones-section">
                            <h3>Milestones & Definition of Done</h3>
                            <div class="milestones-list">
                                ${this.renderMilestones()}
                            </div>
                        </div>
                    </div>

                    <!-- Right Column: Communication & Files -->
                    <div class="task-right-column">
                        <div class="task-chat-section">
                            <h3>Team Chat</h3>
                            <div class="chat-container" id="taskChat">
                                <!-- Chat messages will be loaded here -->
                                <p class="chat-placeholder">Chat system coming soon...</p>
                            </div>
                        </div>

                        <div class="task-files-section">
                            <h3>Task Files</h3>
                            <div class="files-container" id="taskFiles">
                                <!-- Files will be loaded here -->
                                <p class="files-placeholder">File system coming soon...</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Hide the dashboard layout and show task page full screen
        const mainContainer = document.querySelector('.main-container');
        mainContainer.style.display = 'none';
        
        // Create a new container for the task page
        let taskContainer = document.getElementById('task-page-container');
        if (!taskContainer) {
            taskContainer = document.createElement('div');
            taskContainer.id = 'task-page-container';
            document.body.appendChild(taskContainer);
        }
        
        taskContainer.innerHTML = taskPageHTML;
        taskContainer.style.display = 'block';
        
        // Enable scrolling on body when showing task page
        document.body.style.overflow = 'auto';

        // Setup event listeners
        this.setupTaskPageEventListeners();
    }

    // Render milestones list
    renderMilestones() {
        if (!this.milestones.length) {
            return '<p class="no-milestones">No milestones defined yet.</p>';
        }

        return this.milestones.map(milestone => `
            <div class="milestone-item ${milestone.completed ? 'completed' : ''}" data-milestone-id="${milestone.id}">
                <div class="milestone-header">
                    <div class="milestone-checkbox">
                        <input type="checkbox" ${milestone.completed ? 'checked' : ''} 
                               onchange="taskPageManager.toggleMilestone('${milestone.id}')">
                    </div>
                    <div class="milestone-title">${milestone.title}</div>
                    <button class="help-btn" onclick="taskPageManager.requestHelp('${milestone.id}')">
                        🆘 I Need Help
                    </button>
                </div>
                
                <div class="milestone-alignment">
                    <div class="alignment-item">
                        <span class="alignment-label">DoD:</span>
                        <span class="alignment-value">${milestone.dod_alignment}</span>
                    </div>
                    <div class="alignment-item">
                        <span class="alignment-label">OKR:</span>
                        <span class="alignment-value">${milestone.okr_alignment}</span>
                    </div>
                    <div class="alignment-item">
                        <span class="alignment-label">Prime Directive:</span>
                        <span class="alignment-value ${this.getAlignmentClass(milestone.prime_directive_alignment)}">${milestone.prime_directive_alignment}</span>
                    </div>
                </div>

                <div class="milestone-files">
                    <div class="files-header">
                        <span>Proof of Work Files:</span>
                        <button class="upload-btn" onclick="taskPageManager.uploadFile('${milestone.id}')">
                            📎 Upload
                        </button>
                    </div>
                    <div class="files-list" id="files-${milestone.id}">
                        ${milestone.files.length ? this.renderMilestoneFiles(milestone.files) : '<p class="no-files">No files uploaded yet.</p>'}
                    </div>
                </div>
            </div>
        `).join('');
    }

    // Render files for a milestone
    renderMilestoneFiles(files) {
        return files.map(file => `
            <div class="file-item">
                <span class="file-icon">${this.getFileIcon(file.type)}</span>
                <span class="file-name">${file.name}</span>
                <span class="file-size">${this.formatFileSize(file.size)}</span>
                <button class="file-download" onclick="taskPageManager.downloadFile('${file.id}')">⬇</button>
            </div>
        `).join('');
    }

    // Get CSS class for alignment level
    getAlignmentClass(alignment) {
        switch(alignment) {
            case 'High Alignment': return 'alignment-high';
            case 'Medium Alignment': return 'alignment-medium';
            case 'Low Alignment': return 'alignment-low';
            default: return 'alignment-needs-review';
        }
    }

    // Get file type icon
    getFileIcon(type) {
        if (type.includes('image')) return '🖼️';
        if (type.includes('pdf')) return '📄';
        if (type.includes('text')) return '📝';
        if (type.includes('html')) return '🌐';
        return '📁';
    }

    // Format file size
    formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1048576) return Math.round(bytes / 1024) + ' KB';
        return Math.round(bytes / 1048576) + ' MB';
    }

    // Setup event listeners for task page
    setupTaskPageEventListeners() {
        // Add any additional event listeners needed
        console.log('Task page event listeners setup');
    }

    // Toggle milestone completion
    async toggleMilestone(milestoneId) {
        try {
            const milestone = this.milestones.find(m => m.id === milestoneId);
            if (milestone) {
                milestone.completed = !milestone.completed;
                // TODO: Save to backend
                console.log(`Milestone ${milestoneId} toggled to ${milestone.completed}`);
            }
        } catch (error) {
            console.error('Failed to toggle milestone:', error);
        }
    }

    // Request help for milestone
    async requestHelp(milestoneId) {
        try {
            // TODO: Implement help request system
            alert(`Help requested for milestone ${milestoneId}. Notification system coming soon!`);
        } catch (error) {
            console.error('Failed to request help:', error);
        }
    }

    // Upload file for milestone
    async uploadFile(milestoneId) {
        try {
            // TODO: Implement file upload
            alert(`File upload for milestone ${milestoneId}. File system coming soon!`);
        } catch (error) {
            console.error('Failed to upload file:', error);
        }
    }

    // Download file
    async downloadFile(fileId) {
        try {
            // TODO: Implement file download
            alert(`Download file ${fileId}. File system coming soon!`);
        } catch (error) {
            console.error('Failed to download file:', error);
        }
    }

    // Show access denied message
    showAccessDenied() {
        // Hide the dashboard layout
        const mainContainer = document.querySelector('.main-container');
        mainContainer.style.display = 'none';
        
        // Create or get task container
        let taskContainer = document.getElementById('task-page-container');
        if (!taskContainer) {
            taskContainer = document.createElement('div');
            taskContainer.id = 'task-page-container';
            document.body.appendChild(taskContainer);
        }
        
        taskContainer.innerHTML = `
            <div class="access-denied">
                <h2>Access Denied</h2>
                <p>You don't have permission to view this task.</p>
                <button onclick="router.navigate('/')">Back to Dashboard</button>
            </div>
        `;
        taskContainer.style.display = 'block';
        document.body.style.overflow = 'auto';
    }

    // Show task not found message
    showTaskNotFound() {
        // Hide the dashboard layout
        const mainContainer = document.querySelector('.main-container');
        mainContainer.style.display = 'none';
        
        // Create or get task container
        let taskContainer = document.getElementById('task-page-container');
        if (!taskContainer) {
            taskContainer = document.createElement('div');
            taskContainer.id = 'task-page-container';
            document.body.appendChild(taskContainer);
        }
        
        taskContainer.innerHTML = `
            <div class="task-not-found">
                <h2>Task Not Found</h2>
                <p>The requested task could not be found.</p>
                <button onclick="router.navigate('/')">Back to Dashboard</button>
            </div>
        `;
        taskContainer.style.display = 'block';
        document.body.style.overflow = 'auto';
    }
}

// Global task page manager instance
let taskPageManager;