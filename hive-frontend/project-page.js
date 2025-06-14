// Project Page Component
class ProjectPage {
    constructor() {
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
                    <button onclick="router.navigate('/')" class="back-btn">← Back to Dashboard</button>
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
            <div class="task-card small" data-task-id="${task.id}" style="cursor: pointer;">
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
            </div>
        `).join('');
    }

    setupEventListeners() {
        // Add click handlers for task cards
        const taskCards = document.querySelectorAll('.task-card.small[data-task-id]');
        taskCards.forEach(card => {
            card.addEventListener('click', (e) => {
                const taskId = card.dataset.taskId;
                console.log('Task card clicked, navigating to task:', taskId);
                if (taskId) {
                    // First hide the project page
                    this.hide();
                    // Then navigate to task
                    router.navigate(`/task/${taskId}`);
                }
            });
        });
    }

    showCreateTaskModal() {
        // TODO: Show task creation modal with project pre-selected
        app.showNotification('Task creation for projects coming soon!');
    }

    hide() {
        const container = document.getElementById('projectPageContainer');
        if (container) {
            container.style.display = 'none';
        }
        document.getElementById('mainInterface').style.display = 'block';
        // Restore default page title
        document.title = 'HIVE - Task Management System';
    }
}

// Global instance
const projectPage = new ProjectPage();