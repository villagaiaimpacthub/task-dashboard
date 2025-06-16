// Project Page Component
class ProjectPage {
    constructor(app) {
        this.app = app;
        this.project = null;
        this.tasks = [];
        this.currentUser = null;
    }

    async render(projectId) {
        console.log('ProjectPage.render called with ID:', projectId);
        
        if (!projectId) {
            console.error('No project ID provided to project page');
            return;
        }
        
        // Hide main interface and show project page
        console.log('Hiding main interface');
        const mainInterface = document.getElementById('mainInterface');
        if (mainInterface) {
            mainInterface.style.display = 'none';
            console.log('Main interface hidden:', mainInterface.style.display);
        } else {
            console.error('Main interface element not found!');
        }
        
        // Create or get project page container
        let container = document.getElementById('projectPageContainer');
        if (!container) {
            console.log('Creating new project page container');
            container = document.createElement('div');
            container.id = 'projectPageContainer';
            container.className = 'page-container';
            document.body.appendChild(container);
        }
        
        console.log('Showing project page container');
        container.style.display = 'block';
        container.style.zIndex = '1000';
        container.innerHTML = '<div class="loading">Loading project...</div>';
        console.log('Project container display:', container.style.display);
        console.log('Project container z-index:', container.style.zIndex);
        
        try {
            console.log('Loading project data...');
            
            // Store project ID immediately for task navigation
            sessionStorage.setItem('currentProjectId', projectId);
            console.log('DEBUG: Stored project ID in sessionStorage during load:', projectId);
            
            await this.loadProject(projectId);
            await this.loadProjectTasks(projectId);
            console.log('Project data loaded, rendering page...');
            this.renderProjectPage();
        } catch (error) {
            console.error('Error loading project:', error);
            container.innerHTML = `
                <div class="error-container">
                    <h2>Error Loading Project</h2>
                    <p>${error.message}</p>
                    <button onclick="router.navigate('/')" class="back-btn">Back to Dashboard</button>
                </div>
            `;
        }
    }

    async loadProject(projectId) {
        console.log('Loading project with ID:', projectId);
        try {
            this.project = await api.getProject(projectId);
            console.log('Project loaded successfully:', this.project);
            this.currentUser = app.currentUser;
        } catch (error) {
            console.error('Error loading project:', error);
            throw error;
        }
    }

    async loadProjectTasks(projectId) {
        console.log('Loading tasks for project:', projectId);
        try {
            this.tasks = await api.getProjectTasks(projectId);
            console.log('Tasks loaded successfully:', this.tasks.length, 'tasks');
        } catch (error) {
            console.error('Error loading project tasks:', error);
            this.tasks = []; // Set empty array on error
        }
    }

