// TaskMaster Hierarchy Page Managers
class ProtocolsPageManager {
    constructor() {
        this.protocols = [];
        this.summary = null;
    }

    async render() {
        console.log('Rendering Protocol Development Page...');
        
        // Check if user is authenticated
        if (!api.isAuthenticated()) {
            console.log('User not authenticated, redirecting to login');
            app.showLoginModal();
            return;
        }

        // Check if user has permission to view protocols
        const currentUser = app.currentUser;
        if (!currentUser || !currentUser.permissions || !currentUser.permissions.includes('view_protocols')) {
            console.log('User does not have permission to view protocols');
            this.renderError('Access Denied: You need TaskMaster Admin or Protocol Steward privileges to view this page');
            return;
        }
        
        try {
            await this.loadData();
            this.renderProtocolsPage();
        } catch (error) {
            console.error('Error loading protocols:', error);
            this.renderError('Failed to load protocol data');
        }
    }

    async loadData() {
        console.log('Loading protocols data...');
        try {
            const [protocolsResponse, summaryResponse] = await Promise.all([
                api.get('/protocols'),
                api.get('/protocols/development-summary')
            ]);

            console.log('Protocols response:', protocolsResponse);
            console.log('Summary response:', summaryResponse);

            this.protocols = protocolsResponse;
            this.summary = summaryResponse;
        } catch (error) {
            console.error('Error in loadData:', error);
            throw error;
        }
    }

    renderProtocolsPage() {
        const mainContent = document.querySelector('.main-content');
        
        mainContent.innerHTML = `
            <div class="protocols-page">
                <div class="page-header">
                    <h1>🔧 Protocol Development</h1>
                    <p>Internal HIVE protocol building and stewardship</p>
                </div>

                <div class="summary-cards">
                    <div class="summary-card">
                        <div class="card-icon" style="background: #e8f5e9; color: #2e7d32;">🔧</div>
                        <div class="card-content">
                            <div class="card-number">${this.summary.total_protocols}</div>
                            <div class="card-label">Total Protocols</div>
                        </div>
                    </div>
                    <div class="summary-card">
                        <div class="card-icon" style="background: #fff3e0; color: #f57c00;">⚡</div>
                        <div class="card-content">
                            <div class="card-number">${this.summary.by_status['In Progress'] || 0}</div>
                            <div class="card-label">In Progress</div>
                        </div>
                    </div>
                    <div class="summary-card">
                        <div class="card-icon" style="background: #e8f5e9; color: #2e7d32;">✅</div>
                        <div class="card-content">
                            <div class="card-number">${this.summary.by_status['Production'] || 0}</div>
                            <div class="card-label">Production</div>
                        </div>
                    </div>
                    <div class="summary-card">
                        <div class="card-icon" style="background: #ffebee; color: #c62828;">🔴</div>
                        <div class="card-content">
                            <div class="card-number">${this.summary.by_health['red'] || 0}</div>
                            <div class="card-label">Needs Attention</div>
                        </div>
                    </div>
                </div>

                <div class="protocols-grid">
                    ${this.protocols.map(protocol => this.renderProtocolCard(protocol)).join('')}
                </div>
            </div>
        `;

        this.attachEventListeners();
    }

    renderProtocolCard(protocol) {
        const healthColor = {
            'green': '#4caf50',
            'yellow': '#ff9800', 
            'red': '#f44336'
        }[protocol.health_score];

        const statusColor = {
            'In Progress': '#ff9800',
            'Production': '#4caf50',
            'Not Started': '#9e9e9e'
        }[protocol.status];

        return `
            <div class="protocol-card" onclick="router.navigate('/protocol/${protocol.id}')">
                <div class="protocol-header">
                    <div class="protocol-name">${protocol.name}</div>
                    <div class="protocol-health" style="background-color: ${healthColor}"></div>
                </div>
                <div class="protocol-version">v${protocol.current_version}</div>
                <div class="protocol-status" style="color: ${statusColor}">${protocol.status}</div>
                <div class="protocol-purpose">${protocol.purpose}</div>
                <div class="protocol-steward">
                    <span class="steward-label">Steward:</span>
                    <span class="steward-name">${protocol.steward_name || 'Unassigned'}</span>
                </div>
                <div class="protocol-clients">
                    <span class="clients-count">${protocol.hive_clients?.length || 0} clients</span>
                </div>
            </div>
        `;
    }

    attachEventListeners() {
        // Protocol cards already have click handlers via onclick
    }

    renderError(message) {
        const mainContent = document.querySelector('.main-content');
        mainContent.innerHTML = `
            <div class="error-page">
                <h2>Error</h2>
                <p>${message}</p>
                <p><small>Check browser console for more details</small></p>
                <button onclick="router.navigate('/')">Back to Dashboard</button>
            </div>
        `;
    }
}

class ImplementationsPageManager {
    constructor() {
        this.implementations = [];
        this.summary = null;
    }

