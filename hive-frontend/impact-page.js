// Impact History Page Manager
class ImpactPageManager {
    constructor(app) {
        this.app = app;
        this.completedProjects = [];
        this.totalImpact = 0;
    }

    async showImpactPage() {
        console.log('showImpactPage called');
        try {
            // Hide main container
            const mainContainer = document.querySelector('.main-container');
            if (mainContainer) {
                mainContainer.style.display = 'none';
            }

            // Create or get impact container
            let impactContainer = document.getElementById('impact-page-container');
            if (!impactContainer) {
                impactContainer = document.createElement('div');
                impactContainer.id = 'impact-page-container';
                document.body.appendChild(impactContainer);
            }

            impactContainer.style.display = 'block';
            impactContainer.style.position = 'fixed';
            impactContainer.style.top = '0';
            impactContainer.style.left = '0';
            impactContainer.style.width = '100%';
            impactContainer.style.height = '100%';
            impactContainer.style.zIndex = '1000';
            document.body.style.overflow = 'auto';

            // Load completed projects and calculate impact
            await this.loadCompletedProjects();

            // Render the impact page
            this.renderImpactPage(impactContainer);
            console.log('Impact page rendered successfully');

        } catch (error) {
            console.error('Failed to load impact page:', error);
        }
    }

    async loadCompletedProjects() {
        try {
            // Get all projects for current user
            const allProjects = await api.getProjects();
            
            // Filter completed projects where current user was involved
            this.completedProjects = allProjects.filter(project => 
                project.status === 'completed' && 
                (project.owner_id === this.app.currentUser?.id || project.assignee_id === this.app.currentUser?.id)
            );

            // If no completed projects found, add sample data for demo
            if (this.completedProjects.length === 0) {
                this.completedProjects = [
                    {
                        id: 'sample1',
                        title: 'User Authentication System',
                        description: 'Implemented secure user login and registration system',
                        category: 'Software Development',
                        impact_points: 150,
                        completed_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
                        status: 'completed'
                    },
                    {
                        id: 'sample2',
                        title: 'Database Optimization',
                        description: 'Improved query performance and reduced load times by 40%',
                        category: 'Data Analysis',
                        impact_points: 120,
                        completed_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
                        status: 'completed'
                    },
                    {
                        id: 'sample3',
                        title: 'UI/UX Redesign',
                        description: 'Modernized user interface with improved accessibility',
                        category: 'UI/UX Design',
                        impact_points: 100,
                        completed_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
                        status: 'completed'
                    },
                    {
                        id: 'sample4',
                        title: 'API Documentation',
                        description: 'Created comprehensive API documentation for developers',
                        category: 'Project Management',
                        impact_points: 80,
                        completed_at: new Date(Date.now() - 75 * 24 * 60 * 60 * 1000).toISOString(),
                        status: 'completed'
                    }
                ];
            }

            // Calculate total impact
            this.totalImpact = this.completedProjects.reduce((total, project) => 
                total + (project.impact_points || 0), 0
            );

        } catch (error) {
            console.error('Failed to load completed projects:', error);
            // Use sample data on error
            this.completedProjects = [
                {
                    id: 'sample1',
                    title: 'User Authentication System',
                    description: 'Implemented secure user login and registration system',
                    category: 'Software Development',
                    impact_points: 150,
                    completed_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
                    status: 'completed'
                },
                {
                    id: 'sample2',
                    title: 'Database Optimization',
                    description: 'Improved query performance and reduced load times by 40%',
                    category: 'Data Analysis',
                    impact_points: 120,
                    completed_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
                    status: 'completed'
                }
            ];
            this.totalImpact = this.completedProjects.reduce((total, project) => 
                total + (project.impact_points || 0), 0
            );
        }
    }