    renderProjectPage() {
        const container = document.getElementById('projectPageContainer');
        const project = this.project;
        
        // Update page title
        document.title = `${project.title} - HIVE Project`;
        
        // Format dates
        const startDate = project.start_date ? new Date(project.start_date).toLocaleDateString() : 'TBD';
        const dueDate = project.due_date ? new Date(project.due_date).toLocaleDateString() : 'TBD';
        
        // Calculate progress
        const progressPercent = project.completed_tasks > 0 ? 
            Math.round((project.completed_tasks / project.task_count) * 100) : 0;
        
        // Aggregate skills from all tasks
        const allSkills = new Set(project.required_skills || []);
        this.tasks.forEach(task => {
            if (task.required_skills && Array.isArray(task.required_skills)) {
                task.required_skills.forEach(skill => allSkills.add(skill));
            }
        });
        
        // Generate skills HTML
        const skillsHtml = Array.from(allSkills).map(skill => 
            `<div class="skill-tag">${skill}</div>`
        ).join('');
        
        container.innerHTML = `
            <div class="project-page">
                <div class="project-header">
                    <button onclick="window.projectPage.goBackToDashboard()" class="back-btn">← Back to Dashboard</button>
                    <div class="project-title-section">
                        <h1>${project.title}</h1>
                        <div class="project-meta">
                            <span class="priority priority-${project.priority}">${project.priority}</span>
                            <span class="status status-${project.status}">${project.status}</span>
                            <span class="category">${project.category || 'General'}</span>
                        </div>
                    </div>
                </div>

                <div class="project-content">
                    <div class="project-tasks">
                        <div class="tasks-header">
                            <h3>Project Tasks</h3>
                            <button class="create-btn" onclick="projectPage.showCreateTaskModal()">+ Add Task</button>
                        </div>
                        <div class="tasks-grid" id="projectTasksGrid">
                            ${this.renderProjectTasks()}
                        </div>
                    </div>

                    <div class="project-overview">
                        <div class="project-description">
                            <h3>Description</h3>
                            <p>${project.description || 'No description provided'}</p>
                        </div>
                        
                        <div class="project-progress">
                            <h3>Progress</h3>
                            <div class="progress-info">
                                <span>${project.completed_tasks || 0}/${project.task_count || 0} tasks completed</span>
                                <span>${progressPercent}%</span>
                            </div>
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${progressPercent}%"></div>
                            </div>
                        </div>

                        <div class="project-details">
                            <h3>Project Details</h3>
                            <div class="details-grid">
                                <div class="detail-item">
                                    <strong>Start Date:</strong> ${startDate}
                                </div>
                                <div class="detail-item">
                                    <strong>Due Date:</strong> ${dueDate}
                                </div>
                                <div class="detail-item">
                                    <strong>Team Size:</strong> ${project.team_size || 1} members
                                </div>
                                <div class="detail-item">
                                    <strong>Location:</strong> ${project.location || 'Global'}
                                </div>
                                <div class="detail-item">
                                    <strong>Budget:</strong> ${project.budget || 'TBD'}
                                </div>
                                <div class="detail-item">
                                    <strong>Impact Points:</strong> +${project.impact_points || 100}
                                </div>
                            </div>
                        </div>

                        <div class="project-skills">
                            <h3>Required Skills</h3>
                            <div class="skills-container">
                                ${skillsHtml || '<div class="no-tasks">No skills required</div>'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.setupEventListeners();
    }

    renderProjectTasks() {
        if (this.tasks.length === 0) {
            return '<div class="no-tasks">No tasks yet. Create the first task for this project!</div>';
        }

        return this.tasks.map(task => `
            <div class="task-card small" data-task-id="${task.id}" style="cursor: pointer; position: relative;">
                <div class="task-meta">
                    <div class="task-priority priority-${task.priority}">${task.priority}</div>
                    <div class="task-status status-${task.status}">${task.status}</div>
                </div>
                <div class="task-title">${task.title}</div>
                <div class="task-description">
                    ${task.description ? task.description.substring(0, 100) + '...' : 'No description'}
                </div>
                <div class="task-details">
                    <span class="detail-item">
                        <span class="detail-icon">⏱️</span>
                        <span>${task.estimated_hours || '2-4'} hours</span>
                    </span>
                    <span class="detail-item">
                        <span class="detail-icon">📍</span>
                        <span>${task.location || 'Global'}</span>
                    </span>
                </div>
                ${this.renderTaskCardActions(task)}
            </div>
        `).join('');
    }

    renderTaskCardActions(task) {
        const currentUser = this.app.currentUser;
        if (!currentUser) return '';

        const isAssigned = task.assignee_id && task.assignee_id !== 'Available';
        const isCurrentUserAssigned = task.assignee_id === currentUser.id;
        const isOwner = task.owner_id === currentUser.id;
        
        let actions = '';
        
        // Create left/right button layout
        actions += '<div class="task-card-button-container">';
        
        // Left side - Assignee info or claim button
        actions += '<div class="task-card-left">';
        if (isAssigned) {
            const assigneeDisplay = isCurrentUserAssigned ? 'You' : (task.assignee_email || task.assignee_id);
            actions += `
                <span class="assignee-label">👤 ${assigneeDisplay}</span>
            `;
        } else {
            // Show claim button on the left for unassigned tasks
            actions += `
                <button onclick="event.stopPropagation(); try { if (window.projectPage && window.projectPage.claimTask) { window.projectPage.claimTask('${task.id}').catch(err => console.error('Claim failed:', err)); } else { console.error('ProjectPage not available'); } } catch(e) { console.error('Claim error:', e); }" 
                        class="action-btn claim-btn-small">
                    🙋‍♂️ Claim
                </button>
            `;
        }
        actions += '</div>';
        
        // Right side - Management buttons
        actions += '<div class="task-card-right">';
        
        if (!isAssigned && isOwner) {
            // Owner can assign unassigned tasks
            actions += `
                <button onclick="event.stopPropagation(); try { if (window.projectPage && window.projectPage.showAssignModal) { window.projectPage.showAssignModal('${task.id}'); } else { console.error('ProjectPage not available'); } } catch(e) { console.error('Assign modal error:', e); }" 
                        class="action-btn assign-btn-small">
                    👥 Assign
                </button>
            `;
        } else if (isAssigned && isOwner && !isCurrentUserAssigned) {
            // Task is assigned to someone else, owner can reassign
            actions += `
                <button onclick="event.stopPropagation(); try { if (window.projectPage && window.projectPage.showAssignModal) { window.projectPage.showAssignModal('${task.id}'); } else { console.error('ProjectPage not available'); } } catch(e) { console.error('Reassign modal error:', e); }" 
                        class="action-btn reassign-btn-small">
                    🔄 Reassign
                </button>
            `;
        } else if (isCurrentUserAssigned && task.status === 'in_progress') {
            // Current user is assigned - show complete button
            actions += `
                <button onclick="event.stopPropagation(); try { if (window.projectPage && window.projectPage.markTaskCompleted) { window.projectPage.markTaskCompleted('${task.id}').catch(err => console.error('Complete failed:', err)); } else { console.error('ProjectPage not available'); } } catch(e) { console.error('Complete error:', e); }" 
                        class="action-btn complete-btn-small">
                    ✅ Complete
                </button>
            `;
        }
        
        actions += '</div>';
        actions += '</div>';
        
        return actions;
    }

    renderTasks() {
        const tasksGrid = document.getElementById('projectTasksGrid');
        if (tasksGrid) {
            tasksGrid.innerHTML = this.renderProjectTasks();
            // Re-setup event listeners for the new content
            this.setupEventListeners();
        }
    }

    setupEventListeners() {
        // Add click handlers for task cards
        const taskCards = document.querySelectorAll('.task-card.small[data-task-id]');
        const currentProjectId = this.project?.id; // Capture project ID before event listener
        
        taskCards.forEach(card => {
            card.addEventListener('click', (e) => {
                const taskId = card.dataset.taskId;
                console.log('Task card clicked, navigating to task:', taskId);
                if (taskId) {
                    // Store the current project ID for back navigation using multiple methods
                    console.log('DEBUG: About to set project context. currentProjectId =', currentProjectId);
                    console.log('DEBUG: window.taskPageManager exists?', !!window.taskPageManager);
                    
                    if (currentProjectId) {
                        // Method 1: Set on taskPageManager if available
                        if (window.taskPageManager) {
                            console.log('DEBUG: Calling setProjectContext with:', currentProjectId);
                            window.taskPageManager.setProjectContext(currentProjectId);
                        }
                        
                        // Method 2: Store in sessionStorage as backup
                        sessionStorage.setItem('currentProjectId', currentProjectId);
                        console.log('DEBUG: Stored project ID in sessionStorage:', currentProjectId);
                    } else {
                        console.log('DEBUG: Cannot set project context - no projectId available');
                    }
                    // First hide the project page
                    this.hide();
                    // Then navigate to task
                    router.navigate(`/task/${taskId}`);
                }
            });
        });
    }

    showCreateTaskModal() {
        // Pre-populate the task form with project information
        if (this.project) {
            // Set the category to match the project's category
            const categorySelect = document.getElementById('category');
            if (categorySelect && this.project.category) {
                categorySelect.value = this.project.category;
            }
            
            // Set default values from project
            const prioritySelect = document.getElementById('priority');
            if (prioritySelect) {
                prioritySelect.value = this.project.priority || 'medium';
            }
            
            const locationInput = document.getElementById('location');
            if (locationInput && this.project.location) {
                locationInput.value = this.project.location;
            }
            
            const scopeSelect = document.getElementById('scope');
            if (scopeSelect) {
                scopeSelect.value = this.project.scope || 'internal';
            }
            
            // Set required skills if available
            const skillsInput = document.getElementById('requiredSkills');
            if (skillsInput && this.project.required_skills) {
                skillsInput.value = this.project.required_skills.join(', ');
            }
        }
        
        // Store current project ID for task creation
        this.taskProjectId = this.project?.id;
        
        // Show the task modal
        app.showTaskModal();
    }

    goBackToDashboard() {
        // Hide project page
        this.hide();
        // Navigate to dashboard using router
        if (window.router) {
            window.router.navigate('/');
        } else {
            // Fallback if router is not available
            this.showDashboard();
        }
    }

    showDashboard() {
        // Show main interface
        const mainInterface = document.getElementById('mainInterface');
        if (mainInterface) {
            mainInterface.style.display = 'block';
        }
        
        // Hide project page
        this.hide();
        
        // Restore body overflow
        document.body.style.overflow = 'hidden';
        
        // Update URL without using router
        if (window.history && window.history.pushState) {
            window.history.pushState({}, '', '/');
        }
    }

    async claimTask(taskId) {
        try {
            console.log('Claiming task:', taskId);
            const response = await api.claimTask(taskId);
            if (response) {
                // Update the task in our local array
                const task = this.tasks.find(t => t.id === taskId);
                if (task) {
                    task.assignee_id = this.app.currentUser?.id;
                    task.status = 'in_progress';
                }
                
                // Re-render the project tasks to update the UI
                this.renderTasks();
                
                // Show success message
                this.showSuccess('Task claimed successfully!');
            }
        } catch (error) {
            console.error('Error claiming task:', error);
            this.showError('Failed to claim task');
        }
    }

    showSuccess(message) {
        // Simple success notification
        const notification = document.createElement('div');
        notification.className = 'success-notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 90px;
            right: 20px;
            background: #4caf50;
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            font-weight: 500;
            z-index: 10000;
            animation: slideInRight 0.3s ease;
        `;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    showError(message) {
        // Simple error notification
        const notification = document.createElement('div');
        notification.className = 'error-notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 90px;
            right: 20px;
            background: #f44336;
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            font-weight: 500;
            z-index: 10000;
            animation: slideInRight 0.3s ease;
        `;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    showAssignModal(taskId) {
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
                    <button onclick="try { const email = document.getElementById('assigneeEmail').value; if (window.projectPage && window.projectPage.assignTaskToUser) { window.projectPage.assignTaskToUser('${taskId}', email).then(() => this.closest('.modal').remove()).catch(err => { console.error('Assignment failed:', err); this.closest('.modal').remove(); }); } else { console.error('ProjectPage not available'); this.closest('.modal').remove(); } } catch(e) { console.error('Assignment error:', e); this.closest('.modal').remove(); }" 
                            class="create-btn" style="padding: 10px 20px;">
                        Assign Task
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        document.getElementById('assigneeEmail').focus();
    }

    async assignTaskToUser(taskId, email) {
        if (!email || !email.trim()) {
            this.showError('Please enter a valid email address');
            return;
        }

        try {
            // Update the task with the new assignee email
            const task = this.tasks.find(t => t.id === taskId);
            if (!task) {
                this.showError('Task not found');
                return;
            }

            const updatedTask = {
                ...task,
                assignee_id: email.trim(),
                assignee_email: email.trim(),
                status: 'in_progress'
            };
            
            const response = await api.updateTask(taskId, updatedTask);
            if (response) {
                // Update local task data
                Object.assign(task, updatedTask);
                this.renderTasks();
                this.showSuccess(`Task assigned to ${email}`);
            }
        } catch (error) {
            console.error('Error assigning task:', error);
            this.showError('Failed to assign task');
        }
    }

    async markTaskCompleted(taskId) {
        try {
            const task = this.tasks.find(t => t.id === taskId);
            if (!task) {
                this.showError('Task not found');
                return;
            }

            const updatedTask = {
                ...task,
                status: 'completed'
            };
            
            const response = await api.updateTask(taskId, updatedTask);
            if (response) {
                Object.assign(task, updatedTask);
                this.renderTasks();
                this.showSuccess('Task marked as completed!');
            }
        } catch (error) {
            console.error('Error completing task:', error);
            this.showError('Failed to complete task');
        }
    }

    hide() {
        const container = document.getElementById('projectPageContainer');
        if (container) {
            container.style.display = 'none';
        }
        const mainInterface = document.getElementById('mainInterface');
        if (mainInterface) {
            mainInterface.style.display = 'block';
        }
        // Restore default page title
        document.title = 'HIVE - Task Management System';
    }
}

// Global instance - will be initialized with app instance
let projectPage = null;