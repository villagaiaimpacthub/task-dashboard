/**
 * Master Plan Import Page
 * 
 * This page allows users to upload and import master plans into the HIVE system.
 * It supports parsing documents and breaking them down into the hierarchy:
 * Masterplan -> Waypoints -> Projects -> Tasks -> Subtasks
 */

// Import removed - using global api and router objects

class ImportPage {
    constructor() {
        this.container = null;
        this.previewData = null;
    }

    async render() {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        
        // Check if user has permission to import
        if (!user.permissions?.includes('task.create')) {
            return this.renderNoPermission();
        }

        return `
            <div class="import-page">
                <div class="page-header">
                    <button class="back-btn" id="backToDashboard">← Back to Dashboard</button>
                    <h1>Import Master Plan</h1>
                    <p class="subtitle">Upload and parse your organization's master plan to auto-generate projects and tasks</p>
                </div>

                <div class="import-container">
                    <!-- Step 1: Upload -->
                    <div class="import-step" id="upload-step">
                        <h2>Step 1: Upload Master Plan</h2>
                        <div class="upload-area" id="upload-area">
                            <div class="upload-content">
                                <svg class="upload-icon" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
                                </svg>
                                <p class="upload-text">Drop your master plan here or click to browse</p>
                                <p class="upload-formats">Supported formats: Markdown (.md)</p>
                                <input type="file" id="file-input" accept=".md,.markdown" style="display: none;">
                            </div>
                        </div>
                        
                        <div class="manual-input">
                            <h3>Or paste your master plan content:</h3>
                            <textarea id="manual-content" placeholder="# Master Plan Title

## Waypoint: Phase 1

### Project: Initial Setup
Description of the project...

#### Task: Configure Environment
Task details...

#### Task: Setup Infrastructure
Task details..." rows="10"></textarea>
                            <button class="btn btn-primary" id="parse-manual">Parse Content</button>
                        </div>
                    </div>

                    <!-- Step 2: Preview -->
                    <div class="import-step hidden" id="preview-step">
                        <h2>Step 2: Preview Import</h2>
                        <div id="preview-content">
                            <!-- Preview will be inserted here -->
                        </div>
                        <div class="preview-actions">
                            <button class="btn btn-secondary" id="back-to-upload">Back</button>
                            <button class="btn btn-primary" id="confirm-import">Confirm Import</button>
                        </div>
                    </div>

                    <!-- Step 3: Success -->
                    <div class="import-step hidden" id="success-step">
                        <h2>Import Successful!</h2>
                        <div class="success-message">
                            <svg class="success-icon" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <circle cx="12" cy="12" r="10"/>
                                <path d="M8 12l2 2 4-4"/>
                            </svg>
                            <div id="import-summary">
                                <!-- Summary will be inserted here -->
                            </div>
                        </div>
                        <div class="success-actions">
                            <button class="btn btn-primary" onclick="router.navigate('/')">View Tasks</button>
                            <button class="btn btn-secondary" onclick="router.navigate('/import')">Import Another</button>
                        </div>
                    </div>
                </div>

                <!-- Error Display -->
                <div id="error-container" class="error-container hidden"></div>
            </div>
        `;
    }

    renderNoPermission() {
        return `
            <div class="import-page">
                <div class="no-permission">
                    <h2>Permission Required</h2>
                    <p>You need task creation permissions to import master plans.</p>
                    <button class="btn btn-primary" onclick="router.navigate('/')">Back to Dashboard</button>
                </div>
            </div>
        `;
    }

