// Kairos Page Manager - Task Timeline View
class KairosPageManager {
    constructor(app) {
        this.app = app;
        this.tasks = [];
        this.completedTasks = [];
        this.upcomingTasks = [];
        this.currentTask = null;
    }

    async showKairosPage() {
        console.log('showKairosPage called');
        try {
            // Hide main container
            const mainContainer = document.querySelector('.main-container');
            if (mainContainer) {
                mainContainer.style.display = 'none';
            }

            // Create or get kairos container
            let kairosContainer = document.getElementById('kairos-page-container');
            if (!kairosContainer) {
                kairosContainer = document.createElement('div');
                kairosContainer.id = 'kairos-page-container';
                document.body.appendChild(kairosContainer);
            }

            kairosContainer.style.display = 'block';
            kairosContainer.style.position = 'fixed';
            kairosContainer.style.top = '0';
            kairosContainer.style.left = '0';
            kairosContainer.style.width = '100%';
            kairosContainer.style.height = '100%';
            kairosContainer.style.zIndex = '1000';
            document.body.style.overflow = 'auto';

            // Load task data
            await this.loadTaskTimeline();

            // Render the kairos page
            this.renderKairosPage(kairosContainer);
            console.log('Kairos page rendered successfully');

        } catch (error) {
            console.error('Failed to load kairos page:', error);
        }
    }

    async loadTaskTimeline() {
        try {
            // In a real implementation, this would load user's task history and upcoming tasks
            // For now, using sample data
            this.completedTasks = [
                {
                    id: '1',
                    title: 'Setup Development Environment',
                    project: 'HIVE Frontend',
                    completed_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
                    impact_points: 20
                },
                {
                    id: '2',
                    title: 'Implement User Authentication',
                    project: 'HIVE Backend',
                    completed_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
                    impact_points: 50
                },
                {
                    id: '3',
                    title: 'Design Database Schema',
                    project: 'HIVE Backend',
                    completed_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
                    impact_points: 40
                }
            ];

            this.currentTask = {
                id: '4',
                title: 'Create API Documentation',
                project: 'HIVE Backend',
                started_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
                progress: 65,
                estimated_hours: 4
            };

            this.upcomingTasks = [
                {
                    id: '5',
                    title: 'Implement Real-time Notifications',
                    project: 'HIVE Frontend',
                    priority: 'high',
                    estimated_hours: 6,
                    impact_points: 60
                },
                {
                    id: '6',
                    title: 'Performance Optimization',
                    project: 'HIVE Backend',
                    priority: 'medium',
                    estimated_hours: 8,
                    impact_points: 45
                },
                {
                    id: '7',
                    title: 'Write Unit Tests',
                    project: 'HIVE Testing',
                    priority: 'high',
                    estimated_hours: 10,
                    impact_points: 70
                }
            ];

        } catch (error) {
            console.error('Failed to load task timeline:', error);
        }
    }

