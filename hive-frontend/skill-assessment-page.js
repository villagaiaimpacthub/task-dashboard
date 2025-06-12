/**
 * Skill Assessment Page Component
 * 
 * Interactive chat-based skill assessment tool for mapping user capabilities
 * Integrates with HIVE user profile system
 */

// Import removed - using global api and router objects

class SkillAssessmentPage {
    constructor() {
        this.currentQuestion = 0;
        this.userResponses = [];
        this.skillProfile = {};
        this.isAssessmentComplete = false;
    }

    async render() {
        return `
            <div class="skill-assessment-page">
                <div class="page-header">
                    <button class="back-btn" id="backToDashboard">← Back to Dashboard</button>
                    <h1>Skills Assessment</h1>
                </div>
                
                <div id="welcome-screen">
                    <div class="assessment-welcome-section">
                        <h1 class="assessment-welcome-title">Skill Assessment Protocol</h1>
                        <p class="assessment-welcome-subtitle">Let's discover your unique capabilities and match you with the perfect tasks</p>
                        <button class="assessment-start-button" id="startAssessmentBtn">Begin Assessment</button>
                    </div>
                </div>

                <div id="chat-screen" class="hidden">
                    <div class="assessment-progress-bar">
                        <div class="assessment-progress-fill" id="progressFill" style="width: 0%"></div>
                    </div>
                    
                    <div class="assessment-chat-container">
                        <div class="assessment-chat-messages" id="chatMessages"></div>
                        <div class="assessment-typing-indicator" id="typingIndicator">
                            <span>HIVE is analyzing</span>
                            <div class="assessment-typing-dots">
                                <div class="assessment-typing-dot"></div>
                                <div class="assessment-typing-dot"></div>
                                <div class="assessment-typing-dot"></div>
                            </div>
                        </div>
                        <div class="assessment-input-section">
                            <input type="text" class="assessment-chat-input" id="chatInput" placeholder="Share your response...">
                            <button class="assessment-send-button" id="sendButton">➤</button>
                        </div>
                    </div>
                </div>

                <div id="results-screen" class="hidden">
                    <div class="assessment-welcome-section">
                        <h1 class="assessment-welcome-title">Assessment Complete</h1>
                        <p class="assessment-welcome-subtitle">Your skill profile has been generated</p>
                    </div>
                    <div class="assessment-skill-tree" id="skillTree"></div>
                    <div class="assessment-export-section">
                        <button class="assessment-export-button" id="exportToSystemBtn">Save to Profile</button>
                        <button class="assessment-copy-button" id="copyDataBtn">Copy Data</button>
                        <button class="assessment-back-button" onclick="router.navigate('/')">Back to Dashboard</button>
                        <div class="assessment-export-info">
                            Save your skill profile to your HIVE account or copy the data for external use
                        </div>
                        <div class="assessment-success-message" id="successMessage"></div>
                    </div>
                </div>
            </div>
        `;
    }

    async init() {
        this.setupEventListeners();
        this.questions = [
            {
                text: "Welcome to HIVE! I'm here to understand your unique capabilities. Let's start with the big picture - what type of work energizes you most? Are you drawn to creative problem-solving, systematic analysis, or building and creating things?",
                category: "work_style"
            },
            {
                text: "Interesting! When you tackle a complex challenge, what's your natural approach? Do you dive deep into research first, brainstorm multiple solutions, or prefer to start experimenting right away?",
                category: "problem_solving"
            },
            {
                text: "Tell me about a recent project or accomplishment you're proud of. What made it special, and what role did you play in making it successful?",
                category: "achievements"
            },
            {
                text: "How do you prefer to work with others? Are you most effective leading a team, collaborating as an equal partner, or working independently and contributing your specialized expertise?",
                category: "collaboration"
            },
            {
                text: "What tools, technologies, or methods do you find yourself naturally gravitating toward? This could be anything from software and programming languages to communication methods or analytical frameworks.",
                category: "technical_skills"
            },
            {
                text: "When learning something new, what works best for you? Do you prefer hands-on experimentation, structured courses, learning from mentors, or diving into documentation and figuring it out yourself?",
                category: "learning_style"
            },
            {
                text: "Think about your ideal work environment. Do you thrive under tight deadlines with high stakes, prefer steady progress on long-term projects, or like variety with different types of challenges?",
                category: "work_environment"
            },
            {
                text: "What kind of impact do you want your work to have? Are you motivated by solving technical challenges, helping people directly, building systems that scale, or creating something entirely new?",
                category: "motivation"
            },
            {
                text: "Finally, if you could contribute to any type of project in the HIVE ecosystem, what would excite you most? Think about where your skills and interests align with creating value for the community.",
                category: "aspirations"
            }
        ];
    }

