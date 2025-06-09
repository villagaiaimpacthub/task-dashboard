// Task Page Manager
class TaskPageManager {
    constructor(app) {
        this.app = app;
        this.currentTask = null;
        this.milestones = [];
        this.chatMessages = [];
        this.publicComments = [];
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

            // Load existing files for all milestones
            await this.loadExistingFiles(taskId);

            // Load existing chat messages
            await this.loadChatMessages(taskId);

            // Load public comments
            await this.loadPublicComments(taskId);

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

                        <div class="task-metadata-section">
                            <h3>Task Details & Metadata</h3>
                            <div class="metadata-grid">
                                ${this.renderTaskMetadata()}
                            </div>
                        </div>

                        <div class="milestones-section">
                            <div class="milestones-header">
                                <h3>Milestones & Definition of Done</h3>
                                <button class="create-milestone-btn" onclick="taskPageManager.showCreateMilestoneForm()">
                                    ➕ Add Milestone
                                </button>
                            </div>
                            
                            <div class="milestone-creation-form" id="milestoneCreationForm" style="display: none;">
                                <h4>Create New Milestone</h4>
                                <form id="newMilestoneForm" onsubmit="taskPageManager.handleCreateMilestone(event)">
                                    <div class="form-group">
                                        <label for="milestoneTitle">Milestone Title*</label>
                                        <input type="text" id="milestoneTitle" placeholder="e.g., Complete site analysis and soil testing" required>
                                    </div>
                                    
                                    <div class="form-group">
                                        <label for="milestoneDescription">Description</label>
                                        <textarea id="milestoneDescription" placeholder="Detailed description of what needs to be accomplished" rows="2"></textarea>
                                    </div>
                                    
                                    <div class="framework-hierarchy-section">
                                        <h5>🎯 Framework Hierarchy</h5>
                                        <p class="framework-description">Prime Directive sets the tone → OKRs set the direction → DoD defines the scope</p>
                                        
                                        <div class="framework-step">
                                            <div class="step-header">
                                                <span class="step-number">1</span>
                                                <span class="step-title">Prime Directive Foundation</span>
                                            </div>
                                            <div class="form-group">
                                                <label for="primeDirectiveContribution">How does this milestone contribute to elevating consciousness and collective wellbeing?</label>
                                                <textarea id="primeDirectiveContribution" placeholder="Describe how this milestone directly serves the Prime Directive of elevating consciousness..." rows="2" required></textarea>
                                            </div>
                                        </div>

                                        <div class="framework-step">
                                            <div class="step-header">
                                                <span class="step-number">2</span>
                                                <span class="step-title">OKR Strategic Direction</span>
                                            </div>
                                            <div class="form-group">
                                                <label for="okrConnection">Which OKR does this milestone advance?</label>
                                                <select id="okrConnection" required>
                                                    <option value="">Select relevant OKR...</option>
                                                    <option value="Regenerative Systems">Regenerative Systems - Building sustainable ecosystems</option>
                                                    <option value="Community Impact">Community Impact - Expanding positive influence</option>
                                                    <option value="Knowledge Sharing">Knowledge Sharing - Democratizing wisdom</option>
                                                    <option value="Consciousness Tools">Consciousness Tools - Creating awareness platforms</option>
                                                    <option value="Collaboration Networks">Collaboration Networks - Connecting changemakers</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div class="framework-step">
                                            <div class="step-header">
                                                <span class="step-number">3</span>
                                                <span class="step-title">Definition of Done (Scope)</span>
                                            </div>
                                            <div class="form-group">
                                                <label for="dodCategory">DoD Category</label>
                                                <select id="dodCategory" required>
                                                    <option value="">Select completion type...</option>
                                                    <option value="Research Complete">Research Complete - Information gathered and analyzed</option>
                                                    <option value="Deliverable Created">Deliverable Created - Tangible output produced</option>
                                                    <option value="System Implemented">System Implemented - Process or tool operational</option>
                                                    <option value="Community Engaged">Community Engaged - Stakeholders activated</option>
                                                    <option value="Knowledge Transferred">Knowledge Transferred - Learning shared effectively</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="form-group">
                                        <label for="milestoneDeadline">Target Completion Date</label>
                                        <input type="date" id="milestoneDeadline">
                                    </div>
                                    
                                    <div class="form-group">
                                        <label for="acceptanceCriteria">Acceptance Criteria (one per line)</label>
                                        <textarea id="acceptanceCriteria" placeholder="• Soil pH tested at 5 locations&#10;• Water table depth measured&#10;• Existing vegetation cataloged" rows="3"></textarea>
                                    </div>
                                    
                                    <div class="form-actions">
                                        <button type="button" onclick="taskPageManager.cancelCreateMilestone()" class="cancel-btn">Cancel</button>
                                        <button type="submit" class="submit-btn">Create Milestone</button>
                                    </div>
                                </form>
                            </div>
                            
                            <div class="milestones-list">
                                ${this.renderMilestones()}
                            </div>
                        </div>

                        <div class="public-comments-section">
                            <h3>Public Comments</h3>
                            <div class="comments-container" id="publicComments">
                                <div class="comments-list" id="commentsList">
                                    <!-- Comments will be loaded here -->
                                </div>
                                <div class="comment-input-container">
                                    <div class="comment-input-wrapper">
                                        <textarea id="commentInput" placeholder="Share your thoughts, feedback, or suggestions..." 
                                                  rows="3" onkeydown="taskPageManager.handleCommentKeyPress(event)"></textarea>
                                        <button class="comment-btn" onclick="taskPageManager.submitComment()">
                                            💬 Comment
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Right Column: Communication & Files -->
                    <div class="task-right-column">
                        <div class="task-chat-section">
                            <h3>Team Chat</h3>
                            <div class="chat-container" id="taskChat">
                                <div class="chat-messages" id="chatMessages">
                                    <!-- Chat messages will be loaded here -->
                                </div>
                                <div class="chat-input-container">
                                    <div class="chat-input-wrapper">
                                        <input type="text" id="chatInput" placeholder="Type your message..." 
                                               onkeypress="taskPageManager.handleChatKeyPress(event)">
                                        <button class="send-btn" onclick="taskPageManager.sendChatMessage()">
                                            📤
                                        </button>
                                    </div>
                                </div>
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

    // Render task metadata
    renderTaskMetadata() {
        const task = this.currentTask;
        
        // Format dates
        const formatDate = (dateStr) => {
            if (!dateStr) return 'Not set';
            const date = new Date(dateStr);
            return date.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
            });
        };