    async render() {
        console.log('Rendering Client Implementations Page...');
        
        // Check if user is authenticated
        if (!api.isAuthenticated()) {
            console.log('User not authenticated, redirecting to login');
            app.showLoginModal();
            return;
        }

        // Check if user has permission to view implementations
        const currentUser = app.currentUser;
        if (!currentUser || !currentUser.permissions || !currentUser.permissions.includes('view_implementations')) {
            console.log('User does not have permission to view implementations');
            this.renderError('Access Denied: You need TaskMaster Admin or Protocol Steward privileges to view this page');
            return;
        }
        
        try {
            await this.loadData();
            this.renderImplementationsPage();
        } catch (error) {
            console.error('Error loading implementations:', error);
            this.renderError('Failed to load implementation data');
        }
    }

    async loadData() {
        console.log('Loading implementations data...');
        try {
            const [implementationsResponse, summaryResponse] = await Promise.all([
                api.get('/client-implementations'),
                api.get('/client-implementations/pipeline-summary')
            ]);

            console.log('Implementations response:', implementationsResponse);
            console.log('Summary response:', summaryResponse);

            this.implementations = implementationsResponse;
            this.summary = summaryResponse;
        } catch (error) {
            console.error('Error in implementations loadData:', error);
            throw error;
        }
    }

    renderImplementationsPage() {
        const mainContent = document.querySelector('.main-content');
        
        mainContent.innerHTML = `
            <div class="implementations-page">
                <div class="page-header">
                    <h1>🚀 Client Implementations</h1>
                    <p>Protocol deployments at client sites</p>
                </div>

                <div class="summary-cards">
                    <div class="summary-card">
                        <div class="card-icon" style="background: #e3f2fd; color: #1976d2;">🚀</div>
                        <div class="card-content">
                            <div class="card-number">${this.summary.total_implementations}</div>
                            <div class="card-label">Total Implementations</div>
                        </div>
                    </div>
                    <div class="summary-card">
                        <div class="card-icon" style="background: #fff3e0; color: #f57c00;">⚡</div>
                        <div class="card-content">
                            <div class="card-number">${this.summary.by_status['In Progress'] || 0}</div>
                            <div class="card-label">In Progress</div>
                        </div>
                    </div>
                    <div class="summary-card">
                        <div class="card-icon" style="background: #e8f5e9; color: #2e7d32;">🧪</div>
                        <div class="card-content">
                            <div class="card-number">${this.summary.by_status['Testing'] || 0}</div>
                            <div class="card-label">Testing</div>
                        </div>
                    </div>
                    <div class="summary-card">
                        <div class="card-icon" style="background: #f3e5f5; color: #7b1fa2;">👥</div>
                        <div class="card-content">
                            <div class="card-number">${this.summary.active_contacts.length}</div>
                            <div class="card-label">Active Contacts</div>
                        </div>
                    </div>
                </div>

                <div class="implementations-grid">
                    ${this.implementations.map(impl => this.renderImplementationCard(impl)).join('')}
                </div>
            </div>
        `;

        this.attachEventListeners();
    }

    renderImplementationCard(impl) {
        const statusColors = {
            'Testing': '#ff9800',
            'In Progress': '#2196f3',
            'Potential Client': '#9c27b0',
            'Project Kick-Off': '#4caf50'
        };

        return `
            <div class="implementation-card" onclick="router.navigate('/implementation/${impl.id}')">
                <div class="implementation-header">
                    <div class="implementation-name">${impl.name}</div>
                    <div class="implementation-status" style="background-color: ${statusColors[impl.status] || '#9e9e9e'}">${impl.status}</div>
                </div>
                <div class="implementation-contact">
                    <span class="contact-label">Contact:</span>
                    <span class="contact-name">${impl.primary_contact}</span>
                </div>
                <div class="implementation-protocols">
                    <div class="protocols-label">Protocols:</div>
                    <div class="protocols-list">
                        ${impl.hive_protocols.map(protocol => `
                            <span class="protocol-tag">${protocol.name} ${protocol.version_deployed ? 'v' + protocol.version_deployed : ''}</span>
                        `).join('')}
                    </div>
                </div>
                <div class="implementation-environment">
                    <span class="env-label">Environment:</span>
                    <span class="env-value">${impl.deployment_environment}</span>
                </div>
            </div>
        `;
    }

    attachEventListeners() {
        // Implementation cards already have click handlers via onclick
    }

    renderError(message) {
        const mainContent = document.querySelector('.main-content');
        mainContent.innerHTML = `
            <div class="error-page">
                <h2>Error</h2>
                <p>${message}</p>
                <p><small>Check browser console for more details</small></p>
                <button onclick="router.navigate('/')">Back to Dashboard</button>
            </div>
        `;
    }
}

class ProjectsPageManager {
    constructor() {
        this.projects = [];
        this.summary = null;
    }

