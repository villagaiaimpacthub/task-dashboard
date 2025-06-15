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
            // Hide the dashboard layout immediately to prevent flash
            const mainContainer = document.querySelector('.main-container');
            if (mainContainer) {
                mainContainer.style.display = 'none';
            }
            
            // Show loading state in task container
            let taskContainer = document.getElementById('task-page-container');
            if (!taskContainer) {
                taskContainer = document.createElement('div');
                taskContainer.id = 'task-page-container';
                document.body.appendChild(taskContainer);
            }
            taskContainer.style.display = 'block';
            taskContainer.innerHTML = `
                <div style="
                    display: flex; 
                    align-items: center; 
                    justify-content: center; 
                    height: 100vh; 
                    color: #ffffff; 
                    font-size: 18px;
                    background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
                    flex-direction: column;
                    gap: 16px;
                ">
                    <div style="
                        width: 40px;
                        height: 40px;
                        border: 3px solid rgba(78, 205, 196, 0.3);
                        border-top: 3px solid #4ecdc4;
                        border-radius: 50%;
                        animation: spin 1s linear infinite;
                    "></div>
                    <div>Loading task...</div>
                </div>
                <style>
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                </style>
            `;
            
            // Enable scrolling on body when showing task page
            document.body.style.overflow = 'auto';
            
            // Load task data
            this.currentTask = await api.getTask(taskId);
            
            // Check if user has access (owner or team member)
            if (!this.hasTaskAccess(this.currentTask)) {
                this.showAccessDenied();
                return;
            }

            // Load milestones
            const loadedMilestones = await this.loadTaskMilestones(taskId);
            
            // Store milestones in both places for compatibility
            this.milestones = loadedMilestones;
            if (!this.currentTask.milestones) {
                this.currentTask.milestones = loadedMilestones;
            }

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
        // For now, make all tasks public
        return true;
        
        // Future implementation for restricted access:
        // const userId = this.app.currentUser?.id;
        // if (task.owner_id === userId) return true;
        // if (task.assignee_id === userId) return true;
        // return false;
    }

    // Load task milestones
    async loadTaskMilestones(taskId) {
        try {
            // Try to load actual milestones from the API
            if (api.getTaskMilestones) {
                const milestones = await api.getTaskMilestones(taskId);
                return milestones || [];
            }
            
            // Fallback: If task has milestones array, use it
            if (this.currentTask.milestones) {
                return this.currentTask.milestones;
            }
            
            // Legacy: Convert DoD items to milestones if no real milestones exist
            const task = this.currentTask;
            if (task.definition_of_done && task.definition_of_done.length > 0) {
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
        
        // Update page title
        document.title = `${task.title} - HIVE Task`;
        
        const taskPageHTML = `
            <div class="task-page">
                <!-- Task Header -->
                <div class="project-header">
                    <button onclick="taskPageManager.goBack()" class="back-btn">← Back</button>
                    <div class="project-title-section">
                        <h1 class="editable-field" onclick="taskPageManager.makeEditable(this, 'title')" title="Click to edit title">${task.title}</h1>
                        <div class="project-meta">
                            <span class="priority priority-${task.priority} editable-field" onclick="taskPageManager.makeEditable(this, 'priority')" title="Click to edit priority">${task.priority}</span>
                            <span class="status status-${task.status} editable-field" onclick="taskPageManager.makeEditable(this, 'status')" title="Click to edit status">${task.status}</span>
                            <span class="category editable-field" onclick="taskPageManager.makeEditable(this, 'category')" title="Click to edit category">${task.category || 'General Development'}</span>
                        </div>
                    </div>
                </div>

                <!-- Task Content -->
                <div class="project-content" style="background: transparent !important;">
                    <!-- Left Column: Milestones and Comments -->
                    <div class="project-tasks">
                        <div class="tasks-header">
                            <h3>Milestones & Definition of Done</h3>
                            <button class="create-btn" onclick="taskPageManager.showCreateMilestoneForm()">
                                + Add Milestone
                            </button>
                        </div>
                        
                        <div class="milestone-creation-form" id="milestoneCreationForm" style="display: none;">
                            <div style="background: rgba(68, 68, 68, 0.15); border-radius: 12px; padding: 24px; border: 1px solid rgba(68, 68, 68, 0.3); margin-bottom: 20px;">
                                <h4 style="margin-bottom: 20px; color: #ffffff; font-size: 18px;">Create New Milestone</h4>
                                <form id="newMilestoneForm" onsubmit="taskPageManager.handleCreateMilestone(event)">
                                    <div style="margin-bottom: 20px;">
                                        <label for="milestoneTitle" style="display: block; margin-bottom: 8px; font-weight: 600; color: #ffffff; font-size: 14px;">Milestone Title*</label>
                                        <input type="text" id="milestoneTitle" placeholder="e.g., Complete site analysis and soil testing" required 
                                               style="width: 100%; padding: 12px; border: 1px solid rgba(68, 68, 68, 0.4); border-radius: 8px; font-size: 14px; background: rgba(68, 68, 68, 0.1); color: #ffffff; transition: border-color 0.2s ease; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;"
                                               onfocus="this.style.borderColor='rgba(78, 205, 196, 0.5)'"
                                               onblur="this.style.borderColor='rgba(68, 68, 68, 0.4)'">
                                    </div>
                                    
                                    <div style="margin-bottom: 20px;">
                                        <label for="milestoneDescription" style="display: block; margin-bottom: 8px; font-weight: 600; color: #ffffff; font-size: 14px;">Description</label>
                                        <textarea id="milestoneDescription" placeholder="Detailed description of what needs to be accomplished" rows="4"
                                                  style="width: 100%; padding: 12px; border: 1px solid rgba(68, 68, 68, 0.4); border-radius: 8px; font-size: 14px; resize: vertical; background: rgba(68, 68, 68, 0.1); color: #ffffff; transition: border-color 0.2s ease; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;"
                                                  onfocus="this.style.borderColor='rgba(78, 205, 196, 0.5)'"
                                                  onblur="this.style.borderColor='rgba(68, 68, 68, 0.4)'"></textarea>
                                    </div>
                                    
                                    <div style="margin-bottom: 24px;">
                                        <label for="milestoneDeadline" style="display: block; margin-bottom: 8px; font-weight: 600; color: #ffffff; font-size: 14px;">📅 Target Completion Date</label>
                                        <input type="date" id="milestoneDeadline"
                                               style="width: 100%; padding: 12px; border: 1px solid rgba(68, 68, 68, 0.4); border-radius: 8px; font-size: 14px; background: rgba(68, 68, 68, 0.1); color: #ffffff; transition: border-color 0.2s ease; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; color-scheme: dark;"
                                               onfocus="this.style.borderColor='rgba(78, 205, 196, 0.5)'"
                                               onblur="this.style.borderColor='rgba(68, 68, 68, 0.4)'">
                                    </div>
                                    
                                    <div style="display: flex; gap: 12px; justify-content: flex-end;">
                                        <button type="button" onclick="taskPageManager.cancelCreateMilestone()" 
                                                style="padding: 10px 20px; border: 1px solid rgba(68, 68, 68, 0.4); background: rgba(68, 68, 68, 0.1); color: #ffffff; border-radius: 8px; cursor: pointer; font-weight: 500; transition: all 0.2s;"
                                                onmouseover="this.style.background='rgba(68, 68, 68, 0.2)'"
                                                onmouseout="this.style.background='rgba(68, 68, 68, 0.1)'">
                                            Cancel
                                        </button>
                                        <button type="submit" class="create-btn" style="padding: 10px 20px;">Create Milestone</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                        
                        <div class="milestones-list" style="margin-bottom: 24px;">
                            ${this.renderMilestones()}
                        </div>

                        <div class="project-skills">
                            <h3>Public Comments</h3>
                            <div class="comments-container" id="publicComments">
                                <div class="comments-list" id="commentsList">
                                    <!-- Comments will be loaded here -->
                                </div>
                                <div class="comment-input-container">
                                    <div class="comment-input-wrapper">
                                        <textarea id="commentInput" placeholder="Share your thoughts, feedback, or suggestions..." 
                                                  rows="3" onkeydown="taskPageManager.handleCommentKeyPress(event)"
                                                  style="width: 100%; padding: 10px; border: 1px solid rgba(76, 175, 80, 0.2); border-radius: 8px; font-size: 14px; resize: vertical;"></textarea>
                                        <button class="create-btn" onclick="taskPageManager.submitComment()" style="margin-top: 8px;">
                                            💬 Comment
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Right Column: Task Info and Communication -->
                    <div class="project-overview" style="background: transparent !important;">
                        <div class="project-description" style="margin-bottom: 24px;">
                            <h3 style="margin-bottom: 16px;">Description</h3>
                            <p class="editable-field" onclick="taskPageManager.makeEditable(this, 'description')" title="Click to edit description" style="line-height: 1.6; color: #666;">${task.description || 'No description provided'}</p>
                        </div>

                        <div class="project-details" style="margin-bottom: 24px;">
                            <h3 style="margin-bottom: 16px;">Task Details</h3>
                            <div class="details-grid" style="gap: 16px;">
                                ${this.renderTaskMetadata()}
                            </div>
                        </div>

                        <div class="project-skills" style="margin-bottom: 24px;">
                            <h3 style="margin-bottom: 16px;">Required Skills</h3>
                            <div class="skills-container" style="gap: 8px;">
                                ${this.renderRequiredSkills()}
                            </div>
                        </div>

                        <div class="project-skills" style="background: transparent !important;">
                            <div class="tasks-header">
                                <h3>Task Files</h3>
                                <button class="create-btn" onclick="taskPageManager.showFileUpload()">
                                    📎 Upload File
                                </button>
                            </div>
                            
                            <div class="file-upload-form" id="fileUploadForm" style="display: none; background: transparent !important;">
                                <div style="background: rgba(68, 68, 68, 0.15) !important; border-radius: 12px; padding: 20px; border: 1px solid rgba(68, 68, 68, 0.3); margin-bottom: 16px;">
                                    <div class="upload-area" onclick="document.getElementById('fileInput').click()" 
                                         style="border: 2px dashed rgba(78, 205, 196, 0.4); border-radius: 12px; padding: 40px; text-align: center; cursor: pointer; transition: all 0.3s ease; background: rgba(68, 68, 68, 0.1);"
                                         onmouseover="this.style.borderColor='rgba(78, 205, 196, 0.6)'; this.style.background='rgba(78, 205, 196, 0.1)'" 
                                         onmouseout="this.style.borderColor='rgba(78, 205, 196, 0.4)'; this.style.background='rgba(68, 68, 68, 0.1)'">
                                        <input type="file" id="fileInput" style="display: none;" onchange="taskPageManager.handleFileSelect(event)" multiple>
                                        <div class="upload-text">
                                            <i class="upload-icon" style="font-size: 48px; display: block; margin-bottom: 16px; color: #4ecdc4;">📁</i>
                                            <p style="margin: 0 0 8px 0; font-weight: 600; color: #ffffff;">Click to select files or drag and drop</p>
                                            <small style="color: #d0d0d0;">Maximum file size: 10MB</small>
                                        </div>
                                    </div>
                                    <div class="upload-actions" style="display: flex; gap: 12px; justify-content: flex-end; margin-top: 16px;">
                                        <button type="button" onclick="taskPageManager.cancelFileUpload()" 
                                                style="padding: 10px 20px; border: 1px solid rgba(68, 68, 68, 0.4); background: rgba(68, 68, 68, 0.1); color: #ffffff; border-radius: 8px; cursor: pointer; font-weight: 500; transition: all 0.2s;"
                                                onmouseover="this.style.background='rgba(68, 68, 68, 0.2)'"
                                                onmouseout="this.style.background='rgba(68, 68, 68, 0.1)'">
                                            Cancel
                                        </button>
                                        <button type="button" onclick="taskPageManager.uploadSelectedFiles()" class="create-btn" style="padding: 10px 20px;">
                                            Upload Files
                                        </button>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="files-list" id="taskFilesList">
                                ${this.renderTaskFiles()}
                            </div>
                        </div>

                        <div class="project-description">
                            <h3>Team Chat</h3>
                            <div class="chat-container" id="taskChat" style="background: rgba(76, 175, 80, 0.05); border-radius: 8px; padding: 16px;">
                                <div class="chat-messages" id="chatMessages" style="max-height: 300px; overflow-y: auto; margin-bottom: 16px;">
                                    <!-- Chat messages will be loaded here -->
                                </div>
                                <div class="chat-input-container">
                                    <div class="chat-input-wrapper" style="display: flex; gap: 8px;">
                                        <input type="text" id="chatInput" placeholder="Type your message..." 
                                               onkeypress="taskPageManager.handleChatKeyPress(event)"
                                               style="flex: 1; padding: 10px; border: 1px solid rgba(76, 175, 80, 0.2); border-radius: 8px;">
                                        <button class="create-btn" onclick="taskPageManager.sendChatMessage()">
                                            📤 Send
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Get the existing task container and update it with the full content
        const taskContainer = document.getElementById('task-page-container');
        taskContainer.innerHTML = taskPageHTML;

        // Setup event listeners
        this.setupTaskPageEventListeners();
    }

    // Render task metadata
    renderTaskMetadata() {
        const task = this.currentTask;
        
        // Format dates
        const formatDate = (dateStr) => {
            if (!dateStr) return 'TBD';
            const date = new Date(dateStr);
            return date.toLocaleDateString();
        };

        return `
            <div class="detail-item">
                <strong>📅 Created:</strong> ${formatDate(task.created_at)}
            </div>
            <div class="detail-item">
                <strong>⏰ Due Date:</strong> ${formatDate(task.due_date)}
            </div>
            <div class="detail-item">
                <strong>👑 Owner:</strong> ${task.owner_id || 'Unassigned'}
            </div>
            <div class="detail-item">
                <strong>👤 Assignee:</strong> ${task.assignee_id || 'Available'}
                ${this.renderTaskActions(task)}
            </div>
            <div class="detail-item">
                <strong>👥 Team Size:</strong> ${task.team_size || '1'} members
            </div>
            <div class="detail-item">
                <strong>🌍 Location:</strong> ${task.location || 'Global'}
            </div>
            <div class="detail-item">
                <strong>⏱️ Estimated Hours:</strong> ${task.estimated_hours || '2-4 hours'}
            </div>
            <div class="detail-item">
                <strong>💰 Budget:</strong> ${task.budget ? `$${task.budget.toLocaleString()}` : 'TBD'}
            </div>
            <div class="detail-item">
                <strong>⭐ Impact Points:</strong> +${task.impact_points || 100}
            </div>
            <div class="detail-item">
                <strong>🏛️ Authority:</strong> ${task.authority_level || 'Standard'}
            </div>
        `;
    }

    // Render task actions (claim/assign buttons)
    renderTaskActions(task) {
        const currentUserId = this.app?.currentUser?.id;
        const isOwner = task.owner_id === currentUserId;
        const isAssigned = task.assignee_id && task.assignee_id !== 'Available';
        const isCurrentUserAssigned = task.assignee_id === currentUserId;
        
        console.log('renderTaskActions - task.assignee_id:', task.assignee_id);
        console.log('renderTaskActions - isAssigned:', isAssigned);
        console.log('renderTaskActions - currentUserId:', currentUserId);
        
        let actions = '';
        
        // Show claim button for unassigned tasks (regardless of exact status)
        if (!isAssigned) {
            actions += `
                <div style="margin-top: 8px;">
                    <button onclick="taskPageManager.claimTask()" class="claim-btn" style="
                        background: #4caf50;
                        color: white;
                        border: none;
                        padding: 10px 20px;
                        border-radius: 12px;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.2s;
                        margin-left: 0;
                    ">
                        🙋‍♂️ Claim Task
                    </button>
                </div>
            `;
        }
        
        if (isOwner && task.status !== 'completed') {
            // Owner can assign/reassign or make available
            if (isAssigned) {
                actions += `
                    <div style="margin-top: 8px;">
                        <button onclick="taskPageManager.makeTaskAvailable()" class="btn-warning make-available-btn">
                            🔄 Make Available
                        </button>
                        <button onclick="taskPageManager.showAssignModal()" class="btn-primary assign-btn" style="margin-left: 8px;">
                            👥 Reassign
                        </button>
                    </div>
                `;
            } else {
                actions += `
                    <div style="margin-top: 8px;">
                        <button onclick="taskPageManager.showAssignModal()" class="btn-primary assign-btn">
                            👥 Assign to Team Member
                        </button>
                    </div>
                `;
            }
        }
        
        if (isCurrentUserAssigned && task.status === 'in_progress') {
            // Current user is assigned - show status update options
            actions += `
                <div style="margin-top: 8px;">
                    <button onclick="taskPageManager.markTaskCompleted()" class="btn-success complete-btn">
                        ✅ Mark Complete
                    </button>
                </div>
            `;
        }
        
        return actions;
    }

    // Render required skills
    renderRequiredSkills() {
        const task = this.currentTask;
        if (!task.required_skills || task.required_skills.length === 0) {
            return '<div class="no-tasks">No specific skills required</div>';
        }
        return task.required_skills.map(skill => 
            `<div class="skill-tag">${skill}</div>`
        ).join('');
    }

    // Render milestones list
    renderMilestones() {
        if (!this.currentTask?.milestones || !this.currentTask.milestones.length) {
            return '<p class="no-milestones">No milestones defined yet.</p>';
        }

        return this.currentTask.milestones.map(milestone => `
            <div class="milestone-item ${milestone.is_completed ? 'completed' : ''}" data-milestone-id="${milestone.id}" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;">
                <div class="milestone-header">
                    <div class="milestone-checkbox">
                        <input type="checkbox" ${milestone.is_completed ? 'checked' : ''} 
                               onchange="taskPageManager.toggleMilestone('${milestone.id}')">
                    </div>
                    <div class="milestone-title" style="font-family: inherit; font-weight: 600; color: #ffffff;">${milestone.title}</div>
                    <div class="milestone-deadline" style="font-family: inherit; color: #d0d0d0;">
                        ${milestone.due_date ? `📅 Due: ${milestone.due_date}` : ''}
                    </div>
                    <button class="btn-danger btn-small milestone-delete-btn" onclick="taskPageManager.deleteMilestone('${milestone.id}')">
                        🗑️ Delete
                    </button>
                </div>
                
                ${milestone.description ? `
                    <div class="milestone-description">
                        <p style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; line-height: 1.6; color: #d0d0d0; margin: 0;">${milestone.description}</p>
                    </div>
                ` : ''}
                
                <div class="milestone-status">
                    <span class="milestone-status-badge status-${milestone.status}">
                        ${milestone.status.charAt(0).toUpperCase() + milestone.status.slice(1)}
                    </span>
                    ${milestone.completed_at ? `
                        <span class="completion-time">
                            Completed: ${new Date(milestone.completed_at).toLocaleDateString()}
                        </span>
                    ` : ''}
                </div>
            </div>
        `).join('');
    }


    // Handle create milestone form submission
    async handleCreateMilestone(event) {
        event.preventDefault();
        
        const title = document.getElementById('milestoneTitle').value.trim();
        const description = document.getElementById('milestoneDescription').value.trim();
        const dueDate = document.getElementById('milestoneDeadline').value;
        
        if (!title) {
            this.showError('Milestone title is required');
            return;
        }

        try {
            const milestoneData = {
                title: title,
                description: description || null,
                due_date: dueDate || null,
                task_id: this.currentTask.id
            };

            const response = await api.createMilestone(milestoneData);
            
            if (response && response.id) {
                console.log('Created milestone:', response);
                
                // Check for duplicate IDs before adding
                const existingMilestone = this.currentTask.milestones?.find(m => m.id === response.id);
                if (existingMilestone) {
                    console.warn('Duplicate milestone ID detected:', response.id);
                    return;
                }
                
                // Add the new milestone to the current task
                if (!this.currentTask.milestones) {
                    this.currentTask.milestones = [];
                }
                this.currentTask.milestones.push(response);
                
                // Also update the local milestones array
                if (!this.milestones) {
                    this.milestones = [];
                }
                
                // Check for duplicate in milestones array too
                const existingInMilestones = this.milestones.find(m => m.id === response.id);
                if (!existingInMilestones) {
                    this.milestones.push(response);
                }
                
                console.log('Total milestones after creation:', this.currentTask.milestones.length);
                
                // Refresh the milestones display
                this.refreshMilestonesDisplay();
                
                // Hide and reset the form
                this.cancelCreateMilestone();
                
                this.showSuccess('Milestone created successfully!');
            } else {
                this.showError('Failed to create milestone');
            }
        } catch (error) {
            console.error('Error creating milestone:', error);
            console.error('Milestone data:', milestoneData);
            this.showError('Error creating milestone: ' + (error.message || 'Unknown error'));
        }
    }

    // Toggle milestone completion
    async toggleMilestone(milestoneId) {
        try {
            const milestone = this.currentTask.milestones.find(m => m.id === milestoneId);
            if (!milestone) return;

            const response = await api.updateMilestone(milestoneId, {
                ...milestone,
                is_completed: !milestone.is_completed
            });

            if (response.id) {
                // Update the milestone in our data
                const index = this.currentTask.milestones.findIndex(m => m.id === milestoneId);
                if (index !== -1) {
                    this.currentTask.milestones[index] = response;
                }
                
                // Refresh the display
                this.refreshMilestonesDisplay();
                
                this.showSuccess(`Milestone ${response.is_completed ? 'completed' : 'reopened'}!`);
            }
        } catch (error) {
            console.error('Error toggling milestone:', error);
            this.showError('Error updating milestone');
        }
    }

    // Delete milestone
    async deleteMilestone(milestoneId) {
        console.log('deleteMilestone called with ID:', milestoneId);
        console.log('Current milestones:', this.currentTask.milestones?.map(m => ({ id: m.id, title: m.title })));
        
        if (!confirm('Are you sure you want to delete this milestone?')) {
            return;
        }

        try {
            console.log('Calling API to delete milestone:', milestoneId);
            await api.deleteMilestone(milestoneId);
            
            const beforeCount = this.currentTask.milestones?.length || 0;
            
            // Remove from our data
            this.currentTask.milestones = this.currentTask.milestones.filter(m => m.id !== milestoneId);
            
            // Also remove from the local milestones array
            if (this.milestones) {
                this.milestones = this.milestones.filter(m => m.id !== milestoneId);
            }
            
            const afterCount = this.currentTask.milestones?.length || 0;
            console.log(`Milestones before deletion: ${beforeCount}, after: ${afterCount}`);
            
            // Refresh the display
            this.refreshMilestonesDisplay();
            
            this.showSuccess('Milestone deleted successfully!');
        } catch (error) {
            console.error('Error deleting milestone:', error);
            
            // Check if it's an authentication error
            if (error.message && (error.message.includes('401') || error.message.includes('unauthorized'))) {
                console.warn('Authentication error during milestone deletion - preventing redirect');
                this.showError('Authentication error - please refresh and try again');
                return;
            }
            
            this.showError('Error deleting milestone: ' + (error.message || 'Unknown error'));
        }
    }

    // Refresh milestones display
    refreshMilestonesDisplay() {
        console.log('refreshMilestonesDisplay called');
        console.log('Milestones to render:', this.currentTask.milestones?.map(m => ({ id: m.id, title: m.title })));
        
        const milestonesList = document.querySelector('.milestones-list');
        if (milestonesList) {
            milestonesList.innerHTML = this.renderMilestones();
            console.log('Milestones display refreshed');
        } else {
            console.log('milestones-list element not found');
        }
    }

    // Inline editing functionality
    makeEditable(element, fieldName) {
        if (!this.canEdit()) {
            this.showError('You do not have permission to edit this task');
            return;
        }

        // Prevent multiple edits
        if (element.classList.contains('editing')) {
            return;
        }

        const currentValue = element.textContent.trim();
        element.classList.add('editing');

        // Create edit interface based on field type
        if (fieldName === 'description') {
            this.createTextareaEditor(element, fieldName, currentValue);
        } else if (fieldName === 'status') {
            this.createSelectEditor(element, fieldName, currentValue, [
                'draft', 'available', 'in_progress', 'completed'
            ]);
        } else if (fieldName === 'priority') {
            this.createSelectEditor(element, fieldName, currentValue, [
                'urgent', 'high', 'medium', 'low'
            ]);
        } else {
            this.createTextEditor(element, fieldName, currentValue);
        }
    }

    // Check if user can edit this task
    canEdit() {
        // For now, assume user can edit if they're the owner or assignee
        // This could be enhanced with more complex permission logic
        return true; // TODO: Implement proper permission checking
    }

    // Create text input editor
    createTextEditor(element, fieldName, currentValue) {
        const input = document.createElement('input');
        input.type = 'text';
        input.value = currentValue === 'No category' ? '' : currentValue;
        input.className = 'inline-editor-input';
        input.style.width = '100%';
        input.style.background = 'rgba(76, 175, 80, 0.1)';
        input.style.border = 'none';
        input.style.padding = '4px 8px';
        input.style.font = 'inherit';
        
        this.setupSimpleEditor(element, input, fieldName, currentValue);
    }

    // Create textarea editor
    createTextareaEditor(element, fieldName, currentValue) {
        const textarea = document.createElement('textarea');
        textarea.value = currentValue === 'No description provided' ? '' : currentValue;
        textarea.className = 'inline-editor-textarea';
        textarea.rows = 4;
        textarea.style.width = '100%';
        textarea.style.background = 'rgba(76, 175, 80, 0.1)';
        textarea.style.border = 'none';
        textarea.style.padding = '8px';
        textarea.style.font = 'inherit';
        textarea.style.resize = 'vertical';
        
        this.setupSimpleEditor(element, textarea, fieldName, currentValue);
    }

    // Create select dropdown editor
    createSelectEditor(element, fieldName, currentValue, options) {
        const select = document.createElement('select');
        select.className = 'inline-editor-select';
        select.style.width = '100%';
        select.style.background = 'rgba(76, 175, 80, 0.1)';
        select.style.border = 'none';
        select.style.padding = '4px 8px';
        select.style.font = 'inherit';
        
        options.forEach(option => {
            const optionEl = document.createElement('option');
            optionEl.value = option;
            optionEl.textContent = option;
            if (option === currentValue) {
                optionEl.selected = true;
            }
            select.appendChild(optionEl);
        });
        
        this.setupSimpleEditor(element, select, fieldName, currentValue);
    }

    // Setup simple editor with click outside to save
    setupSimpleEditor(element, editor, fieldName, originalValue) {
        // Store original padding
        const originalPadding = window.getComputedStyle(element).padding;
        
        // Replace element content
        element.innerHTML = '';
        element.appendChild(editor);
        element.style.padding = '0';
        
        // Focus and select
        editor.focus();
        if (editor.select) {
            editor.select();
        }
        
        // Save function
        const saveChanges = async () => {
            const newValue = editor.value.trim();
            
            // No change, just restore
            if (newValue === originalValue || (newValue === '' && originalValue.startsWith('No '))) {
                this.cancelEdit(element, originalValue);
                element.style.padding = originalPadding;
                return;
            }
            
            await this.saveEdit(element, editor, fieldName, originalValue);
            element.style.padding = originalPadding;
        };
        
        // Handle Enter/Escape keys
        editor.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                // For textareas, allow Shift+Enter for new lines
                if (editor.tagName === 'TEXTAREA' && e.shiftKey) {
                    return; // Allow the new line
                }
                e.preventDefault();
                saveChanges();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                this.cancelEdit(element, originalValue);
                element.style.padding = originalPadding;
            }
        });
        
        // Handle click outside
        const handleClickOutside = (e) => {
            if (!element.contains(e.target)) {
                saveChanges();
                document.removeEventListener('click', handleClickOutside);
            }
        };
        
        // Add click outside listener after a small delay to prevent immediate trigger
        setTimeout(() => {
            document.addEventListener('click', handleClickOutside);
        }, 100);
        
        // Handle blur for select elements
        if (editor.tagName === 'SELECT') {
            editor.addEventListener('change', saveChanges);
        }
    }

    // Save the edited value
    async saveEdit(element, editor, fieldName, originalValue) {
        const newValue = editor.value.trim();
        
        // No change, just cancel
        if (newValue === originalValue || (newValue === '' && originalValue.startsWith('No '))) {
            this.cancelEdit(element, originalValue);
            return;
        }

        try {
            // Update task via API
            const updateData = {};
            updateData[fieldName] = newValue || null;
            
            const response = await api.put(`/tasks/${this.currentTask.id}`, updateData);
            
            if (response.id) {
                // Update local task data
                this.currentTask[fieldName] = newValue;
                
                // Update display
                element.classList.remove('editing');
                element.innerHTML = newValue || `No ${fieldName}`;
                
                // Update any related UI classes
                if (fieldName === 'status') {
                    element.className = element.className.replace(/status-\w+/, `status-${newValue}`);
                } else if (fieldName === 'priority') {
                    element.className = element.className.replace(/priority-\w+/, `priority-${newValue}`);
                }
                
                // Show subtle success feedback
                element.style.transition = 'background-color 0.3s ease';
                element.style.backgroundColor = 'rgba(76, 175, 80, 0.2)';
                setTimeout(() => {
                    element.style.backgroundColor = '';
                }, 500);
            }
        } catch (error) {
            console.error('Error updating task:', error);
            this.showError('Failed to update task');
            this.cancelEdit(element, originalValue);
        }
    }

    // Cancel editing
    cancelEdit(element, originalValue) {
        element.classList.remove('editing');
        element.innerHTML = originalValue;
    }

    // Show success message
    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    // Show error message
    showError(message) {
        this.showNotification(message, 'error');
    }

    // Show notification helper
    showNotification(message, type) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Style the notification
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 4px;
            color: white;
            font-weight: 500;
            z-index: 1000;
            opacity: 0;
            transition: opacity 0.3s ease;
            ${type === 'success' ? 'background-color: #28a745;' : 
              type === 'error' ? 'background-color: #dc3545;' : 
              'background-color: #007bff;'}
        `;
        
        document.body.appendChild(notification);
        
        // Fade in
        setTimeout(() => {
            notification.style.opacity = '1';
        }, 10);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    // File management functionality
    selectedFiles = [];

    renderTaskFiles() {
        if (!this.currentTask?.files || !this.currentTask.files.length) {
            return '<div class="no-tasks" style="text-align: center; padding: 40px; color: #d0d0d0;">No files uploaded yet.</div>';
        }

        return this.currentTask.files.map(file => `
            <div class="file-item" data-file-id="${file.id}" 
                 style="background: rgba(68, 68, 68, 0.15); border-radius: 12px; padding: 16px; margin-bottom: 12px; border: 1px solid rgba(78, 205, 196, 0.2); transition: all 0.2s ease;"
                 onmouseover="this.style.borderColor='rgba(78, 205, 196, 0.4)'; this.style.transform='translateY(-1px)'"
                 onmouseout="this.style.borderColor='rgba(78, 205, 196, 0.2)'; this.style.transform='translateY(0)'">
                <div class="file-info" style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                    <div class="file-icon" style="font-size: 24px; min-width: 32px; text-align: center; color: #4ecdc4;">${this.getFileIcon(file.name)}</div>
                    <div class="file-details" style="flex: 1; min-width: 0;">
                        <div class="file-name" style="font-weight: 600; color: #ffffff; margin-bottom: 4px; word-break: break-word;">${file.name}</div>
                        <div class="file-meta" style="font-size: 12px; color: #d0d0d0; display: flex; gap: 12px;">
                            <span class="file-size">${this.formatFileSize(file.size)}</span>
                            <span class="file-date">Uploaded ${new Date(file.uploaded_at).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>
                <div class="file-actions" style="display: flex; gap: 8px; flex-wrap: wrap;">
                    ${this.canPreviewFile(file.name) ? `
                        <button onclick="taskPageManager.previewFile('${file.id}', '${file.name}')" class="btn-primary btn-small">
                            👁️ Preview
                        </button>
                    ` : ''}
                    <button onclick="taskPageManager.downloadFile('${file.id}')" class="btn-primary btn-small">
                        📥 Download
                    </button>
                    <button onclick="taskPageManager.deleteFile('${file.id}')" class="btn-danger btn-small">
                        🗑️ Delete
                    </button>
                </div>
            </div>
        `).join('');
    }

    canPreviewFile(filename) {
        const ext = filename.split('.').pop().toLowerCase();
        const previewableTypes = ['pdf', 'txt', 'md', 'html', 'jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'js', 'css', 'json', 'xml', 'csv', 'log'];
        return previewableTypes.includes(ext);
    }

    async previewFile(fileId, filename) {
        try {
            const response = await fetch(`http://localhost:8000/api/v1/files/${fileId}/download`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const ext = filename.split('.').pop().toLowerCase();
                
                // Create modern preview modal with scrolling
                const modal = document.createElement('div');
                modal.style.cssText = `
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.95);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 1000;
                    backdrop-filter: blur(4px);
                    padding: 20px;
                    box-sizing: border-box;
                    overflow: auto;
                `;
                
                // Create content container with modern styling
                const container = document.createElement('div');
                container.style.cssText = `
                    position: relative;
                    width: 100%;
                    max-width: 1200px;
                    max-height: 90vh;
                    background: rgba(40, 44, 52, 0.98);
                    border-radius: 16px;
                    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                    border: 1px solid rgba(78, 205, 196, 0.2);
                `;
                
                // Create header
                const header = document.createElement('div');
                header.style.cssText = `
                    background: linear-gradient(135deg, #4ecdc4 0%, #00b8a9 100%);
                    color: white;
                    padding: 16px 24px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    flex-shrink: 0;
                `;
                
                header.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <span style="font-size: 24px;">${this.getFileIcon(filename)}</span>
                        <div>
                            <div style="font-weight: 600; font-size: 16px;">${filename}</div>
                            <div style="font-size: 12px; opacity: 0.9;">${this.formatFileSize(blob.size)}</div>
                        </div>
                    </div>
                    <div style="display: flex; gap: 8px; align-items: center;">
                        <button onclick="taskPageManager.downloadFile('${fileId}')" class="btn-neutral btn-medium">
                            📥 Download
                        </button>
                        <button onclick="this.closest('.preview-modal').remove(); window.URL.revokeObjectURL('${url}')" class="btn-close">
                            ✕
                        </button>
                    </div>
                `;
                
                // Create scrollable content area
                const contentArea = document.createElement('div');
                contentArea.style.cssText = `
                    flex: 1;
                    overflow: auto;
                    background: #1a1f1c;
                    position: relative;
                `;
                
                // Generate content based on file type
                await this.generateFilePreviewContent(contentArea, blob, url, ext, filename, fileId);
                
                container.appendChild(header);
                container.appendChild(contentArea);
                modal.appendChild(container);
                
                modal.className = 'preview-modal';
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        modal.remove();
                        window.URL.revokeObjectURL(url);
                    }
                });
                
                document.body.appendChild(modal);
                
                // Add ESC key handler
                const handleEscape = (e) => {
                    if (e.key === 'Escape') {
                        modal.remove();
                        window.URL.revokeObjectURL(url);
                        document.removeEventListener('keydown', handleEscape);
                    }
                };
                document.addEventListener('keydown', handleEscape);
                
            } else {
                this.showError('Failed to load file preview');
            }
        } catch (error) {
            console.error('Error previewing file:', error);
            this.showError('Error previewing file');
        }
    }

    async generateFilePreviewContent(contentArea, blob, url, ext, filename, fileId) {
        if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext)) {
            // Enhanced Image Viewer
            contentArea.style.cssText += `
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 500px;
                padding: 20px;
                background: #1a1f1c;
            `;
            
            const imageContainer = document.createElement('div');
            imageContainer.style.cssText = `
                max-width: 100%;
                max-height: 100%;
                text-align: center;
                position: relative;
            `;
            
            const img = document.createElement('img');
            img.src = url;
            img.style.cssText = `
                max-width: 100%;
                max-height: 70vh;
                object-fit: contain;
                border-radius: 8px;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
                transition: transform 0.3s ease;
                cursor: zoom-in;
            `;
            
            // Add zoom functionality
            let isZoomed = false;
            img.addEventListener('click', () => {
                if (!isZoomed) {
                    img.style.transform = 'scale(2)';
                    img.style.cursor = 'zoom-out';
                    contentArea.style.overflow = 'auto';
                    isZoomed = true;
                } else {
                    img.style.transform = 'scale(1)';
                    img.style.cursor = 'zoom-in';
                    isZoomed = false;
                }
            });
            
            imageContainer.appendChild(img);
            contentArea.appendChild(imageContainer);
            
        } else if (ext === 'pdf') {
            // Enhanced PDF Viewer
            contentArea.style.cssText += `
                padding: 0;
                background: #1a1f1c;
            `;
            
            const iframe = document.createElement('iframe');
            iframe.src = url;
            iframe.style.cssText = `
                width: 100%;
                height: 80vh;
                border: none;
                background: white;
            `;
            
            contentArea.appendChild(iframe);
            
        } else if (ext === 'html') {
            // Full HTML Viewer with clickable functionality
            const text = await blob.text();
            
            const htmlContainer = document.createElement('div');
            htmlContainer.style.cssText = `
                height: 80vh;
                border: none;
                background: #1a1f1c;
                position: relative;
            `;
            
            const iframe = document.createElement('iframe');
            iframe.style.cssText = `
                width: 100%;
                height: 100%;
                border: none;
            `;
            
            // Create a blob URL for the HTML content to make it fully functional
            const htmlBlob = new Blob([text], { type: 'text/html' });
            const htmlUrl = window.URL.createObjectURL(htmlBlob);
            iframe.src = htmlUrl;
            
            htmlContainer.appendChild(iframe);
            contentArea.appendChild(htmlContainer);
            
        } else if (['txt', 'md', 'js', 'css', 'json', 'xml', 'csv', 'log'].includes(ext)) {
            // Enhanced Text Viewer with syntax highlighting
            const text = await blob.text();
            
            contentArea.style.cssText += `
                padding: 24px;
                background: #1a1f1c;
            `;
            
            let processedContent = '';
            
            if (ext === 'md') {
                // Enhanced markdown rendering
                processedContent = text
                    .replace(/^# (.*$)/gim, '<h1 style="color: #ffffff; margin: 24px 0 16px 0; font-size: 28px; border-bottom: 2px solid rgba(78, 205, 196, 0.3); padding-bottom: 8px;">$1</h1>')
                    .replace(/^## (.*$)/gim, '<h2 style="color: #ffffff; margin: 20px 0 12px 0; font-size: 24px;">$1</h2>')
                    .replace(/^### (.*$)/gim, '<h3 style="color: #ffffff; margin: 16px 0 8px 0; font-size: 20px;">$1</h3>')
                    .replace(/\*\*(.*?)\*\*/gim, '<strong style="color: #ffffff;">$1</strong>')
                    .replace(/\*(.*?)\*/gim, '<em>$1</em>')
                    .replace(/`([^`]+)`/gim, '<code style="background: rgba(78, 205, 196, 0.15); color: #ffffff; padding: 2px 6px; border-radius: 4px; font-family: monospace;">$1</code>')
                    .replace(/```([\\s\\S]*?)```/gim, '<pre style="background: rgba(78, 205, 196, 0.1); color: #ffffff; padding: 16px; border-radius: 8px; border-left: 4px solid #4ecdc4; overflow-x: auto; font-family: monospace; margin: 16px 0;"><code>$1</code></pre>')
                    .replace(/^- (.*$)/gim, '<li style="margin: 4px 0; color: #e0e0e0;">$1</li>')
                    .replace(/\\n/gim, '<br>');
                
                contentArea.innerHTML = `<div style="line-height: 1.8; color: #e0e0e0; max-width: none;">${processedContent}</div>`;
                
            } else if (ext === 'json') {
                // Pretty print JSON
                try {
                    const jsonObj = JSON.parse(text);
                    const prettyJson = JSON.stringify(jsonObj, null, 2);
                    contentArea.innerHTML = `
                        <pre style="
                            background: rgba(76, 175, 80, 0.05); 
                            color: #2c3e34; 
                            padding: 24px; 
                            border-radius: 8px; 
                            border: 1px solid rgba(76, 175, 80, 0.2);
                            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace; 
                            font-size: 14px; 
                            line-height: 1.6; 
                            margin: 0;
                            white-space: pre-wrap;
                            overflow-wrap: break-word;
                        "><code>${prettyJson}</code></pre>
                    `;
                } catch (e) {
                    contentArea.innerHTML = `
                        <pre style="
                            background: rgba(76, 175, 80, 0.05); 
                            color: #2c3e34; 
                            padding: 24px; 
                            border-radius: 8px; 
                            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace; 
                            font-size: 14px; 
                            line-height: 1.6; 
                            margin: 0;
                            white-space: pre-wrap;
                            overflow-wrap: break-word;
                        "><code>${text}</code></pre>
                    `;
                }
            } else {
                // Regular text files with enhanced styling
                contentArea.innerHTML = `
                    <pre style="
                        background: rgba(76, 175, 80, 0.05); 
                        color: #2c3e34; 
                        padding: 24px; 
                        border-radius: 8px; 
                        border: 1px solid rgba(76, 175, 80, 0.2);
                        font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace; 
                        font-size: 14px; 
                        line-height: 1.6; 
                        margin: 0;
                        white-space: pre-wrap;
                        overflow-wrap: break-word;
                    "><code>${text}</code></pre>
                `;
            }
            
        } else {
            // Unsupported file type with download option
            contentArea.style.cssText += `
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 400px;
                background: rgba(78, 205, 196, 0.02);
            `;
            
            contentArea.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #d0d0d0;">
                    <div style="font-size: 64px; margin-bottom: 24px; color: #4ecdc4;">${this.getFileIcon(filename)}</div>
                    <h3 style="color: #ffffff; margin-bottom: 12px;">Preview not available</h3>
                    <p style="margin: 0 0 24px 0; font-size: 16px; color: #d0d0d0;">This file type (${ext.toUpperCase()}) cannot be previewed</p>
                    <button onclick="taskPageManager.downloadFile('${fileId}')" class="create-btn" style="padding: 12px 24px; font-size: 16px;">
                        📥 Download File
                    </button>
                </div>
            `;
        }
    }

    getFileIcon(filename) {
        const ext = filename.split('.').pop().toLowerCase();
        const icons = {
            'pdf': '📄',
            'doc': '📝', 'docx': '📝',
            'xls': '📊', 'xlsx': '📊',
            'ppt': '📊', 'pptx': '📊',
            'txt': '📃',
            'md': '📃',
            'html': '🌐',
            'jpg': '🖼️', 'jpeg': '🖼️', 'png': '🖼️', 'gif': '🖼️', 'svg': '🖼️',
            'zip': '📦', 'rar': '📦',
            'mp4': '🎥', 'avi': '🎥',
            'mp3': '🎵', 'wav': '🎵'
        };
        return icons[ext] || '📄';
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    showFileUpload() {
        const form = document.getElementById('fileUploadForm');
        if (form) {
            form.style.display = 'block';
        }
    }

    cancelFileUpload() {
        const form = document.getElementById('fileUploadForm');
        if (form) {
            form.style.display = 'none';
        }
        this.selectedFiles = [];
        document.getElementById('fileInput').value = '';
    }

    handleFileSelect(event) {
        this.selectedFiles = Array.from(event.target.files);
        const uploadArea = document.querySelector('.upload-area .upload-text p');
        
        if (this.selectedFiles.length > 0) {
            uploadArea.textContent = `${this.selectedFiles.length} file(s) selected`;
        } else {
            uploadArea.textContent = 'Click to select files or drag and drop';
        }
    }

    async uploadSelectedFiles() {
        if (this.selectedFiles.length === 0) {
            this.showError('Please select files to upload');
            return;
        }

        try {
            const formData = new FormData();
            formData.append('task_id', this.currentTask.id);
            
            this.selectedFiles.forEach((file, index) => {
                formData.append('files', file);
            });

            // Show upload progress
            this.showNotification('Uploading files...', 'info');

            const response = await fetch('http://localhost:8000/api/v1/files/upload', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                body: formData
            });

            const result = await response.json();

            if (response.ok) {
                // Add uploaded files to task
                if (!this.currentTask.files) {
                    this.currentTask.files = [];
                }
                
                result.files.forEach(file => {
                    this.currentTask.files.push(file);
                });

                // Refresh files display
                this.refreshFilesDisplay();
                
                // Hide upload form and reset
                this.cancelFileUpload();
                
                this.showSuccess(`${result.files.length} file(s) uploaded successfully!`);
            } else {
                this.showError(result.message || 'Failed to upload files');
            }
        } catch (error) {
            console.error('Error uploading files:', error);
            this.showError('Error uploading files');
        }
    }

    async downloadFile(fileId) {
        try {
            const response = await fetch(`http://localhost:8000/api/v1/files/${fileId}/download`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = ''; // Browser will use filename from Content-Disposition header
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            } else {
                this.showError('Failed to download file');
            }
        } catch (error) {
            console.error('Error downloading file:', error);
            this.showError('Error downloading file');
        }
    }

    async deleteFile(fileId) {
        console.log('deleteFile called with ID:', fileId);
        console.log('Current files:', this.currentTask.files?.map(f => ({ id: f.id, name: f.name })));
        
        if (!confirm('Are you sure you want to delete this file?')) {
            return;
        }

        try {
            console.log('Calling API to delete file:', fileId);
            const response = await api.delete(`/files/${fileId}`);
            
            const beforeCount = this.currentTask.files?.length || 0;
            
            // Remove from current task files
            this.currentTask.files = this.currentTask.files.filter(f => f.id !== fileId);
            
            const afterCount = this.currentTask.files?.length || 0;
            console.log(`Files before deletion: ${beforeCount}, after: ${afterCount}`);
            
            // Refresh display
            this.refreshFilesDisplay();
            
            this.showSuccess('File deleted successfully!');
        } catch (error) {
            console.error('Error deleting file:', error);
            
            // Check if it's an authentication error
            if (error.message && (error.message.includes('401') || error.message.includes('unauthorized'))) {
                console.warn('Authentication error during file deletion - preventing redirect');
                this.showError('Authentication error - please refresh and try again');
                return;
            }
            
            this.showError('Error deleting file: ' + (error.message || 'Unknown error'));
        }
    }

    refreshFilesDisplay() {
        const filesList = document.getElementById('taskFilesList');
        if (filesList) {
            filesList.innerHTML = this.renderTaskFiles();
        }
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
            this.chatMessages = await api.getTaskChatMessages(taskId);
            this.renderChatMessages();
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
                content: content
            };

            const response = await api.sendTaskChatMessage(this.currentTask.id, messageData);

            if (response.id) {
                this.chatMessages.push(response);
                this.renderChatMessages();
                chatInput.value = '';
                
                // Show success feedback briefly
                this.showChatSentFeedback();
            } else {
                throw new Error('Failed to send message');
            }
        } catch (error) {
            console.error('Failed to send chat message:', error);
            this.showNotification('Failed to send message. Please try again.', 'error');
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
            this.publicComments = await api.getTaskComments(taskId);
            this.renderPublicComments();
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
            this.showNotification('Please enter a comment before submitting.', 'error');
            return;
        }

        try {
            const commentData = {
                content: content,
                task_id: this.currentTask.id
            };

            const response = await api.createComment(commentData);

            if (response.id) {
                this.publicComments.push(response);
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
            this.showNotification('Failed to submit comment. Please try again.', 'error');
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

    // Task action methods
    async claimTask() {
        try {
            const response = await api.claimTask(this.currentTask.id);
            if (response) {
                this.currentTask.assignee_id = this.app.currentUser?.id;
                this.currentTask.status = 'in_progress';
                this.refreshTaskMetadata();
                this.showSuccess('Task claimed successfully!');
            }
        } catch (error) {
            console.error('Error claiming task:', error);
            this.showError('Failed to claim task');
        }
    }

    async makeTaskAvailable() {
        try {
            const response = await api.updateTaskStatus(this.currentTask.id, 'available');
            if (response) {
                this.currentTask.assignee_id = null;
                this.currentTask.status = 'available';
                this.refreshTaskMetadata();
                this.showSuccess('Task is now available for claiming');
            }
        } catch (error) {
            console.error('Error making task available:', error);
            this.showError('Failed to make task available');
        }
    }

    async markTaskCompleted() {
        try {
            const response = await api.updateTaskStatus(this.currentTask.id, 'completed');
            if (response) {
                this.currentTask.status = 'completed';
                this.refreshTaskMetadata();
                this.showSuccess('Task marked as completed!');
            }
        } catch (error) {
            console.error('Error completing task:', error);
            this.showError('Failed to complete task');
        }
    }

    showAssignModal() {
        // Create assignment modal
        const modal = document.createElement('div');
        modal.className = 'modal';
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
                padding: 24px;
                max-width: 400px;
                width: 90%;
                border: 1px solid rgba(78, 205, 196, 0.2);
            ">
                <h3 style="color: #ffffff; margin-bottom: 16px;">👥 Assign Task</h3>
                <div style="margin-bottom: 20px;">
                    <label style="display: block; margin-bottom: 8px; color: #ffffff;">Team Member Email:</label>
                    <input type="email" id="assigneeEmail" placeholder="Enter team member's email" 
                           style="width: 100%; padding: 12px; border: 1px solid rgba(78, 205, 196, 0.3); border-radius: 8px; background: rgba(68, 68, 68, 0.1); color: #ffffff;">
                </div>
                <div style="display: flex; gap: 12px; justify-content: flex-end;">
                    <button onclick="this.closest('.modal').remove()" 
                            style="padding: 10px 20px; border: 1px solid rgba(68, 68, 68, 0.4); background: rgba(68, 68, 68, 0.1); color: #ffffff; border-radius: 8px; cursor: pointer;">
                        Cancel
                    </button>
                    <button onclick="taskPageManager.assignTaskToUser(document.getElementById('assigneeEmail').value); this.closest('.modal').remove()" 
                            class="create-btn" style="padding: 10px 20px;">
                        Assign Task
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        document.getElementById('assigneeEmail').focus();
    }

    async assignTaskToUser(email) {
        if (!email || !email.trim()) {
            this.showError('Please enter a valid email address');
            return;
        }

        try {
            // Update the task with the new assignee email
            const updatedTask = {
                ...this.currentTask,
                assignee_id: email.trim(),
                status: 'in_progress'
            };
            
            const response = await api.updateTask(this.currentTask.id, updatedTask);
            if (response) {
                this.currentTask = response;
                this.refreshTaskMetadata();
                this.showSuccess(`Task assigned to ${email}`);
            }
        } catch (error) {
            console.error('Error assigning task:', error);
            this.showError('Failed to assign task. Please ensure the email is valid.');
        }
    }

    refreshTaskMetadata() {
        // Re-render the task details section
        const detailsGrid = document.querySelector('.details-grid');
        if (detailsGrid) {
            detailsGrid.innerHTML = this.renderTaskMetadata();
        }
    }

    showSuccess(message) {
        if (this.app && this.app.showNotification) {
            this.app.showNotification(message, 'success');
        } else {
            console.log('Success:', message);
        }
    }

    showError(message) {
        if (this.app && this.app.showNotification) {
            this.app.showNotification(message, 'error');
        } else {
            console.error('Error:', message);
        }
    }

    goBack() {
        console.log('goBack called');
        console.log('currentTask full object:', JSON.stringify(this.currentTask, null, 2));
        console.log('project_id specifically:', this.currentTask?.project_id);
        console.log('project_id type:', typeof this.currentTask?.project_id);
        
        // Check if task belongs to a project
        if (this.currentTask && this.currentTask.project_id) {
            // Navigate to the parent project
            console.log('Navigating to project:', this.currentTask.project_id);
            if (window.router) {
                window.router.navigate(`/project/${this.currentTask.project_id}`);
            } else {
                console.error('Router not available');
            }
        } else {
            // Navigate to dashboard if no parent project
            console.log('Navigating to dashboard - no project_id found');
            if (window.router) {
                window.router.navigate('/');
            } else {
                console.error('Router not available');
            }
        }
    }
}

// Global task page manager instance
let taskPageManager;