    async init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Back to dashboard
        const backBtn = document.getElementById('backToDashboard');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                router.navigate('/');
            });
        }

        // File upload
        const uploadArea = document.getElementById('upload-area');
        const fileInput = document.getElementById('file-input');
        
        if (uploadArea && fileInput) {
            uploadArea.addEventListener('click', () => fileInput.click());
            
            uploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                uploadArea.classList.add('drag-over');
            });
            
            uploadArea.addEventListener('dragleave', () => {
                uploadArea.classList.remove('drag-over');
            });
            
            uploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                uploadArea.classList.remove('drag-over');
                const files = e.dataTransfer.files;
                if (files.length > 0) {
                    this.handleFileUpload(files[0]);
                }
            });
            
            fileInput.addEventListener('change', (e) => {
                if (e.target.files.length > 0) {
                    this.handleFileUpload(e.target.files[0]);
                }
            });
        }

        // Manual content parsing
        const parseManualBtn = document.getElementById('parse-manual');
        if (parseManualBtn) {
            parseManualBtn.addEventListener('click', () => {
                const content = document.getElementById('manual-content').value;
                if (content.trim()) {
                    this.parseMasterPlan(content);
                } else {
                    this.showError('Please enter some content to parse');
                }
            });
        }

        // Preview actions
        const backToUploadBtn = document.getElementById('back-to-upload');
        if (backToUploadBtn) {
            backToUploadBtn.addEventListener('click', () => {
                this.showStep('upload-step');
                this.previewData = null;
            });
        }

        const confirmBtn = document.getElementById('confirm-import');
        if (confirmBtn) {
            confirmBtn.addEventListener('click', () => this.confirmImport());
        }
    }

    async handleFileUpload(file) {
        if (!file.name.match(/\.(md|markdown)$/i)) {
            this.showError('Please upload a Markdown file (.md or .markdown)');
            return;
        }

        try {
            const content = await this.readFile(file);
            this.parseMasterPlan(content);
        } catch (error) {
            this.showError('Error reading file: ' + error.message);
        }
    }

    readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsText(file);
        });
    }

    async parseMasterPlan(content) {
        try {
            this.showLoading('Parsing master plan...');
            
            const response = await api.post('/import/master-plan', {
                content: content,
                format: 'markdown'
            });

            if (response.status === 'success') {
                this.previewData = response.preview;
                this.showPreview(response.preview);
                this.showStep('preview-step');
            } else {
                this.showError(response.message || 'Failed to parse master plan');
            }
        } catch (error) {
            this.showError('Error parsing master plan: ' + error.message);
        } finally {
            this.hideLoading();
        }
    }

    showPreview(data) {
        const previewContent = document.getElementById('preview-content');
        if (!previewContent) return;

        const summary = data.summary;
        
        previewContent.innerHTML = `
            <div class="preview-summary">
                <h3>Import Summary</h3>
                <div class="summary-stats">
                    <div class="stat">
                        <span class="stat-value">${summary.waypoints_count}</span>
                        <span class="stat-label">Waypoints</span>
                    </div>
                    <div class="stat">
                        <span class="stat-value">${summary.projects_count}</span>
                        <span class="stat-label">Projects</span>
                    </div>
                    <div class="stat">
                        <span class="stat-value">${summary.tasks_count}</span>
                        <span class="stat-label">Tasks</span>
                    </div>
                    <div class="stat">
                        <span class="stat-value">${summary.subtasks_count}</span>
                        <span class="stat-label">Subtasks</span>
                    </div>
                    <div class="stat">
                        <span class="stat-value">${summary.milestones_count}</span>
                        <span class="stat-label">Milestones</span>
                    </div>
                </div>
                ${summary.complex_tasks_count > 0 ? `
                    <p class="complexity-note">
                        <strong>${summary.complex_tasks_count}</strong> complex tasks 
                        (complexity > 6/10) were automatically broken down into subtasks.
                    </p>
                ` : ''}
            </div>

            <div class="preview-details">
                ${this.renderWaypoints(data.waypoints)}
                ${this.renderProjects(data.projects)}
                ${this.renderTasks(data.tasks, data.subtasks)}
            </div>
        `;
    }

    renderWaypoints(waypoints) {
        if (!waypoints || waypoints.length === 0) return '';
        
        return `
            <div class="preview-section">
                <h4>Waypoints</h4>
                <ul class="preview-list">
                    ${waypoints.map(wp => `
                        <li>
                            <strong>${wp.name}</strong>
                            <span class="preview-meta">${wp.project_ids.length} projects</span>
                        </li>
                    `).join('')}
                </ul>
            </div>
        `;
    }

    renderProjects(projects) {
        if (!projects || projects.length === 0) return '';
        
        return `
            <div class="preview-section">
                <h4>Projects</h4>
                <ul class="preview-list">
                    ${projects.slice(0, 5).map(proj => `
                        <li>
                            <strong>${proj.name}</strong>
                            <div class="preview-description">${this.truncate(proj.description, 100)}</div>
                            <span class="preview-meta">DoD: ${proj.definition_of_done.length} criteria</span>
                        </li>
                    `).join('')}
                    ${projects.length > 5 ? `<li class="more-items">...and ${projects.length - 5} more projects</li>` : ''}
                </ul>
            </div>
        `;
    }

    renderTasks(tasks, subtasks) {
        if (!tasks || tasks.length === 0) return '';
        
        return `
            <div class="preview-section">
                <h4>Tasks</h4>
                <ul class="preview-list">
                    ${tasks.slice(0, 5).map(task => `
                        <li>
                            <strong>${task.title}</strong>
                            ${task.complexity_score ? `
                                <span class="complexity-badge complexity-${this.getComplexityClass(task.complexity_score)}">
                                    Complexity: ${task.complexity_score.toFixed(1)}/10
                                </span>
                            ` : ''}
                            <div class="preview-description">${this.truncate(task.description, 100)}</div>
                            <div class="preview-metadata">
                                ${task.category ? `<span class="preview-tag">Category: ${task.category}</span>` : ''}
                                ${task.required_skills && task.required_skills.length > 0 ? `<span class="preview-tag">Skills: ${task.required_skills.length} required</span>` : ''}
                                ${task.dependencies && task.dependencies.length > 0 ? `<span class="preview-tag">Dependencies: ${task.dependencies.length}</span>` : ''}
                                ${task.definition_of_done ? `<span class="preview-tag">DoD: Defined</span>` : ''}
                            </div>
                            ${subtasks && subtasks.filter(st => st.parent_task_id === task.id).length > 0 ? `
                                <span class="preview-meta">
                                    ${subtasks.filter(st => st.parent_task_id === task.id).length} subtasks
                                </span>
                            ` : ''}
                        </li>
                    `).join('')}
                    ${tasks.length > 5 ? `<li class="more-items">...and ${tasks.length - 5} more tasks</li>` : ''}
                </ul>
            </div>
        `;
    }

    getComplexityClass(score) {
        if (score <= 3) return 'low';
        if (score <= 6) return 'medium';
        return 'high';
    }

    truncate(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    async confirmImport() {
        try {
            this.showLoading('Importing master plan...');
            
            // Send the preview data to the backend
            const response = await api.post('/import/confirm', {
                preview_data: this.previewData
            });

            if (response.status === 'success') {
                this.showImportSuccess(response.imported_count || 0);
                this.showStep('success-step');
            } else {
                this.showError(response.message || 'Failed to import master plan');
            }
        } catch (error) {
            this.showError('Error importing master plan: ' + error.message);
        } finally {
            this.hideLoading();
        }
    }

    showImportSuccess(importedCount) {
        const summaryEl = document.getElementById('import-summary');
        if (!summaryEl) return;

        // Calculate counts from preview data if available
        const counts = {
            waypoints: this.previewData?.waypoints?.length || 0,
            projects: this.previewData?.projects?.length || 0,
            tasks: importedCount || 0,
            subtasks: this.previewData?.subtasks?.length || 0,
            milestones: this.previewData?.milestones?.length || 0
        };

        summaryEl.innerHTML = `
            <h3>Successfully Imported:</h3>
            <ul class="import-results">
                ${counts.waypoints > 0 ? `<li>${counts.waypoints} waypoints</li>` : ''}
                ${counts.projects > 0 ? `<li>${counts.projects} projects</li>` : ''}
                ${counts.tasks > 0 ? `<li>${counts.tasks} tasks</li>` : ''}
                ${counts.subtasks > 0 ? `<li>${counts.subtasks} subtasks</li>` : ''}
                ${counts.milestones > 0 ? `<li>${counts.milestones} milestones</li>` : ''}
            </ul>
        `;
    }

    showStep(stepId) {
        document.querySelectorAll('.import-step').forEach(step => {
            step.classList.add('hidden');
        });
        
        const targetStep = document.getElementById(stepId);
        if (targetStep) {
            targetStep.classList.remove('hidden');
        }
    }

    showError(message) {
        const errorContainer = document.getElementById('error-container');
        if (errorContainer) {
            errorContainer.innerHTML = `
                <div class="error-message">
                    <strong>Error:</strong> ${message}
                </div>
            `;
            errorContainer.classList.remove('hidden');
            
            setTimeout(() => {
                errorContainer.classList.add('hidden');
            }, 5000);
        }
    }

    showLoading(message) {
        // Could implement a loading overlay
        console.log('Loading:', message);
    }

    hideLoading() {
        // Hide loading overlay
        console.log('Loading complete');
    }
}

export const importPage = new ImportPage();