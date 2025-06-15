// Messages Page Manager
class MessagesPageManager {
    constructor(app) {
        this.app = app;
        this.conversations = [];
        this.activeConversationId = null;
        this.messages = [];
        this.onlineUsers = [];
    }

    async showMessagesPage() {
        console.log('showMessagesPage called');
        try {
            // Hide main container
            const mainContainer = document.querySelector('.main-container');
            if (mainContainer) {
                mainContainer.style.display = 'none';
            }

            // Create or get messages container
            let messagesContainer = document.getElementById('messages-page-container');
            if (!messagesContainer) {
                messagesContainer = document.createElement('div');
                messagesContainer.id = 'messages-page-container';
                document.body.appendChild(messagesContainer);
            }

            messagesContainer.style.display = 'block';
            messagesContainer.style.position = 'fixed';
            messagesContainer.style.top = '0';
            messagesContainer.style.left = '0';
            messagesContainer.style.width = '100%';
            messagesContainer.style.height = '100%';
            messagesContainer.style.zIndex = '1000';
            document.body.style.overflow = 'auto';

            // Load data
            await this.loadConversations();
            await this.loadOnlineUsers();

            // Render the messages page
            this.renderMessagesPage(messagesContainer);
            console.log('Messages page rendered successfully');

        } catch (error) {
            console.error('Failed to load messages page:', error);
        }
    }

    async loadConversations() {
        try {
            // In real implementation, this would call an API to get user's conversations
            this.conversations = [
                {
                    userId: 'user1',
                    userName: 'Sarah Johnson',
                    userEmail: 'sarah.johnson@example.com',
                    online: true,
                    unread: true,
                    lastMessage: {
                        content: 'Hey, can you review my latest PR when you get a chance?',
                        created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString()
                    }
                },
                {
                    userId: 'user2',
                    userName: 'Alex Chen',
                    userEmail: 'alex.chen@example.com',
                    online: false,
                    unread: false,
                    lastMessage: {
                        content: 'Thanks for the help with the database optimization!',
                        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
                    }
                },
                {
                    userId: 'user3',
                    userName: 'Maria Rodriguez',
                    userEmail: 'maria.rodriguez@example.com',
                    online: true,
                    unread: false,
                    lastMessage: {
                        content: 'The UI mockups look great! Ready for implementation.',
                        created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
                    }
                }
            ];
        } catch (error) {
            console.error('Failed to load conversations:', error);
            this.conversations = [];
        }
    }

    async loadOnlineUsers() {
        try {
            // For demo purposes, add sample online users
            this.onlineUsers = [
                {
                    id: 'user1',
                    email: 'sarah.johnson@example.com'
                },
                {
                    id: 'user2',
                    email: 'alex.chen@example.com'
                },
                {
                    id: 'user3',
                    email: 'maria.rodriguez@example.com'
                },
                {
                    id: 'user4',
                    email: 'david.kim@example.com'
                }
            ];
        } catch (error) {
            console.error('Failed to load online users:', error);
            this.onlineUsers = [];
        }
    }

    async loadMessages(userId) {
        try {
            this.messages = await api.getDirectMessages(userId);
        } catch (error) {
            console.error('Failed to load messages:', error);
            this.messages = [];
        }
    }