        // Calculate time remaining
        const calculateTimeRemaining = (dueDate) => {
            if (!dueDate || dueDate === 'Not set') return 'No deadline';
            
            // Handle relative dates like "2 weeks", "3 days"
            if (typeof dueDate === 'string' && !dueDate.includes('T')) {
                return dueDate;
            }
            
            const now = new Date();
            const due = new Date(dueDate);
            const diff = due - now;
            
            if (diff < 0) return 'Overdue';
            
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            
            if (days > 0) return `${days} days remaining`;
            if (hours > 0) return `${hours} hours remaining`;
            return 'Due soon';
        };

        return `
            <div class="metadata-item">
                <span class="metadata-label">📅 Timeline</span>
                <div class="metadata-value">
                    <div class="timeline-item">
                        <span class="timeline-label">Created:</span>
                        <span>${formatDate(task.created_at)}</span>
                    </div>
                    <div class="timeline-item">
                        <span class="timeline-label">Due:</span>
                        <span class="due-date">${task.due_date || 'Not set'}</span>
                        <span class="time-remaining">${calculateTimeRemaining(task.due_date)}</span>
                    </div>
                    <div class="timeline-item">
                        <span class="timeline-label">Last Updated:</span>
                        <span>${formatDate(task.updated_at)}</span>
                    </div>
                </div>
            </div>

            <div class="metadata-item">
                <span class="metadata-label">👥 Team & Authority</span>
                <div class="metadata-value">
                    <div class="team-item">
                        <span class="team-label">Owner:</span>
                        <span class="user-link">${task.owner_id || 'Unassigned'}</span>
                    </div>
                    <div class="team-item">
                        <span class="team-label">Assignee:</span>
                        <span class="user-link">${task.assignee_id || 'Available'}</span>
                    </div>
                    <div class="team-item">
                        <span class="team-label">Team Size:</span>
                        <span>${task.team_size || 'Not specified'}</span>
                    </div>
                    <div class="team-item">
                        <span class="team-label">Authority Required:</span>
                        <span>${task.authority_level || 'Standard'}</span>
                    </div>
                </div>
            </div>

            <div class="metadata-item">
                <span class="metadata-label">🎯 Scope & Impact</span>
                <div class="metadata-value">
                    <div class="scope-item">
                        <span class="scope-label">Category:</span>
                        <span class="category-badge">${task.category}</span>
                    </div>
                    <div class="scope-item">
                        <span class="scope-label">Priority:</span>
                        <span class="priority-badge priority-${task.priority}">${task.priority}</span>
                    </div>
                    <div class="scope-item">
                        <span class="scope-label">Impact Points:</span>
                        <span class="impact-badge">${task.impact_points} pts</span>
                    </div>
                    <div class="scope-item">
                        <span class="scope-label">Location:</span>
                        <span>${task.location || 'Remote'}</span>
                    </div>
                    <div class="scope-item">
                        <span class="scope-label">Scope:</span>
                        <span>${task.scope || 'Project'}</span>
                    </div>
                </div>
            </div>

            <div class="metadata-item">
                <span class="metadata-label">⏱️ Effort & Resources</span>
                <div class="metadata-value">
                    <div class="effort-item">
                        <span class="effort-label">Estimated Hours:</span>
                        <span>${task.estimated_hours || 'Not estimated'}</span>
                    </div>
                    <div class="effort-item">
                        <span class="effort-label">Budget:</span>
                        <span>${task.budget ? `$${task.budget.toLocaleString()}` : 'Not specified'}</span>
                    </div>
                    <div class="effort-item">
                        <span class="effort-label">Resources Needed:</span>
                        <span>${task.resources_needed || 'Standard tools'}</span>
                    </div>
                </div>
            </div>

            <div class="metadata-item">
                <span class="metadata-label">🔗 Dependencies</span>
                <div class="metadata-value">
                    ${task.dependencies && task.dependencies.length > 0 ? 
                        task.dependencies.map(dep => `
                            <div class="dependency-item">
                                <span class="dependency-icon">➔</span>
                                <span class="dependency-link" onclick="router.navigate('/task/${dep.id}')">${dep.title}</span>
                                <span class="dependency-status status-${dep.status}">${dep.status}</span>
                            </div>
                        `).join('') : 
                        '<span class="no-dependencies">No dependencies</span>'
                    }
                </div>
            </div>

            <div class="metadata-item">
                <span class="metadata-label">💼 Required Skills</span>
                <div class="metadata-value skills-list">
                    ${task.required_skills && task.required_skills.length > 0 ?
                        task.required_skills.map(skill => `
                            <span class="skill-tag">${skill}</span>
                        `).join('') :
                        '<span class="no-skills">No specific skills required</span>'
                    }
                </div>
            </div>

            <div class="metadata-item">
                <span class="metadata-label">📊 Success Metrics</span>
                <div class="metadata-value">
                    ${task.success_metrics ? 
                        `<ul class="metrics-list">
                            ${task.success_metrics.map(metric => `<li>${metric}</li>`).join('')}
                        </ul>` :
                        '<span class="no-metrics">Success metrics not defined</span>'
                    }
                </div>
            </div>

            <div class="metadata-item">
                <span class="metadata-label">📦 Deliverables</span>
                <div class="metadata-value">
                    ${task.deliverables ? 
                        `<ul class="deliverables-list">
                            ${task.deliverables.map(deliverable => `<li>${deliverable}</li>`).join('')}
                        </ul>` :
                        '<span class="no-deliverables">Deliverables not specified</span>'
                    }
                </div>
            </div>
        `;
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
                    <div class="milestone-deadline">
                        ${milestone.deadline ? `📅 Due: ${this.formatDate(milestone.deadline)}` : ''}
                    </div>
                    <button class="help-btn" onclick="taskPageManager.requestHelp('${milestone.id}')">
                        🆘 I Need Help
                    </button>
                </div>
                