    renderKairosPage(container) {
        container.innerHTML = `
            <div class="page-container" style="
                background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
                min-height: 100vh;
                padding: 70px 0 0 0;
                color: #ffffff;
            ">
                <!-- Header -->
                <div style="
                    padding: 20px 32px;
                    border-bottom: 1px solid rgba(78, 205, 196, 0.2);
                    background: rgba(0, 0, 0, 0.3);
                ">
                    <div style="
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        max-width: 1400px;
                        margin: 0 auto;
                    ">
                        <div>
                            <h1 style="margin: 0 0 4px 0; font-size: 28px; font-weight: 700;">⏰ Kairos</h1>
                            <p style="margin: 0; color: #d0d0d0; font-size: 14px;">
                                Seize the right moment - Your task timeline and flow
                            </p>
                        </div>
                        <button onclick="window.router.navigate('/')" style="
                            background: rgba(78, 205, 196, 0.15);
                            color: #4ecdc4;
                            border: 1px solid rgba(78, 205, 196, 0.3);
                            padding: 10px 20px;
                            border-radius: 8px;
                            cursor: pointer;
                            font-weight: 500;
                            font-size: 14px;
                            transition: all 0.3s ease;
                        " onmouseover="this.style.background='rgba(78, 205, 196, 0.25)'" 
                           onmouseout="this.style.background='rgba(78, 205, 196, 0.15)'">
                            ← Dashboard
                        </button>
                    </div>
                </div>

                <!-- Timeline Content -->
                <div style="max-width: 1200px; margin: 0 auto; padding: 32px;">
                    <!-- Current Task -->
                    ${this.renderCurrentTask()}
                    
                    <!-- Timeline Grid -->
                    <div style="
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 32px;
                        margin-top: 32px;
                    ">
                        <!-- Completed Tasks -->
                        <div>
                            <h2 style="
                                color: #4caf50;
                                font-size: 20px;
                                margin-bottom: 20px;
                                display: flex;
                                align-items: center;
                                gap: 10px;
                            ">
                                ✅ Completed Tasks
                                <span style="
                                    background: rgba(76, 175, 80, 0.2);
                                    padding: 4px 12px;
                                    border-radius: 12px;
                                    font-size: 14px;
                                ">${this.completedTasks.length}</span>
                            </h2>
                            ${this.renderCompletedTasks()}
                        </div>
                        
                        <!-- Upcoming Tasks -->
                        <div>
                            <h2 style="
                                color: #4ecdc4;
                                font-size: 20px;
                                margin-bottom: 20px;
                                display: flex;
                                align-items: center;
                                gap: 10px;
                            ">
                                📋 Upcoming Tasks
                                <span style="
                                    background: rgba(78, 205, 196, 0.2);
                                    padding: 4px 12px;
                                    border-radius: 12px;
                                    font-size: 14px;
                                ">${this.upcomingTasks.length}</span>
                            </h2>
                            ${this.renderUpcomingTasks()}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderCurrentTask() {
        if (!this.currentTask) {
            return '';
        }

        const hoursElapsed = Math.floor((Date.now() - new Date(this.currentTask.started_at)) / (1000 * 60 * 60));
        
        return `
            <div style="
                background: linear-gradient(135deg, rgba(255, 152, 0, 0.2), rgba(255, 152, 0, 0.1));
                border: 2px solid rgba(255, 152, 0, 0.4);
                border-radius: 16px;
                padding: 24px;
                margin-bottom: 32px;
            ">
                <h2 style="
                    color: #ff9800;
                    font-size: 20px;
                    margin: 0 0 16px 0;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                ">
                    🔥 Current Focus
                </h2>
                
                <div style="
                    background: rgba(0, 0, 0, 0.3);
                    border-radius: 12px;
                    padding: 20px;
                ">
                    <h3 style="color: #ffffff; margin: 0 0 8px 0; font-size: 18px;">
                        ${this.currentTask.title}
                    </h3>
                    <p style="color: #d0d0d0; margin: 0 0 16px 0; font-size: 14px;">
                        ${this.currentTask.project} • Started ${hoursElapsed}h ago
                    </p>
                    
                    <div style="margin-bottom: 16px;">
                        <div style="
                            display: flex;
                            justify-content: space-between;
                            margin-bottom: 8px;
                            font-size: 14px;
                        ">
                            <span>Progress</span>
                            <span>${this.currentTask.progress}%</span>
                        </div>
                        <div style="
                            background: rgba(255, 255, 255, 0.1);
                            height: 8px;
                            border-radius: 4px;
                            overflow: hidden;
                        ">
                            <div style="
                                background: linear-gradient(90deg, #ff9800, #f57c00);
                                height: 100%;
                                width: ${this.currentTask.progress}%;
                                transition: width 0.3s ease;
                            "></div>
                        </div>
                    </div>
                    
                    <button onclick="window.router.navigate('/task/${this.currentTask.id}')" 
                            class="btn-warning btn-medium" style="width: 100%;">
                        Continue Working →
                    </button>
                </div>
            </div>
        `;
    }

    renderCompletedTasks() {
        return this.completedTasks.map(task => {
            const completedDate = new Date(task.completed_at).toLocaleDateString();
            
            return `
                <div style="
                    background: rgba(76, 175, 80, 0.1);
                    border: 1px solid rgba(76, 175, 80, 0.2);
                    border-radius: 12px;
                    padding: 16px;
                    margin-bottom: 12px;
                    transition: all 0.2s ease;
                " onmouseover="this.style.borderColor='rgba(76, 175, 80, 0.4)'"
                   onmouseout="this.style.borderColor='rgba(76, 175, 80, 0.2)'">
                    <div style="display: flex; justify-content: space-between; align-items: start;">
                        <div>
                            <h4 style="color: #ffffff; margin: 0 0 4px 0; font-size: 16px;">
                                ${task.title}
                            </h4>
                            <p style="color: #a0a0a0; margin: 0; font-size: 12px;">
                                ${task.project} • Completed ${completedDate}
                            </p>
                        </div>
                        <span style="
                            background: rgba(76, 175, 80, 0.2);
                            color: #4caf50;
                            padding: 4px 8px;
                            border-radius: 8px;
                            font-size: 12px;
                            font-weight: 600;
                        ">+${task.impact_points}</span>
                    </div>
                </div>
            `;
        }).join('');
    }

    renderUpcomingTasks() {
        return this.upcomingTasks.map((task, index) => {
            const priorityColor = task.priority === 'high' ? '#ff6b6b' : 
                                task.priority === 'medium' ? '#ff9800' : '#4ecdc4';
            
            return `
                <div style="
                    background: rgba(78, 205, 196, 0.1);
                    border: 1px solid rgba(78, 205, 196, 0.2);
                    border-radius: 12px;
                    padding: 16px;
                    margin-bottom: 12px;
                    transition: all 0.2s ease;
                    cursor: pointer;
                " onmouseover="this.style.borderColor='rgba(78, 205, 196, 0.4)'"
                   onmouseout="this.style.borderColor='rgba(78, 205, 196, 0.2)'"
                   onclick="window.router.navigate('/task/${task.id}')">
                    <div style="display: flex; justify-content: space-between; align-items: start;">
                        <div style="flex: 1;">
                            <h4 style="color: #ffffff; margin: 0 0 4px 0; font-size: 16px;">
                                ${index === 0 ? '⭐ ' : ''}${task.title}
                            </h4>
                            <p style="color: #a0a0a0; margin: 0 0 8px 0; font-size: 12px;">
                                ${task.project} • ${task.estimated_hours}h estimated
                            </p>
                            <div style="display: flex; gap: 8px; align-items: center;">
                                <span style="
                                    background: ${priorityColor}20;
                                    color: ${priorityColor};
                                    padding: 2px 8px;
                                    border-radius: 6px;
                                    font-size: 11px;
                                    font-weight: 600;
                                ">${task.priority}</span>
                                <span style="
                                    color: #4ecdc4;
                                    font-size: 12px;
                                ">+${task.impact_points} impact</span>
                            </div>
                        </div>
                        ${index === 0 ? `
                            <button class="btn-primary btn-small" onclick="event.stopPropagation(); kairosPageManager.claimNextTask('${task.id}')">
                                Claim
                            </button>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');
    }

    async claimNextTask(taskId) {
        try {
            // In a real implementation, this would claim the task
            console.log('Claiming task:', taskId);
            window.router.navigate(`/task/${taskId}`);
        } catch (error) {
            console.error('Failed to claim task:', error);
        }
    }

    cleanup() {
        const container = document.getElementById('kairos-page-container');
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

// Global instance - will be initialized after app loads
window.kairosPageManager = null;