    async render() {
        console.log('Rendering Client Projects Page...');
        
        // Check if user is authenticated
        if (!api.isAuthenticated()) {
            console.log('User not authenticated, redirecting to login');
            app.showLoginModal();
            return;
        }

        // Check if user has permission to view projects
        const currentUser = app.currentUser;
        if (!currentUser || !currentUser.permissions || !currentUser.permissions.includes('view_projects')) {
            console.log('User does not have permission to view projects');
            this.renderError('Access Denied: You need TaskMaster Admin or Protocol Steward privileges to view this page');
            return;
        }
        
        try {
            await this.loadData();
            this.renderProjectsPage();
        } catch (error) {
            console.error('Error loading projects:', error);
            this.renderError('Failed to load project data');
        }
    }

    async loadData() {
        console.log('Loading projects data...');
        try {
            const [projectsResponse, summaryResponse] = await Promise.all([
                api.get('/client-projects'),
                api.get('/client-projects/summary')
            ]);

            console.log('Projects response:', projectsResponse);
            console.log('Summary response:', summaryResponse);

            this.projects = projectsResponse;
            this.summary = summaryResponse;
        } catch (error) {
            console.error('Error in projects loadData:', error);
            throw error;
        }
    }

    renderProjectsPage() {
        const mainContent = document.querySelector('.main-content');
        
        mainContent.innerHTML = `
            <div class="projects-page">
                <div class="page-header">
                    <h1>📂 Client Projects</h1>
                    <p>High-level project coordination and strategic initiatives</p>
                </div>

                <div class="summary-cards">
                    <div class="summary-card">
                        <div class="card-icon" style="background: #f3e5f5; color: #7b1fa2;">📂</div>
                        <div class="card-content">
                            <div class="card-number">${this.summary.total_projects}</div>
                            <div class="card-label">Total Projects</div>
                        </div>
                    </div>
                    <div class="summary-card">
                        <div class="card-icon" style="background: #fff3e0; color: #f57c00;">⚡</div>
                        <div class="card-content">
                            <div class="card-number">${this.summary.by_status['in_progress'] || 0}</div>
                            <div class="card-label">In Progress</div>
                        </div>
                    </div>
                    <div class="summary-card">
                        <div class="card-icon" style="background: #ffebee; color: #c62828;">⏰</div>
                        <div class="card-content">
                            <div class="card-number">${this.summary.upcoming_deadlines.length}</div>
                            <div class="card-label">Upcoming Deadlines</div>
                        </div>
                    </div>
                    <div class="summary-card">
                        <div class="card-icon" style="background: #e8f5e9; color: #2e7d32;">🔧</div>
                        <div class="card-content">
                            <div class="card-number">${Object.keys(this.summary.protocol_usage).length}</div>
                            <div class="card-label">Protocols Used</div>
                        </div>
                    </div>
                </div>

                <div class="projects-grid">
                    ${this.projects.map(project => this.renderProjectCard(project)).join('')}
                </div>
            </div>
        `;

        this.attachEventListeners();
    }

    renderProjectCard(project) {
        const statusColors = {
            'in_progress': '#ff9800',
            'building': '#2196f3',
            'completed': '#4caf50'
        };

        const completedDoD = project.definition_of_done.filter(dod => dod.completed).length;
        const totalDoD = project.definition_of_done.length;
        const progressPercentage = totalDoD > 0 ? Math.round((completedDoD / totalDoD) * 100) : 0;

        return `
            <div class="project-card" onclick="router.navigate('/project/${project.id}')">
                <div class="project-header">
                    <div class="project-title">${project.title}</div>
                    <div class="project-status" style="background-color: ${statusColors[project.status] || '#9e9e9e'}">${project.status.replace('_', ' ')}</div>
                </div>
                <div class="project-client">
                    <span class="client-label">Client:</span>
                    <span class="client-name">${project.client_name}</span>
                </div>
                <div class="project-protocols">
                    <div class="protocols-label">Protocols:</div>
                    <div class="protocols-list">
                        ${project.protocols.map(protocol => `
                            <span class="protocol-tag">${protocol.name}</span>
                        `).join('')}
                    </div>
                </div>
                <div class="project-progress">
                    <div class="progress-label">Progress: ${progressPercentage}%</div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progressPercentage}%"></div>
                    </div>
                </div>
                <div class="project-deadline">
                    <span class="deadline-label">Target:</span>
                    <span class="deadline-date">${project.finish_date}</span>
                </div>
            </div>
        `;
    }

    attachEventListeners() {
        // Project cards already have click handlers via onclick
    }

    renderError(message) {
        const mainContent = document.querySelector('.main-content');
        mainContent.innerHTML = `
            <div class="error-page">
                <h2>Error</h2>
                <p>${message}</p>
                <p><small>Check browser console for more details</small></p>
                <button onclick="router.navigate('/')">Back to Dashboard</button>
            </div>
        `;
    }
}

// Global instances
const protocolsPageManager = new ProtocolsPageManager();
const implementationsPageManager = new ImplementationsPageManager();
const projectsPageManager = new ProjectsPageManager();