/**
 * Standalone Skill Assessment Tool
 * Interactive chat-based skill assessment for HIVE
 */

class SkillAssessmentTool {
    constructor() {
        this.currentQuestion = 0;
        this.userResponses = [];
        this.skillProfile = {};
        this.isAssessmentComplete = false;
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
                text: "Think about your learning style - do you prefer hands-on experimentation, structured courses and documentation, learning from mentors, or discovering through trial and error?",
                category: "learning_style"
            },
            {
                text: "What kind of impact drives you? Are you motivated by helping individuals directly, solving systemic problems, creating something new, or optimizing existing processes?",
                category: "motivation"
            },
            {
                text: "When working under pressure or tight deadlines, what's your typical response? Do you thrive on the energy, break things down methodically, seek support from others, or prefer to avoid high-pressure situations?",
                category: "pressure_response"
            },
            {
                text: "Finally, what's one skill or area of expertise you'd love to develop further, and what draws you to it?",
                category: "growth_areas"
            }
        ];
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
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
            exportBtn.addEventListener('click', () => this.saveToProfile());
        }

        const copyBtn = document.getElementById('copyDataBtn');
        if (copyBtn) {
            copyBtn.addEventListener('click', () => this.copyData());
        }
    }

    startAssessment() {
        document.getElementById('welcome-screen').classList.add('hidden');
        document.getElementById('chat-screen').classList.remove('hidden');
        
        setTimeout(() => {
            this.askQuestion();
        }, 500);
    }

    askQuestion() {
        if (this.currentQuestion >= this.questions.length) {
            this.completeAssessment();
            return;
        }

        const question = this.questions[this.currentQuestion];
        this.showTypingIndicator();
        
        setTimeout(() => {
            this.hideTypingIndicator();
            this.addMessage(question.text, 'hive');
            this.updateProgress();
        }, 1500);
    }

    sendMessage() {
        const input = document.getElementById('chatInput');
        const message = input.value.trim();
        
        if (!message) return;
        
        this.addMessage(message, 'user');
        this.userResponses.push({
            question: this.questions[this.currentQuestion],
            response: message
        });
        
        input.value = '';
        this.currentQuestion++;
        
        setTimeout(() => {
            this.askQuestion();
        }, 1000);
    }

    addMessage(text, sender) {
        const messagesContainer = document.getElementById('chatMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `assessment-message ${sender}`;
        messageDiv.textContent = text;
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    showTypingIndicator() {
        document.getElementById('typingIndicator').style.display = 'block';
    }

    hideTypingIndicator() {
        document.getElementById('typingIndicator').style.display = 'none';
    }

    updateProgress() {
        const progress = (this.currentQuestion / this.questions.length) * 100;
        document.getElementById('progressFill').style.width = `${progress}%`;
    }

    completeAssessment() {
        this.analyzeSkills();
        this.showResults();
    }

    analyzeSkills() {
        // Generate a realistic skill profile based on responses
        this.skillProfile = this.generateSkillsFromResponses();
    }

    generateSkillsFromResponses() {
        const skills = {
            'Technical Skills': {},
            'Communication & Leadership': {},
            'Problem Solving': {},
            'Domain Expertise': {}
        };

        // Analyze responses for skill indicators
        this.userResponses.forEach(response => {
            const text = response.response.toLowerCase();
            
            // Technical skills detection
            if (text.includes('code') || text.includes('program') || text.includes('develop') || text.includes('software')) {
                skills['Technical Skills']['Programming'] = Math.min((skills['Technical Skills']['Programming'] || 0) + 25, 95);
            }
            if (text.includes('data') || text.includes('analysis') || text.includes('analytics')) {
                skills['Technical Skills']['Data Analysis'] = Math.min((skills['Technical Skills']['Data Analysis'] || 0) + 30, 90);
            }
            if (text.includes('design') || text.includes('ui') || text.includes('ux') || text.includes('interface')) {
                skills['Technical Skills']['Design'] = Math.min((skills['Technical Skills']['Design'] || 0) + 25, 85);
            }

            // Communication skills
            if (text.includes('lead') || text.includes('manage') || text.includes('team') || text.includes('coordinate')) {
                skills['Communication & Leadership']['Leadership'] = Math.min((skills['Communication & Leadership']['Leadership'] || 0) + 30, 90);
            }
            if (text.includes('present') || text.includes('speak') || text.includes('communicate') || text.includes('explain')) {
                skills['Communication & Leadership']['Public Speaking'] = Math.min((skills['Communication & Leadership']['Public Speaking'] || 0) + 25, 85);
            }
            if (text.includes('write') || text.includes('document') || text.includes('report')) {
                skills['Communication & Leadership']['Technical Writing'] = Math.min((skills['Communication & Leadership']['Technical Writing'] || 0) + 20, 80);
            }

            // Problem solving
            if (text.includes('research') || text.includes('investigate') || text.includes('analyze')) {
                skills['Problem Solving']['Research'] = Math.min((skills['Problem Solving']['Research'] || 0) + 25, 90);
            }
            if (text.includes('creative') || text.includes('innovative') || text.includes('brainstorm')) {
                skills['Problem Solving']['Creative Thinking'] = Math.min((skills['Problem Solving']['Creative Thinking'] || 0) + 30, 95);
            }
            if (text.includes('system') || text.includes('process') || text.includes('method')) {
                skills['Problem Solving']['Systems Thinking'] = Math.min((skills['Problem Solving']['Systems Thinking'] || 0) + 25, 85);
            }

            // Domain expertise
            if (text.includes('environment') || text.includes('sustainability') || text.includes('climate')) {
                skills['Domain Expertise']['Environmental Science'] = Math.min((skills['Domain Expertise']['Environmental Science'] || 0) + 35, 95);
            }
            if (text.includes('business') || text.includes('strategy') || text.includes('market')) {
                skills['Domain Expertise']['Business Strategy'] = Math.min((skills['Domain Expertise']['Business Strategy'] || 0) + 30, 85);
            }
            if (text.includes('community') || text.includes('social') || text.includes('people')) {
                skills['Domain Expertise']['Community Building'] = Math.min((skills['Domain Expertise']['Community Building'] || 0) + 25, 90);
            }
        });

        // Add some baseline skills for everyone
        if (Object.keys(skills['Technical Skills']).length === 0) {
            skills['Technical Skills']['Digital Literacy'] = 65;
        }
        if (Object.keys(skills['Communication & Leadership']).length === 0) {
            skills['Communication & Leadership']['Collaboration'] = 70;
        }
        if (Object.keys(skills['Problem Solving']).length === 0) {
            skills['Problem Solving']['Critical Thinking'] = 75;
        }
        if (Object.keys(skills['Domain Expertise']).length === 0) {
            skills['Domain Expertise']['General Knowledge'] = 60;
        }

        return skills;
    }

    showResults() {
        document.getElementById('chat-screen').classList.add('hidden');
        document.getElementById('results-screen').classList.remove('hidden');
        
        this.renderSkillTree();
        this.isAssessmentComplete = true;
    }

    renderSkillTree() {
        const skillTree = document.getElementById('skillTree');
        let html = '';

        Object.entries(this.skillProfile).forEach(([category, skills]) => {
            html += `<div class="assessment-skill-category">
                <h3>${category}</h3>`;
            
            Object.entries(skills).forEach(([skill, level]) => {
                html += `
                    <div class="assessment-skill-label">
                        <span>${skill}</span>
                        <span>${level}%</span>
                    </div>
                    <div class="assessment-skill-bar">
                        <div class="assessment-skill-fill" style="width: ${level}%"></div>
                    </div>
                `;
            });
            
            html += '</div>';
        });

        skillTree.innerHTML = html;
    }

    async saveToProfile() {
        try {
            // This would integrate with the HIVE API
            const skillData = {
                profile: this.skillProfile,
                responses: this.userResponses,
                timestamp: new Date().toISOString()
            };

            // For now, just save to localStorage
            localStorage.setItem('hive_skill_assessment', JSON.stringify(skillData));
            
            this.showSuccessMessage('Skill profile saved successfully! Data stored locally.');
        } catch (error) {
            console.error('Error saving profile:', error);
            this.showSuccessMessage('Error saving profile. Please try copying the data instead.');
        }
    }

    copyData() {
        const data = {
            skillProfile: this.skillProfile,
            responses: this.userResponses,
            timestamp: new Date().toISOString()
        };

        const textArea = document.createElement('textarea');
        textArea.value = JSON.stringify(data, null, 2);
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        this.showSuccessMessage('Skill data copied to clipboard! Ready for integration.');
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

// Initialize the assessment tool
document.addEventListener('DOMContentLoaded', () => {
    const assessment = new SkillAssessmentTool();
    assessment.init();
});