    renderMessagesPage(container) {
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
                            <h1 style="margin: 0 0 4px 0; font-size: 28px; font-weight: 700;">💬 Messages</h1>
                            <p style="margin: 0; color: #d0d0d0; font-size: 14px;">
                                Direct messaging with team members across all projects
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

                <!-- Messages Layout -->
                <div style="
                    display: grid;
                    grid-template-columns: 320px 1fr;
                    height: calc(100vh - 120px);
                    max-width: 1400px;
                    margin: 0 auto;
                ">
                    <!-- Left Sidebar: Conversations & Users -->
                    <div style="
                        background: rgba(0, 0, 0, 0.4);
                        border-right: 1px solid rgba(78, 205, 196, 0.2);
                        display: flex;
                        flex-direction: column;
                    ">
                        <!-- Search -->
                        <div style="padding: 20px;">
                            <input type="text" placeholder="🔍 Search conversations..." 
                                   onkeyup="messagesPageManager.searchConversations(this.value)"
                                   style="
                                       width: 100%;
                                       padding: 10px 12px;
                                       background: rgba(68, 68, 68, 0.3);
                                       border: 1px solid rgba(78, 205, 196, 0.3);
                                       border-radius: 8px;
                                       color: #ffffff;
                                       font-size: 14px;
                                   ">
                        </div>

                        <!-- Tabs -->
                        <div style="
                            display: flex;
                            border-bottom: 1px solid rgba(78, 205, 196, 0.2);
                            margin: 0 20px;
                        ">
                            <button onclick="messagesPageManager.switchTab('conversations')" 
                                    id="conversationsTab"
                                    style="
                                        flex: 1;
                                        padding: 12px;
                                        background: none;
                                        border: none;
                                        color: #4ecdc4;
                                        font-weight: 600;
                                        border-bottom: 2px solid #4ecdc4;
                                        cursor: pointer;
                                    ">Recent</button>
                            <button onclick="messagesPageManager.switchTab('users')" 
                                    id="usersTab"
                                    style="
                                        flex: 1;
                                        padding: 12px;
                                        background: none;
                                        border: none;
                                        color: #a0a0a0;
                                        font-weight: 600;
                                        cursor: pointer;
                                    ">Team</button>
                        </div>

                        <!-- Content Area -->
                        <div id="sidebarContent" style="flex: 1; overflow-y: auto;">
                            ${this.renderConversationsList()}
                        </div>
                    </div>

                    <!-- Right Side: Chat Area -->
                    <div style="
                        background: rgba(0, 0, 0, 0.2);
                        display: flex;
                        flex-direction: column;
                    ">
                        <div id="chatArea">
                            ${this.renderWelcomeMessage()}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderConversationsList() {
        if (this.conversations.length === 0) {
            return `
                <div style="
                    text-align: center;
                    padding: 40px 20px;
                    color: #d0d0d0;
                ">
                    <div style="font-size: 48px; margin-bottom: 16px;">💬</div>
                    <p style="margin: 0; font-size: 14px; font-style: italic;">
                        No recent conversations.<br>
                        Click on a team member to start chatting!
                    </p>
                </div>
            `;
        }

        return this.conversations.map(conversation => this.renderConversationItem(conversation)).join('');
    }

    renderConversationItem(conversation) {
        const lastMessageTime = new Date(conversation.lastMessage.created_at).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        });
        
        return `
            <div style="
                padding: 16px 20px;
                border-bottom: 1px solid rgba(78, 205, 196, 0.1);
                cursor: pointer;
                transition: all 0.2s ease;
                ${conversation.unread ? 'background: rgba(78, 205, 196, 0.05);' : ''}
            " onclick="messagesPageManager.openConversation('${conversation.userId}')"
               onmouseover="this.style.background='rgba(78, 205, 196, 0.1)'"
               onmouseout="this.style.background='${conversation.unread ? 'rgba(78, 205, 196, 0.05)' : 'transparent'}'">
                
                <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="
                        width: 40px;
                        height: 40px;
                        border-radius: 50%;
                        background: linear-gradient(135deg, #4ecdc4, #00b8a9);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: white;
                        font-weight: 600;
                        position: relative;
                    ">
                        ${conversation.userEmail.substring(0, 2).toUpperCase()}
                        ${conversation.online ? `
                            <div style="
                                position: absolute;
                                bottom: 0;
                                right: 0;
                                width: 12px;
                                height: 12px;
                                background: #4caf50;
                                border: 2px solid #1a1a1a;
                                border-radius: 50%;
                            "></div>
                        ` : ''}
                    </div>
                    
                    <div style="flex: 1; min-width: 0;">
                        <div style="
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                            margin-bottom: 4px;
                        ">
                            <span style="
                                color: #ffffff;
                                font-weight: 600;
                                font-size: 14px;
                                white-space: nowrap;
                                overflow: hidden;
                                text-overflow: ellipsis;
                            ">${conversation.userName}</span>
                            <span style="
                                color: #a0a0a0;
                                font-size: 11px;
                                white-space: nowrap;
                            ">${lastMessageTime}</span>
                        </div>
                        
                        <div style="
                            color: #d0d0d0;
                            font-size: 12px;
                            white-space: nowrap;
                            overflow: hidden;
                            text-overflow: ellipsis;
                        ">${conversation.lastMessage.content}</div>
                    </div>
                    
                    ${conversation.unread ? `
                        <div style="
                            width: 8px;
                            height: 8px;
                            background: #4ecdc4;
                            border-radius: 50%;
                        "></div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    renderUsersList() {
        if (this.onlineUsers.length === 0) {
            return `
                <div style="
                    text-align: center;
                    padding: 40px 20px;
                    color: #d0d0d0;
                ">
                    <div style="font-size: 48px; margin-bottom: 16px;">👥</div>
                    <p style="margin: 0; font-size: 14px; font-style: italic;">
                        No team members online.
                    </p>
                </div>
            `;
        }