    setupEventListeners() {
        // Back to dashboard
        const backBtn = document.getElementById('backToDashboard');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                router.navigate('/');
            });
        }

        // Start assessment
        const startBtn = document.getElementById('startAssessmentBtn');
        if (startBtn) {
            startBtn.addEventListener('click', () => this.startAssessment());
        }

        // Send message
        const sendBtn = document.getElementById('sendButton');
        if (sendBtn) {
            sendBtn.addEventListener('click', () => this.sendMessage());
        }

        // Chat input enter key
        const chatInput = document.getElementById('chatInput');
        if (chatInput) {
            chatInput.addEventListener('keypress', (event) => {
                if (event.key === 'Enter') {
                    this.sendMessage();
                }
            });
        }

        // Export buttons
        const exportBtn = document.getElementById('exportToSystemBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportToSystem());
        }

        const copyBtn = document.getElementById('copyDataBtn');
        if (copyBtn) {
            copyBtn.addEventListener('click', () => this.copySkillData());
        }
    }

    startAssessment() {
        document.getElementById('welcome-screen').classList.add('hidden');
        document.getElementById('chat-screen').classList.remove('hidden');
        
        setTimeout(() => {
            this.askNextQuestion();
        }, 500);
    }

    askNextQuestion() {
        if (this.currentQuestion < this.questions.length) {
            this.showTypingIndicator();
            
            setTimeout(() => {
                this.hideTypingIndicator();
                this.addMessage(this.questions[this.currentQuestion].text, 'ai');
                this.updateProgress();
            }, 1500);
        } else {
            this.completeAssessment();
        }
    }

    sendMessage() {
        const input = document.getElementById('chatInput');
        const message = input.value.trim();
        
        if (message && this.currentQuestion < this.questions.length) {
            this.addMessage(message, 'user');
            this.userResponses.push({
                question: this.currentQuestion,
                category: this.questions[this.currentQuestion].category,
                response: message
            });
            
            input.value = '';
            this.currentQuestion++;
            
            setTimeout(() => {
                this.askNextQuestion();
            }, 1000);
        }
    }

    addMessage(text, sender) {
        const messagesContainer = document.getElementById('chatMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `assessment-message ${sender}`;
        
        const avatar = document.createElement('div');
        avatar.className = 'assessment-message-avatar';
        avatar.textContent = sender === 'ai' ? 'H' : 'U';
        
        const content = document.createElement('div');
        content.className = 'assessment-message-content';
        content.textContent = text;
        
        if (sender === 'user') {
            messageDiv.appendChild(content);
            messageDiv.appendChild(avatar);
        } else {
            messageDiv.appendChild(avatar);
            messageDiv.appendChild(content);
        }
        
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    showTypingIndicator() {
        document.getElementById('typingIndicator').style.display = 'flex';
    }

    hideTypingIndicator() {
        document.getElementById('typingIndicator').style.display = 'none';
    }

    updateProgress() {
        const progress = ((this.currentQuestion + 1) / this.questions.length) * 100;
        document.getElementById('progressFill').style.width = `${progress}%`;
    }

    completeAssessment() {
        this.showTypingIndicator();
        
        setTimeout(() => {
            this.hideTypingIndicator();
            this.addMessage("Excellent! I've analyzed your responses and built your comprehensive skill profile. Let me show you what we've discovered about your capabilities.", 'ai');
            
            setTimeout(() => {
                this.analyzeSkills();
                this.showResults();
            }, 2000);
        }, 2000);
    }

    analyzeSkills() {
        // Enhanced skill analysis based on user responses
        this.skillProfile = this.generateSkillsFromResponses();
        this.isAssessmentComplete = true;
    }

    generateSkillsFromResponses() {
        // Analyze responses to generate realistic skill profile
        const skills = {
            "Technical Skills": {
                "Programming": this.calculateSkillLevel("technical_skills", ["code", "programming", "software", "development"]),
                "Data Analysis": this.calculateSkillLevel("problem_solving", ["data", "analysis", "research", "metrics"]),
                "System Design": this.calculateSkillLevel("problem_solving", ["system", "architecture", "design", "structure"]),
                "DevOps": this.calculateSkillLevel("technical_skills", ["deployment", "infrastructure", "automation", "ops"])
            },
            "Creative Skills": {
                "Problem Solving": this.calculateSkillLevel("problem_solving", ["solve", "challenge", "creative", "innovative"]),
                "Innovation": this.calculateSkillLevel("work_style", ["new", "creative", "innovative", "original"]),
                "Design Thinking": this.calculateSkillLevel("work_style", ["design", "user", "experience", "thinking"]),
                "Content Creation": this.calculateSkillLevel("achievements", ["content", "writing", "create", "communication"])
            },
            "Leadership Skills": {
                "Team Management": this.calculateSkillLevel("collaboration", ["team", "lead", "manage", "organize"]),
                "Strategic Planning": this.calculateSkillLevel("work_environment", ["strategy", "plan", "long-term", "vision"]),
                "Communication": this.calculateSkillLevel("collaboration", ["communication", "explain", "present", "share"]),
                "Mentoring": this.calculateSkillLevel("collaboration", ["mentor", "teach", "guide", "help"])
            },
            "Domain Expertise": {
                "Research": this.calculateSkillLevel("learning_style", ["research", "investigate", "study", "documentation"]),
                "Analytics": this.calculateSkillLevel("problem_solving", ["analyze", "metrics", "measure", "evaluate"]),
                "Process Optimization": this.calculateSkillLevel("work_environment", ["process", "optimize", "improve", "efficiency"]),
                "Quality Assurance": this.calculateSkillLevel("work_style", ["quality", "testing", "standards", "review"])
            }
        };

        return skills;
    }

    calculateSkillLevel(category, keywords) {
        // Find responses in the relevant category
        const relevantResponses = this.userResponses.filter(r => r.category === category);
        let score = 1; // Base score
        
        // Analyze responses for keywords
        relevantResponses.forEach(response => {
            const responseText = response.response.toLowerCase();
            keywords.forEach(keyword => {
                if (responseText.includes(keyword)) {
                    score += 0.5;
                }
            });
        });

        // Add some randomness and cap at 5
        score += Math.random() * 0.5;
        return Math.min(Math.round(score), 5);
    }

    showResults() {
        setTimeout(() => {
            document.getElementById('chat-screen').classList.add('hidden');
            document.getElementById('results-screen').classList.remove('hidden');
            this.renderSkillTree();
        }, 1000);
    }

    renderSkillTree() {
        const skillTreeContainer = document.getElementById('skillTree');
        skillTreeContainer.innerHTML = ''; // Clear existing content
        
        Object.keys(this.skillProfile).forEach(category => {
            const categoryDiv = document.createElement('div');
            categoryDiv.className = 'assessment-skill-category';
            
            const categoryTitle = document.createElement('h3');
            categoryTitle.textContent = category;
            categoryDiv.appendChild(categoryTitle);
            
            const skillsGrid = document.createElement('div');
            skillsGrid.className = 'assessment-skills-grid';
            
            Object.keys(this.skillProfile[category]).forEach(skill => {
                const level = this.skillProfile[category][skill];
                const skillItem = document.createElement('div');
                skillItem.className = 'assessment-skill-item';
                
                const skillName = document.createElement('div');
                skillName.textContent = skill;
                skillItem.appendChild(skillName);
                
                const skillLevel = document.createElement('div');
                skillLevel.className = 'assessment-skill-level';
                
                for (let i = 1; i <= 5; i++) {
                    const dot = document.createElement('div');
                    dot.className = `assessment-skill-dot ${i <= level ? 'filled' : ''}`;
                    skillLevel.appendChild(dot);
                }
                
                skillItem.appendChild(skillLevel);
                skillsGrid.appendChild(skillItem);
            });
            
            categoryDiv.appendChild(skillsGrid);
            skillTreeContainer.appendChild(categoryDiv);
        });
    }

    generateExportData() {
        const topSkills = [];
        const allSkills = [];
        
        Object.keys(this.skillProfile).forEach(category => {
            Object.keys(this.skillProfile[category]).forEach(skill => {
                const level = this.skillProfile[category][skill];
                const skillData = {
                    name: skill,
                    category: category,
                    level: level,
                    proficiency: level >= 4 ? 'Expert' : level >= 3 ? 'Advanced' : level >= 2 ? 'Intermediate' : 'Beginner'
                };
                
                allSkills.push(skillData);
                
                if (level >= 4) {
                    topSkills.push(skillData);
                }
            });
        });

        topSkills.sort((a, b) => b.level - a.level);
        allSkills.sort((a, b) => b.level - a.level);

        return {
            userId: JSON.parse(localStorage.getItem('user') || '{}').id || 'user_' + Date.now(),
            assessmentDate: new Date().toISOString(),
            responses: this.userResponses,
            topSkills: topSkills.slice(0, 5),
            allSkills: allSkills,
            skillProfile: this.skillProfile,
            summary: {
                totalSkills: allSkills.length,
                expertLevel: topSkills.length,
                strongestCategory: this.getStrongestCategory(),
                recommendedRoles: this.generateRoleRecommendations(topSkills)
            }
        };
    }

    getStrongestCategory() {
        let strongest = '';
        let highestAverage = 0;
        
        Object.keys(this.skillProfile).forEach(category => {
            const skills = this.skillProfile[category];
            const average = Object.values(skills).reduce((sum, level) => sum + level, 0) / Object.keys(skills).length;
            
            if (average > highestAverage) {
                highestAverage = average;
                strongest = category;
            }
        });
        
        return strongest;
    }

    generateRoleRecommendations(topSkills) {
        const roles = [];
        const categories = topSkills.map(skill => skill.category);
        
        if (categories.includes('Technical Skills')) {
            roles.push('Technical Lead', 'Software Developer', 'Data Engineer');
        }
        if (categories.includes('Leadership Skills')) {
            roles.push('Project Manager', 'Team Lead', 'Scrum Master');
        }
        if (categories.includes('Creative Skills')) {
            roles.push('UX Designer', 'Innovation Specialist', 'Product Manager');
        }
        if (categories.includes('Domain Expertise')) {
            roles.push('Research Analyst', 'Quality Specialist', 'Process Consultant');
        }
        
        return [...new Set(roles)].slice(0, 4);
    }

    async exportToSystem() {
        try {
            const exportData = this.generateExportData();
            
            // Send skill data to backend
            const response = await api.post('/users/skills', {
                skills: exportData.allSkills,
                skillProfile: exportData.skillProfile,
                assessmentData: {
                    date: exportData.assessmentDate,
                    responses: exportData.responses,
                    summary: exportData.summary
                }
            });

            if (response.success) {
                this.showSuccessMessage('Skill profile saved to your HIVE account successfully!');
                
                // Update local user data
                const user = JSON.parse(localStorage.getItem('user') || '{}');
                user.skills = exportData.allSkills;
                user.skillProfile = exportData.skillProfile;
                localStorage.setItem('user', JSON.stringify(user));
            } else {
                throw new Error('Failed to save to system');
            }
        } catch (error) {
            console.error('Error saving skills:', error);
            this.showSuccessMessage('Error saving to system. Data copied to clipboard as backup.');
            this.copySkillData();
        }
    }

    copySkillData() {
        const exportData = this.generateExportData();
        const dataStr = JSON.stringify(exportData, null, 2);
        
        navigator.clipboard.writeText(dataStr).then(() => {
            this.showSuccessMessage('Skill data copied to clipboard! Ready for integration.');
        }).catch(err => {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = dataStr;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            this.showSuccessMessage('Skill data copied to clipboard! Ready for integration.');
        });
    }

    showSuccessMessage(message) {
        const successElement = document.getElementById('successMessage');
        if (successElement) {
            successElement.textContent = message;
            successElement.style.display = 'block';
            
            setTimeout(() => {
                successElement.style.display = 'none';
            }, 4000);
        }
    }
}

export const skillAssessmentPage = new SkillAssessmentPage();