                ${milestone.description ? `
                    <div class="milestone-description">
                        <p>${milestone.description}</p>
                    </div>
                ` : ''}
                
                <div class="milestone-framework">
                    <div class="framework-hierarchy">
                        <div class="framework-level">
                            <div class="level-header">
                                <span class="level-number">1</span>
                                <span class="level-title">Prime Directive Foundation</span>
                            </div>
                            <div class="level-content">
                                ${milestone.prime_directive_contribution || 'Not specified'}
                            </div>
                        </div>
                        
                        <div class="framework-level">
                            <div class="level-header">
                                <span class="level-number">2</span>
                                <span class="level-title">OKR Direction</span>
                            </div>
                            <div class="level-content">
                                <span class="okr-badge">${milestone.okr_connection || 'Not specified'}</span>
                            </div>
                        </div>
                        
                        <div class="framework-level">
                            <div class="level-header">
                                <span class="level-number">3</span>
                                <span class="level-title">DoD Scope</span>
                            </div>
                            <div class="level-content">
                                <span class="dod-badge">${milestone.dod_category || 'Not specified'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                ${milestone.acceptance_criteria && milestone.acceptance_criteria.length > 0 ? `
                    <div class="acceptance-criteria">
                        <h6>Acceptance Criteria</h6>
                        <ul class="criteria-list">
                            ${milestone.acceptance_criteria.map(criteria => `
                                <li class="criteria-item">
                                    <span class="criteria-bullet">✓</span>
                                    <span class="criteria-text">${criteria}</span>
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                ` : ''}

                <div class="milestone-files">
                    <div class="files-header">
                        <span>Proof of Work Files:</span>
                        <button class="upload-btn" onclick="taskPageManager.uploadFile('${milestone.id}')">
                            📎 Upload
                        </button>
                    </div>
                    <div class="files-list" id="files-${milestone.id}">
                        ${milestone.files && milestone.files.length ? this.renderMilestoneFiles(milestone.files) : '<p class="no-files">No files uploaded yet.</p>'}
                    </div>
                </div>

                <div class="milestone-help-requests" id="help-requests-${milestone.id}">
                    ${this.renderHelpRequests(milestone.help_requests || [])}
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

    // Format date for display
    formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    // Setup event listeners for task page
    setupTaskPageEventListeners() {
        // Load and render chat messages after page is ready
        this.renderChatMessages();
        
        // Load and render public comments after page is ready
        this.renderPublicComments();
        
        // Set up auto-refresh for chat (every 5 seconds)
        if (this.chatRefreshInterval) {
            clearInterval(this.chatRefreshInterval);
        }
        this.chatRefreshInterval = setInterval(() => {
            this.loadChatMessages(this.currentTask.id);
        }, 5000);
        
        // Set up auto-refresh for comments (every 10 seconds - less frequent than chat)
        if (this.commentsRefreshInterval) {
            clearInterval(this.commentsRefreshInterval);
        }
        this.commentsRefreshInterval = setInterval(() => {
            this.loadPublicComments(this.currentTask.id);
        }, 10000);
        
        console.log('Task page event listeners setup');
    }

    // Load chat messages for task
    async loadChatMessages(taskId) {
        try {
            const response = await fetch(`http://localhost:8000/api/v1/chat/task/${taskId}/messages`);
            if (response.ok) {
                this.chatMessages = await response.json();
                this.renderChatMessages();
            }
        } catch (error) {
            console.error('Failed to load chat messages:', error);
        }
    }