        return this.onlineUsers.map(user => this.renderUserItem(user)).join('');
    }

    renderUserItem(user) {
        return `
            <div style="
                padding: 16px 20px;
                border-bottom: 1px solid rgba(78, 205, 196, 0.1);
                cursor: pointer;
                transition: all 0.2s ease;
            " onclick="messagesPageManager.startConversation('${user.id}', '${user.email}')"
               onmouseover="this.style.background='rgba(78, 205, 196, 0.1)'"
               onmouseout="this.style.background='transparent'">
                
                <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="
                        width: 40px;
                        height: 40px;
                        border-radius: 50%;
                        background: linear-gradient(135deg, #4ecdc4, #00b8a9);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: white;
                        font-weight: 600;
                        position: relative;
                    ">
                        ${user.email.substring(0, 2).toUpperCase()}
                        <div style="
                            position: absolute;
                            bottom: 0;
                            right: 0;
                            width: 12px;
                            height: 12px;
                            background: #4caf50;
                            border: 2px solid #1a1a1a;
                            border-radius: 50%;
                        "></div>
                    </div>
                    
                    <div style="flex: 1; min-width: 0;">
                        <div style="
                            color: #ffffff;
                            font-weight: 600;
                            font-size: 14px;
                            margin-bottom: 2px;
                            white-space: nowrap;
                            overflow: hidden;
                            text-overflow: ellipsis;
                        ">${user.email.split('@')[0]}</div>
                        
                        <div style="
                            color: #4ecdc4;
                            font-size: 12px;
                            white-space: nowrap;
                            overflow: hidden;
                            text-overflow: ellipsis;
                        ">${user.email}</div>
                    </div>
                    
                    <div style="
                        color: #4caf50;
                        font-size: 10px;
                        font-weight: 600;
                    ">ONLINE</div>
                </div>
            </div>
        `;
    }

    renderWelcomeMessage() {
        return `
            <div style="
                display: flex;
                align-items: center;
                justify-content: center;
                height: 100%;
                text-align: center;
                color: #d0d0d0;
            ">
                <div>
                    <div style="font-size: 80px; margin-bottom: 24px;">💬</div>
                    <h2 style="margin: 0 0 16px 0; color: #ffffff; font-size: 24px;">Welcome to HIVE Messages</h2>
                    <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; max-width: 400px;">
                        Connect with team members across all projects. Select a conversation from the sidebar or start a new chat.
                    </p>
                    <div style="
                        background: rgba(78, 205, 196, 0.1);
                        border: 1px solid rgba(78, 205, 196, 0.2);
                        border-radius: 12px;
                        padding: 20px;
                        max-width: 350px;
                        margin: 0 auto;
                        text-align: left;
                    ">
                        <h4 style="margin: 0 0 12px 0; color: #4ecdc4; font-size: 16px;">💡 Quick Tips:</h4>
                        <ul style="margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.6;">
                            <li>Click on any team member to start chatting</li>
                            <li>Messages sync across all your devices</li>
                            <li>Use @ mentions for better collaboration</li>
                        </ul>
                    </div>
                </div>
            </div>
        `;
    }

    switchTab(tab) {
        // Update tab styling
        document.getElementById('conversationsTab').style.color = tab === 'conversations' ? '#4ecdc4' : '#a0a0a0';
        document.getElementById('conversationsTab').style.borderBottom = tab === 'conversations' ? '2px solid #4ecdc4' : 'none';
        document.getElementById('usersTab').style.color = tab === 'users' ? '#4ecdc4' : '#a0a0a0';
        document.getElementById('usersTab').style.borderBottom = tab === 'users' ? '2px solid #4ecdc4' : 'none';

        // Update content
        const content = document.getElementById('sidebarContent');
        if (tab === 'conversations') {
            content.innerHTML = this.renderConversationsList();
        } else {
            content.innerHTML = this.renderUsersList();
        }
    }

    async startConversation(userId, userEmail) {
        this.activeConversationId = userId;
        await this.loadMessages(userId);
        this.renderChatInterface(userId, userEmail);
    }

    async openConversation(userId) {
        // Similar to startConversation but for existing conversations
        this.activeConversationId = userId;
        await this.loadMessages(userId);
        // Would need additional data to get user email
        this.renderChatInterface(userId, 'User');
    }

    renderChatInterface(userId, userEmail) {
        const chatArea = document.getElementById('chatArea');
        chatArea.innerHTML = `
            <!-- Chat implementation would go here -->
            <div style="padding: 20px; text-align: center; color: #d0d0d0;">
                <p>Chat interface with ${userEmail} would be rendered here.</p>
                <p><em>This would include message history, input field, and real-time messaging.</em></p>
            </div>
        `;
    }

    searchConversations(query) {
        // Implementation for searching conversations
        console.log('Searching for:', query);
    }

    cleanup() {
        const container = document.getElementById('messages-page-container');
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
window.messagesPageManager = null;