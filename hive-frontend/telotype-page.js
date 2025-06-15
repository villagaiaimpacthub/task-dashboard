// Telotype Page Manager - Telodiversity Mapping
class TelotypePageManager {
    constructor(app) {
        this.app = app;
        this.telotype = null;
    }

    async showTelotypePage() {
        console.log('showTelotypePage called');
        try {
            // Hide main container
            const mainContainer = document.querySelector('.main-container');
            if (mainContainer) {
                mainContainer.style.display = 'none';
            }

            // Create or get telotype container
            let telotypeContainer = document.getElementById('telotype-page-container');
            if (!telotypeContainer) {
                telotypeContainer = document.createElement('div');
                telotypeContainer.id = 'telotype-page-container';
                document.body.appendChild(telotypeContainer);
            }

            telotypeContainer.style.display = 'block';
            telotypeContainer.style.position = 'fixed';
            telotypeContainer.style.top = '0';
            telotypeContainer.style.left = '0';
            telotypeContainer.style.width = '100%';
            telotypeContainer.style.height = '100%';
            telotypeContainer.style.zIndex = '1000';
            document.body.style.overflow = 'auto';

            // Load telotype data
            await this.loadTelotypeData();

            // Render the telotype page
            this.renderTelotypePage(telotypeContainer);
            console.log('Telotype page rendered successfully');

        } catch (error) {
            console.error('Failed to load telotype page:', error);
        }
    }

    async loadTelotypeData() {
        try {
            // For now, using sample telotype data
            // This will be replaced with actual telodiversity mapping data
            this.telotype = {
                id: 'user_telotype_001',
                user_id: this.app.currentUser?.id || 'current_user',
                generated_at: new Date().toISOString(),
                diversity_score: 87,
                primary_archetype: 'Systems Thinker',
                secondary_archetype: 'Collaborative Builder',
                strengths: [
                    'Complex Problem Solving',
                    'Cross-functional Communication',
                    'Adaptive Learning',
                    'Pattern Recognition',
                    'Community Building'
                ],
                growth_areas: [
                    'Technical Depth',
                    'Leadership Presence',
                    'Strategic Planning'
                ],
                compatibility: {
                    high: ['Innovators', 'Analysts', 'Coordinators'],
                    medium: ['Specialists', 'Facilitators'],
                    developing: ['Entrepreneurs', 'Visionaries']
                },
                recommended_tasks: [
                    'System Architecture Design',
                    'Cross-team Coordination',
                    'Knowledge Documentation',
                    'Process Optimization'
                ]
            };

        } catch (error) {
            console.error('Failed to load telotype data:', error);
        }
    }