    // Render chat messages
    renderChatMessages() {
        const chatContainer = document.getElementById('chatMessages');
        if (!chatContainer) return;

        if (this.chatMessages.length === 0) {
            chatContainer.innerHTML = `
                <div class="no-messages">
                    <p>No messages yet. Start the conversation!</p>
                </div>
            `;
            return;
        }

        const messagesHtml = this.chatMessages.map(message => {
            const timestamp = new Date(message.created_at).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
            });
            const isCurrentUser = message.sender_id === this.app.currentUser?.id;
            
            return `
                <div class="chat-message ${isCurrentUser ? 'own-message' : 'other-message'}">
                    <div class="message-header">
                        <span class="sender-name">${message.sender_email}</span>
                        <span class="message-time">${timestamp}</span>
                    </div>
                    <div class="message-content">
                        ${this.formatMessageContent(message.content)}
                    </div>
                </div>
            `;
        }).join('');

        chatContainer.innerHTML = messagesHtml;
        
        // Auto-scroll to bottom
        setTimeout(() => {
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }, 100);
    }

    // Format message content (simple markdown support)
    formatMessageContent(content) {
        return content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .replace(/\n/g, '<br>');
    }

    // Handle enter key press in chat input
    handleChatKeyPress(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            this.sendChatMessage();
        }
    }

    // Send chat message
    async sendChatMessage() {
        const chatInput = document.getElementById('chatInput');
        if (!chatInput) return;

        const content = chatInput.value.trim();
        if (!content) return;

        try {
            const messageData = {
                content: content,
                sender_id: this.app.currentUser?.id,
                sender_email: this.app.currentUser?.email || 'unknown@example.com',
                message_type: 'task_chat'
            };

            const response = await fetch(`http://localhost:8000/api/v1/chat/task/${this.currentTask.id}/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(messageData)
            });

            if (response.ok) {
                const newMessage = await response.json();
                this.chatMessages.push(newMessage);
                this.renderChatMessages();
                chatInput.value = '';
                
                // Show success feedback briefly
                this.showChatSentFeedback();
            } else {
                throw new Error('Failed to send message');
            }
        } catch (error) {
            console.error('Failed to send chat message:', error);
            this.app.showNotification('Failed to send message. Please try again.', 'error');
        }
    }

    // Show brief feedback when message is sent
    showChatSentFeedback() {
        const sendBtn = document.querySelector('.send-btn');
        if (sendBtn) {
            const originalText = sendBtn.textContent;
            sendBtn.textContent = '✅';
            sendBtn.style.background = '#4caf50';
            
            setTimeout(() => {
                sendBtn.textContent = originalText;
                sendBtn.style.background = '';
            }, 1000);
        }
    }

    // Clean up chat interval when leaving page
    cleanupChat() {
        if (this.chatRefreshInterval) {
            clearInterval(this.chatRefreshInterval);
            this.chatRefreshInterval = null;
        }
        if (this.commentsRefreshInterval) {
            clearInterval(this.commentsRefreshInterval);
            this.commentsRefreshInterval = null;
        }
    }

    // Load public comments for task
    async loadPublicComments(taskId) {
        try {
            const response = await fetch(`http://localhost:8000/api/v1/comments/task/${taskId}`);
            if (response.ok) {
                this.publicComments = await response.json();
                this.renderPublicComments();
            }
        } catch (error) {
            console.error('Failed to load public comments:', error);
        }
    }

    // Render public comments
    renderPublicComments() {
        const commentsContainer = document.getElementById('commentsList');
        if (!commentsContainer) return;

        if (this.publicComments.length === 0) {
            commentsContainer.innerHTML = `
                <div class="no-comments">
                    <p>No comments yet. Be the first to share your thoughts!</p>
                </div>
            `;
            return;
        }

        const commentsHtml = this.publicComments.map(comment => {
            const timestamp = new Date(comment.created_at).toLocaleDateString([], {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            return `
                <div class="public-comment">
                    <div class="comment-header">
                        <div class="comment-author">
                            <span class="author-avatar">${comment.author_email[0].toUpperCase()}</span>
                            <div class="author-info">
                                <span class="author-name">${comment.author_email}</span>
                                <span class="author-role">${comment.author_role}</span>
                            </div>
                        </div>
                        <span class="comment-time">${timestamp}</span>
                    </div>
                    <div class="comment-content">
                        ${this.formatCommentContent(comment.content)}
                    </div>
                </div>
            `;
        }).join('');

        commentsContainer.innerHTML = commentsHtml;
    }

    // Format comment content (similar to chat but with more features)
    formatCommentContent(content) {
        return content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .replace(/\n/g, '<br>')
            // Add support for simple links
            .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');
    }

    // Handle Ctrl+Enter or Shift+Enter in comment textarea
    handleCommentKeyPress(event) {
        if ((event.ctrlKey || event.shiftKey) && event.key === 'Enter') {
            event.preventDefault();
            this.submitComment();
        }
    }

    // Submit public comment
    async submitComment() {
        const commentInput = document.getElementById('commentInput');
        if (!commentInput) return;

        const content = commentInput.value.trim();
        if (!content) {
            this.app.showNotification('Please enter a comment before submitting.', 'error');
            return;
        }

        try {
            const commentData = {
                content: content,
                task_id: this.currentTask.id,
                author_id: this.app.currentUser?.id,
                author_email: this.app.currentUser?.email || 'unknown@example.com',
                author_role: this.app.currentUser?.role || 'Community Member'
            };

            const response = await fetch('http://localhost:8000/api/v1/comments/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(commentData)
            });

            if (response.ok) {
                const newComment = await response.json();
                this.publicComments.push(newComment);
                this.renderPublicComments();
                commentInput.value = '';
                
                // Show success feedback
                this.showCommentSubmittedFeedback();
                
                // Scroll to the new comment
                setTimeout(() => {
                    const commentsContainer = document.getElementById('commentsList');
                    if (commentsContainer) {
                        commentsContainer.scrollTop = commentsContainer.scrollHeight;
                    }
                }, 100);
            } else {
                throw new Error('Failed to submit comment');
            }
        } catch (error) {
            console.error('Failed to submit comment:', error);
            this.app.showNotification('Failed to submit comment. Please try again.', 'error');
        }
    }

    // Show brief feedback when comment is submitted
    showCommentSubmittedFeedback() {
        const commentBtn = document.querySelector('.comment-btn');
        if (commentBtn) {
            const originalText = commentBtn.textContent;
            commentBtn.textContent = '✅ Posted';
            commentBtn.style.background = '#4caf50';
            commentBtn.disabled = true;
            
            setTimeout(() => {
                commentBtn.textContent = originalText;
                commentBtn.style.background = '';
                commentBtn.disabled = false;
            }, 2000);
        }
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
            const milestone = this.milestones.find(m => m.id === milestoneId);
            if (!milestone) {
                this.app.showNotification('Milestone not found', 'error');
                return;
            }

            // Show help request dialog
            const reason = prompt(`Request help for milestone: "${milestone.title}"\n\nPlease describe what kind of help you need:`);
            if (!reason || reason.trim() === '') {
                return; // User cancelled or provided empty reason
            }

            // Create help request
            const helpRequest = {
                id: `help-${Date.now()}`,
                milestone_id: milestoneId,
                task_id: this.currentTask.id,
                requester_id: this.app.currentUser?.id,
                requester_name: this.app.currentUser?.name || 'Unknown User',
                reason: reason.trim(),
                status: 'open',
                created_at: new Date().toISOString(),
                urgency: 'medium' // Could be made configurable
            };

            // Send help request to backend
            const response = await fetch('http://localhost:8000/api/v1/help-requests', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(helpRequest)
            });

            if (response.ok) {
                const result = await response.json();
                
                // Add to milestone's help requests
                if (!milestone.help_requests) {
                    milestone.help_requests = [];
                }
                milestone.help_requests.push(helpRequest);
                
                // Update the milestone display to show help request
                this.updateMilestoneHelpDisplay(milestoneId);
                
                // Show success notification
                this.app.showNotification(`Help request sent! Team members will be notified.`);
                
                // Trigger notification system (when available)
                this.notifyTeamOfHelpRequest(helpRequest);
                
            } else {
                throw new Error('Failed to send help request');
            }
        } catch (error) {
            console.error('Failed to request help:', error);
            this.app.showNotification('Failed to send help request. Please try again.', 'error');
        }
    }

    // Upload file for milestone
    async uploadFile(milestoneId) {
        try {
            // Create file input element
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = '.txt,.md,.html,.pdf,.png,.jpg,.jpeg,.gif';
            fileInput.multiple = true;
            
            fileInput.addEventListener('change', async (e) => {
                const files = e.target.files;
                if (files.length === 0) return;
                
                for (const file of files) {
                    await this.uploadSingleFile(file, milestoneId);
                }
                
                // Refresh the milestone files display
                await this.refreshMilestoneFiles(milestoneId);
            });
            
            fileInput.click();
        } catch (error) {
            console.error('Failed to upload file:', error);
            this.app.showNotification('Failed to upload file', 'error');
        }
    }

    // Upload a single file
    async uploadSingleFile(file, milestoneId) {
        try {
            // Show upload progress
            this.showUploadProgress(file.name, milestoneId);
            
            // Convert file to base64
            const base64Content = await this.fileToBase64(file);
            
            const uploadData = {
                name: file.name,
                content: base64Content,
                type: file.type,
                size: file.size,
                task_id: this.currentTask.id,
                milestone_id: milestoneId,
                uploaded_at: new Date().toISOString()
            };
            
            const response = await fetch('http://localhost:8000/api/v1/files/upload', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(uploadData)
            });
            
            if (response.ok) {
                const result = await response.json();
                this.app.showNotification(`File "${file.name}" uploaded successfully!`);
                this.hideUploadProgress(milestoneId);
                return result;
            } else {
                throw new Error('Upload failed');
            }
        } catch (error) {
            console.error('Failed to upload file:', error);
            this.app.showNotification(`Failed to upload "${file.name}"`, 'error');
            this.hideUploadProgress(milestoneId);
            throw error;
        }
    }

    // Convert file to base64
    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                // Remove the data URL prefix (e.g., "data:image/png;base64,")
                const base64 = reader.result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = error => reject(error);
        });
    }

    // Show upload progress
    showUploadProgress(fileName, milestoneId) {
        const filesContainer = document.getElementById(`files-${milestoneId}`);
        if (filesContainer) {
            const progressElement = document.createElement('div');
            progressElement.className = 'upload-progress';
            progressElement.id = `upload-progress-${milestoneId}`;
            progressElement.innerHTML = `
                <div class="uploading-file">
                    <span class="file-icon">⏳</span>
                    <span class="file-name">Uploading: ${fileName}</span>
                    <div class="progress-bar">
                        <div class="progress-fill uploading"></div>
                    </div>
                </div>
            `;
            filesContainer.appendChild(progressElement);
        }
    }

    // Hide upload progress
    hideUploadProgress(milestoneId) {
        const progressElement = document.getElementById(`upload-progress-${milestoneId}`);
        if (progressElement) {
            progressElement.remove();
        }
    }

    // Refresh milestone files display
    async refreshMilestoneFiles(milestoneId) {
        try {
            const response = await fetch(`http://localhost:8000/api/v1/files/task/${this.currentTask.id}`);
            if (response.ok) {
                const files = await response.json();
                const milestoneFiles = files.filter(file => file.milestone_id === milestoneId);
                
                // Find the milestone and update its files
                const milestone = this.milestones.find(m => m.id === milestoneId);
                if (milestone) {
                    milestone.files = milestoneFiles;
                    this.updateMilestoneFilesDisplay(milestoneId, milestoneFiles);
                }
            }
        } catch (error) {
            console.error('Failed to refresh files:', error);
        }
    }

    // Update the files display for a specific milestone
    updateMilestoneFilesDisplay(milestoneId, files) {
        const filesContainer = document.getElementById(`files-${milestoneId}`);
        if (filesContainer) {
            const filesListHtml = files.length ? 
                this.renderMilestoneFiles(files) : 
                '<p class="no-files">No files uploaded yet.</p>';
            filesContainer.innerHTML = filesListHtml;
        }
    }

    // Load existing files for the task
    async loadExistingFiles(taskId) {
        try {
            const response = await fetch(`http://localhost:8000/api/v1/files/task/${taskId}`);
            if (response.ok) {
                const files = await response.json();
                
                // Organize files by milestone
                for (const milestone of this.milestones) {
                    const milestoneFiles = files.filter(file => file.milestone_id === milestone.id);
                    milestone.files = milestoneFiles;
                }
            }
        } catch (error) {
            console.error('Failed to load existing files:', error);
        }
    }

    // Download file
    async downloadFile(fileId) {
        try {
            const response = await fetch(`http://localhost:8000/api/v1/files/download/${fileId}`);
            if (response.ok) {
                const blob = await response.blob();
                const filename = response.headers.get('content-disposition')?.split('filename=')[1]?.replace(/"/g, '') || 'download';
                
                // Create download link
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                
                this.app.showNotification(`File "${filename}" downloaded successfully!`);
            } else {
                throw new Error('Download failed');
            }
        } catch (error) {
            console.error('Failed to download file:', error);
            this.app.showNotification('Failed to download file', 'error');
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

    // Render help requests for a milestone
    renderHelpRequests(helpRequests) {
        if (!helpRequests || helpRequests.length === 0) {
            return '';
        }

        return `
            <div class="help-requests-section">
                <h4>Help Requests</h4>
                <div class="help-requests-list">
                    ${helpRequests.map(request => `
                        <div class="help-request-item ${request.status}" data-request-id="${request.id}">
                            <div class="help-request-header">
                                <span class="help-request-urgency urgency-${request.urgency}">
                                    ${request.urgency.toUpperCase()}
                                </span>
                                <span class="help-request-status">
                                    ${request.status.toUpperCase()}
                                </span>
                                <span class="help-request-date">
                                    ${new Date(request.created_at).toLocaleDateString()}
                                </span>
                            </div>
                            <div class="help-request-content">
                                <p class="help-request-reason">"${request.reason}"</p>
                                <p class="help-request-requester">
                                    Requested by: <strong>${request.requester_name}</strong>
                                </p>
                            </div>
                            <div class="help-request-actions">
                                ${this.renderHelpRequestActions(request)}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    // Render help request actions based on user role and request status
    renderHelpRequestActions(request) {
        const currentUserId = this.app.currentUser?.id;
        const isRequester = request.requester_id === currentUserId;
        
        if (request.status === 'open') {
            if (isRequester) {
                return `
                    <button class="cancel-help-btn" onclick="taskPageManager.cancelHelpRequest('${request.id}')">
                        Cancel Request
                    </button>
                `;
            } else {
                return `
                    <button class="respond-help-btn" onclick="taskPageManager.respondToHelpRequest('${request.id}')">
                        Offer Help
                    </button>
                `;
            }
        } else if (request.status === 'resolved') {
            return `<span class="help-resolved">✅ Resolved</span>`;
        } else if (request.status === 'cancelled') {
            return `<span class="help-cancelled">❌ Cancelled</span>`;
        }
        
        return '';
    }

    // Update milestone help display
    updateMilestoneHelpDisplay(milestoneId) {
        const milestone = this.milestones.find(m => m.id === milestoneId);
        if (!milestone) return;

        const helpContainer = document.getElementById(`help-requests-${milestoneId}`);
        if (helpContainer) {
            helpContainer.innerHTML = this.renderHelpRequests(milestone.help_requests || []);
        }
    }

    // Cancel help request
    async cancelHelpRequest(requestId) {
        try {
            const response = await fetch(`http://localhost:8000/api/v1/help-requests/${requestId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                // Remove from local state
                for (const milestone of this.milestones) {
                    if (milestone.help_requests) {
                        milestone.help_requests = milestone.help_requests.filter(req => req.id !== requestId);
                        this.updateMilestoneHelpDisplay(milestone.id);
                    }
                }
                
                this.app.showNotification('Help request cancelled');
            } else {
                throw new Error('Failed to cancel help request');
            }
        } catch (error) {
            console.error('Failed to cancel help request:', error);
            this.app.showNotification('Failed to cancel help request', 'error');
        }
    }

    // Respond to help request
    async respondToHelpRequest(requestId) {
        try {
            const response = prompt('Offer help for this request. Describe how you can assist:');
            if (!response || response.trim() === '') {
                return;
            }

            const helpResponse = {
                request_id: requestId,
                helper_id: this.app.currentUser?.id,
                helper_name: this.app.currentUser?.name || 'Unknown User',
                response: response.trim(),
                created_at: new Date().toISOString()
            };

            const apiResponse = await fetch(`http://localhost:8000/api/v1/help-requests/${requestId}/respond`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(helpResponse)
            });

            if (apiResponse.ok) {
                this.app.showNotification('Help offer sent! The requester will be notified.');
                // Refresh help requests display
                await this.loadTaskMilestones(this.currentTask.id);
                this.renderTaskPage();
            } else {
                throw new Error('Failed to send help response');
            }
        } catch (error) {
            console.error('Failed to respond to help request:', error);
            this.app.showNotification('Failed to send help response', 'error');
        }
    }

    // Notify team of help request (placeholder for real notification system)
    notifyTeamOfHelpRequest(helpRequest) {
        // In a real implementation, this would:
        // 1. Find team members with relevant skills
        // 2. Send notifications via email, push notifications, etc.
        // 3. Update the notifications page/system
        
        console.log('Notifying team of help request:', helpRequest);
        
        // For now, just log to console - could integrate with:
        // - Email service
        // - Push notification service
        // - WebSocket for real-time notifications
        // - In-app notification system
    }

    // Milestone creation functions
    showCreateMilestoneForm() {
        const form = document.getElementById('milestoneCreationForm');
        if (form) {
            form.style.display = 'block';
            form.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            document.getElementById('milestoneTitle').focus();
        }
    }

    cancelCreateMilestone() {
        const form = document.getElementById('milestoneCreationForm');
        const newMilestoneForm = document.getElementById('newMilestoneForm');
        
        if (form) {
            form.style.display = 'none';
        }
        if (newMilestoneForm) {
            newMilestoneForm.reset();
        }
    }

    async handleCreateMilestone(event) {
        event.preventDefault();
        
        try {
            // Collect form data
            const formData = {
                task_id: this.currentTask.id,
                title: document.getElementById('milestoneTitle').value,
                description: document.getElementById('milestoneDescription').value,
                prime_directive_contribution: document.getElementById('primeDirectiveContribution').value,
                okr_connection: document.getElementById('okrConnection').value,
                dod_category: document.getElementById('dodCategory').value,
                deadline: document.getElementById('milestoneDeadline').value || null,
                acceptance_criteria: document.getElementById('acceptanceCriteria').value
                    ? document.getElementById('acceptanceCriteria').value.split('\n').map(s => s.trim()).filter(s => s)
                    : [],
                completed: false,
                files: [],
                help_requests: []
            };

            // Send to backend
            const response = await fetch('http://localhost:8000/api/v1/milestones', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                const newMilestone = await response.json();
                
                // Add to local milestones array
                this.milestones.push(newMilestone);
                
                // Hide form and reset
                this.cancelCreateMilestone();
                
                // Re-render milestones section
                this.renderTaskPage();
                
                this.app.showNotification('Milestone created successfully!');
            } else {
                throw new Error('Failed to create milestone');
            }
        } catch (error) {
            console.error('Failed to create milestone:', error);
            this.app.showNotification('Failed to create milestone', 'error');
        }
    }
}

// Global task page manager instance
let taskPageManager;