    renderImpactPage(container) {
        const currentUser = this.app.currentUser;
        
        container.innerHTML = `
            <div class="page-container" style="
                background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
                min-height: 100vh;
                padding: 70px 0 0 0;
                color: #ffffff;
            ">
                <div style="max-width: 1200px; margin: 0 auto; padding: 32px;">
                    <!-- Header -->
                    <div style="
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 32px;
                        padding-bottom: 20px;
                        border-bottom: 1px solid rgba(78, 205, 196, 0.2);
                    ">
                        <div>
                            <h1 style="margin: 0 0 8px 0; font-size: 32px; font-weight: 700;">📈 Impact History</h1>
                            <p style="margin: 0; color: #d0d0d0; font-size: 16px;">Track your completed projects and accumulated impact</p>
                        </div>
                        <button onclick="window.router.navigate('/')" style="
                            background: rgba(78, 205, 196, 0.15);
                            color: #4ecdc4;
                            border: 1px solid rgba(78, 205, 196, 0.3);
                            padding: 12px 24px;
                            border-radius: 8px;
                            cursor: pointer;
                            font-weight: 500;
                            transition: all 0.3s ease;
                        " onmouseover="this.style.background='rgba(78, 205, 196, 0.25)'" 
                           onmouseout="this.style.background='rgba(78, 205, 196, 0.15)'">
                            ← Back to Dashboard
                        </button>
                    </div>

                    <!-- Impact Summary -->
                    <div style="
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                        gap: 24px;
                        margin-bottom: 40px;
                    ">
                        <div style="
                            background: rgba(76, 175, 80, 0.1);
                            border: 1px solid rgba(76, 175, 80, 0.2);
                            border-radius: 16px;
                            padding: 24px;
                            text-align: center;
                        ">
                            <div style="font-size: 48px; margin-bottom: 12px;">🎯</div>
                            <div style="font-size: 32px; font-weight: bold; color: #4caf50; margin-bottom: 8px;">+${this.totalImpact}</div>
                            <div style="color: #d0d0d0;">Total Impact Points</div>
                        </div>
                        
                        <div style="
                            background: rgba(78, 205, 196, 0.1);
                            border: 1px solid rgba(78, 205, 196, 0.2);
                            border-radius: 16px;
                            padding: 24px;
                            text-align: center;
                        ">
                            <div style="font-size: 48px; margin-bottom: 12px;">✅</div>
                            <div style="font-size: 32px; font-weight: bold; color: #4ecdc4; margin-bottom: 8px;">${this.completedProjects.length}</div>
                            <div style="color: #d0d0d0;">Completed Projects</div>
                        </div>
                        
                        <div style="
                            background: rgba(255, 152, 0, 0.1);
                            border: 1px solid rgba(255, 152, 0, 0.2);
                            border-radius: 16px;
                            padding: 24px;
                            text-align: center;
                        ">
                            <div style="font-size: 48px; margin-bottom: 12px;">⭐</div>
                            <div style="font-size: 32px; font-weight: bold; color: #ff9800; margin-bottom: 8px;">${this.calculateRank()}</div>
                            <div style="color: #d0d0d0;">Current Rank</div>
                        </div>
                    </div>

                    <!-- Completed Projects List -->
                    <div style="
                        background: rgba(0, 0, 0, 0.4);
                        border: 1px solid rgba(78, 205, 196, 0.2);
                        border-radius: 16px;
                        padding: 24px;
                    ">
                        <h2 style="margin: 0 0 24px 0; color: #4ecdc4; font-size: 24px;">🏆 Completed Projects</h2>
                        
                        ${this.completedProjects.length > 0 ? 
                            this.completedProjects.map(project => this.renderCompletedProject(project)).join('') :
                            `<div style="
                                text-align: center;
                                padding: 40px;
                                color: #d0d0d0;
                                font-style: italic;
                            ">
                                <div style="font-size: 48px; margin-bottom: 16px;">📋</div>
                                <p>No completed projects yet.</p>
                                <p style="font-size: 14px; margin-top: 16px;">Complete projects to start building your impact history!</p>
                            </div>`
                        }
                    </div>
                </div>
            </div>
        `;
    }

    renderCompletedProject(project) {
        const completedDate = project.completed_at ? new Date(project.completed_at).toLocaleDateString() : 'Recently';
        
        return `
            <div style="
                background: rgba(68, 68, 68, 0.3);
                border: 1px solid rgba(78, 205, 196, 0.2);
                border-radius: 12px;
                padding: 20px;
                margin-bottom: 16px;
                transition: all 0.3s ease;
                cursor: pointer;
            " onclick="window.router.navigate('/project/${project.id}')"
               onmouseover="this.style.borderColor='rgba(78, 205, 196, 0.4)'; this.style.transform='translateY(-2px)'"
               onmouseout="this.style.borderColor='rgba(78, 205, 196, 0.2)'; this.style.transform='translateY(0)'">
                
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                    <h3 style="margin: 0; color: #ffffff; font-size: 18px; font-weight: 600;">${project.title}</h3>
                    <div style="
                        background: rgba(76, 175, 80, 0.2);
                        color: #4caf50;
                        padding: 4px 12px;
                        border-radius: 12px;
                        font-size: 14px;
                        font-weight: 600;
                        white-space: nowrap;
                        margin-left: 16px;
                    ">+${project.impact_points || 0} Impact</div>
                </div>
                
                <p style="margin: 0 0 12px 0; color: #d0d0d0; font-size: 14px; line-height: 1.5;">
                    ${project.description ? project.description.substring(0, 150) + (project.description.length > 150 ? '...' : '') : 'No description available'}
                </p>
                
                <div style="display: flex; justify-content: space-between; align-items: center; font-size: 12px; color: #a0a0a0;">
                    <span>Completed: ${completedDate}</span>
                    <span>Category: ${project.category || 'General'}</span>
                </div>
            </div>
        `;
    }

    calculateRank() {
        if (this.totalImpact >= 1000) return 'Expert';
        if (this.totalImpact >= 500) return 'Advanced';
        if (this.totalImpact >= 200) return 'Intermediate';
        if (this.totalImpact >= 50) return 'Contributor';
        return 'Beginner';
    }

    cleanup() {
        const container = document.getElementById('impact-page-container');
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
window.impactPageManager = null;