    renderTelotypePage(container) {
        const telotype = this.telotype;
        
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
                            <h1 style="margin: 0 0 4px 0; font-size: 28px; font-weight: 700;">🧬 My Telotype</h1>
                            <p style="margin: 0; color: #d0d0d0; font-size: 14px;">
                                Your unique telodiversity profile and collaboration patterns
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

                <!-- Telotype Content -->
                <div style="max-width: 1200px; margin: 0 auto; padding: 32px;">
                    
                    <!-- Coming Soon Notice -->
                    <div style="
                        background: linear-gradient(135deg, rgba(255, 152, 0, 0.2), rgba(255, 152, 0, 0.1));
                        border: 2px solid rgba(255, 152, 0, 0.4);
                        border-radius: 16px;
                        padding: 24px;
                        margin-bottom: 32px;
                        text-align: center;
                    ">
                        <h2 style="
                            color: #ff9800;
                            font-size: 24px;
                            margin: 0 0 16px 0;
                        ">🚧 Telodiversity Mapping Coming Soon</h2>
                        <p style="
                            color: #d0d0d0;
                            font-size: 16px;
                            margin: 0 0 20px 0;
                            line-height: 1.6;
                        ">
                            Your colleague is developing an advanced telodiversity mapping system that will replace 
                            traditional skills assessment with a more nuanced understanding of your unique collaboration 
                            patterns and cognitive diversity.
                        </p>
                        <p style="
                            color: #ff9800;
                            font-size: 14px;
                            margin: 0;
                            font-style: italic;
                        ">
                            Preview based on sample data - Full implementation will be uploaded soon
                        </p>
                    </div>

                    <!-- Sample Telotype Preview -->
                    <div style="
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 32px;
                        margin-bottom: 32px;
                    ">
                        <!-- Primary Profile -->
                        <div style="
                            background: rgba(78, 205, 196, 0.1);
                            border: 1px solid rgba(78, 205, 196, 0.2);
                            border-radius: 16px;
                            padding: 24px;
                        ">
                            <h3 style="
                                color: #4ecdc4;
                                font-size: 20px;
                                margin: 0 0 20px 0;
                                display: flex;
                                align-items: center;
                                gap: 10px;
                            ">
                                🎯 Primary Archetype
                            </h3>
                            
                            <div style="text-align: center; margin-bottom: 20px;">
                                <div style="
                                    font-size: 48px;
                                    margin-bottom: 10px;
                                ">🧠</div>
                                <h4 style="
                                    color: #ffffff;
                                    font-size: 18px;
                                    margin: 0;
                                ">${telotype.primary_archetype}</h4>
                            </div>
                            
                            <div style="
                                background: rgba(0, 0, 0, 0.3);
                                border-radius: 12px;
                                padding: 16px;
                                text-align: center;
                            ">
                                <div style="color: #4ecdc4; font-size: 14px; margin-bottom: 8px;">Diversity Score</div>
                                <div style="color: #ffffff; font-size: 32px; font-weight: 700;">${telotype.diversity_score}%</div>
                            </div>
                        </div>

                        <!-- Secondary Profile -->
                        <div style="
                            background: rgba(76, 175, 80, 0.1);
                            border: 1px solid rgba(76, 175, 80, 0.2);
                            border-radius: 16px;
                            padding: 24px;
                        ">
                            <h3 style="
                                color: #4caf50;
                                font-size: 20px;
                                margin: 0 0 20px 0;
                                display: flex;
                                align-items: center;
                                gap: 10px;
                            ">
                                🤝 Secondary Archetype
                            </h3>
                            
                            <div style="text-align: center; margin-bottom: 20px;">
                                <div style="
                                    font-size: 48px;
                                    margin-bottom: 10px;
                                ">🔗</div>
                                <h4 style="
                                    color: #ffffff;
                                    font-size: 18px;
                                    margin: 0;
                                ">${telotype.secondary_archetype}</h4>
                            </div>
                            
                            <div style="
                                background: rgba(0, 0, 0, 0.3);
                                border-radius: 12px;
                                padding: 16px;
                            ">
                                <div style="color: #4caf50; font-size: 14px; margin-bottom: 8px;">Collaboration Style</div>
                                <div style="color: #d0d0d0; font-size: 14px;">Cross-functional facilitation with systems perspective</div>
                            </div>
                        </div>
                    </div>

                    <!-- Strengths and Growth Areas -->
                    <div style="
                        display: grid;
                        grid-template-columns: 2fr 1fr;
                        gap: 32px;
                    ">
                        <!-- Strengths -->
                        <div style="
                            background: rgba(0, 0, 0, 0.4);
                            border: 1px solid rgba(78, 205, 196, 0.2);
                            border-radius: 16px;
                            padding: 24px;
                        ">
                            <h3 style="
                                color: #4ecdc4;
                                font-size: 18px;
                                margin: 0 0 20px 0;
                            ">✨ Core Strengths</h3>
                            
                            <div style="display: flex; flex-wrap: wrap; gap: 12px;">
                                ${telotype.strengths.map(strength => `
                                    <div style="
                                        background: rgba(78, 205, 196, 0.2);
                                        color: #4ecdc4;
                                        padding: 8px 16px;
                                        border-radius: 20px;
                                        font-size: 14px;
                                        font-weight: 500;
                                    ">${strength}</div>
                                `).join('')}
                            </div>
                            
                            <h4 style="
                                color: #ffffff;
                                font-size: 16px;
                                margin: 24px 0 12px 0;
                            ">🎯 Recommended Task Types</h4>
                            
                            <div style="display: flex; flex-direction: column; gap: 8px;">
                                ${telotype.recommended_tasks.map(task => `
                                    <div style="
                                        background: rgba(255, 255, 255, 0.1);
                                        padding: 12px 16px;
                                        border-radius: 8px;
                                        font-size: 14px;
                                        color: #d0d0d0;
                                    ">• ${task}</div>
                                `).join('')}
                            </div>
                        </div>

                        <!-- Growth Areas -->
                        <div style="
                            background: rgba(0, 0, 0, 0.4);
                            border: 1px solid rgba(255, 152, 0, 0.2);
                            border-radius: 16px;
                            padding: 24px;
                        ">
                            <h3 style="
                                color: #ff9800;
                                font-size: 18px;
                                margin: 0 0 20px 0;
                            ">🌱 Growth Areas</h3>
                            
                            <div style="display: flex; flex-direction: column; gap: 12px;">
                                ${telotype.growth_areas.map(area => `
                                    <div style="
                                        background: rgba(255, 152, 0, 0.1);
                                        border: 1px solid rgba(255, 152, 0, 0.3);
                                        color: #ff9800;
                                        padding: 12px 16px;
                                        border-radius: 8px;
                                        font-size: 14px;
                                    ">${area}</div>
                                `).join('')}
                            </div>
                            
                            <button style="
                                background: rgba(255, 152, 0, 0.15);
                                color: #ff9800;
                                border: 1px solid rgba(255, 152, 0, 0.3);
                                padding: 12px 20px;
                                border-radius: 8px;
                                cursor: pointer;
                                font-weight: 500;
                                font-size: 14px;
                                transition: all 0.3s ease;
                                width: 100%;
                                margin-top: 20px;
                            " onmouseover="this.style.background='rgba(255, 152, 0, 0.25)'" 
                               onmouseout="this.style.background='rgba(255, 152, 0, 0.15)'"
                               onclick="telotypePageManager.findGrowthTasks()">
                                Find Growth Tasks
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    findGrowthTasks() {
        // Navigate back to dashboard with a notification about finding relevant tasks
        window.router.navigate('/');
        this.app.showNotification('Growth-focused tasks will be highlighted in the dashboard!');
    }

    cleanup() {
        const container = document.getElementById('telotype-page-container');
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
window.telotypePageManager = null;