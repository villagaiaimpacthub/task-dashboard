// Notifications Page Manager
class NotificationsPageManager {
    constructor(app) {
        this.app = app;
        this.notifications = [];
        this.unreadCount = 0;
    }

    async showNotificationsPage() {
        console.log('showNotificationsPage called');
        try {
            // Hide main container
            const mainContainer = document.querySelector('.main-container');
            if (mainContainer) {
                mainContainer.style.display = 'none';
            }

            // Create or get notifications container
            let notificationsContainer = document.getElementById('notifications-page-container');
            if (!notificationsContainer) {
                notificationsContainer = document.createElement('div');
                notificationsContainer.id = 'notifications-page-container';
                document.body.appendChild(notificationsContainer);
            }

            notificationsContainer.style.display = 'block';
            notificationsContainer.style.position = 'fixed';
            notificationsContainer.style.top = '0';
            notificationsContainer.style.left = '0';
            notificationsContainer.style.width = '100%';
            notificationsContainer.style.height = '100%';
            notificationsContainer.style.zIndex = '1000';
            document.body.style.overflow = 'auto';

            // Load notifications
            await this.loadNotifications();

            // Render the notifications page
            this.renderNotificationsPage(notificationsContainer);
            console.log('Notifications page rendered successfully');

        } catch (error) {
            console.error('Failed to load notifications page:', error);
        }
    }

    async loadNotifications() {
        try {
            // For now, simulate notifications data
            // In the future, this would call an API endpoint to get user's notifications
            this.notifications = [
                {
                    id: '1',
                    type: 'task_assigned',
                    title: 'New Task Assigned',
                    message: 'You have been assigned to "Implement user authentication system"',
                    project: 'HIVE Backend Development',
                    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
                    read: false
                },
                {
                    id: '2',
                    type: 'project_updated',
                    title: 'Project Status Updated',
                    message: 'HIVE Task Management System project has been updated with new requirements',
                    project: 'HIVE Frontend Development',
                    created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
                    read: false
                },
                {
                    id: '3',
                    type: 'task_completed',
                    title: 'Task Completed',
                    message: 'Your task "Database schema design" has been marked as completed',
                    project: 'HIVE Backend Development',
                    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
                    read: true
                },
                {
                    id: '4',
                    type: 'milestone_completed',
                    title: 'Milestone Achieved',
                    message: 'Phase 1 milestone completed! Great work on the authentication system.',
                    project: 'HIVE Backend Development',
                    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                    read: true
                },
                {
                    id: '5',
                    type: 'team_message',
                    title: 'Team Update',
                    message: 'New team member joined the project. Welcome Sarah!',
                    project: 'HIVE Frontend Development',
                    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
                    read: true
                }
            ];

            this.unreadCount = this.notifications.filter(n => !n.read).length;

        } catch (error) {
            console.error('Failed to load notifications:', error);
            this.notifications = [];
            this.unreadCount = 0;
        }
    }

    renderNotificationsPage(container) {
        const currentUser = this.app.currentUser;
        
        container.innerHTML = `
            <div class="page-container" style="
                background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
                min-height: 100vh;
                padding: 70px 0 0 0;
                color: #ffffff;
            ">
                <div style="max-width: 1000px; margin: 0 auto; padding: 32px;">
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
                            <h1 style="margin: 0 0 8px 0; font-size: 32px; font-weight: 700;">🔔 Notifications</h1>
                            <p style="margin: 0; color: #d0d0d0; font-size: 16px;">
                                Stay updated on task assignments and project updates
                                ${this.unreadCount > 0 ? `• ${this.unreadCount} unread` : '• All caught up!'}
                            </p>
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

                    <!-- Notification Actions -->
                    ${this.notifications.length > 0 ? `
                        <div style="
                            display: flex;
                            gap: 16px;
                            margin-bottom: 24px;
                        ">
                            <button onclick="notificationsPageManager.markAllAsRead()" style="
                                background: rgba(76, 175, 80, 0.15);
                                color: #4caf50;
                                border: 1px solid rgba(76, 175, 80, 0.3);
                                padding: 8px 16px;
                                border-radius: 8px;
                                cursor: pointer;
                                font-size: 14px;
                                transition: all 0.3s ease;
                            " onmouseover="this.style.background='rgba(76, 175, 80, 0.25)'" 
                               onmouseout="this.style.background='rgba(76, 175, 80, 0.15)'">
                                ✓ Mark All Read
                            </button>
                            
                            <select onchange="notificationsPageManager.filterNotifications(this.value)" style="
                                background: rgba(68, 68, 68, 0.3);
                                color: #ffffff;
                                border: 1px solid rgba(78, 205, 196, 0.3);
                                padding: 8px 12px;
                                border-radius: 8px;
                                font-size: 14px;
                            ">
                                <option value="all">All Notifications</option>
                                <option value="unread">Unread Only</option>
                                <option value="task_assigned">Task Assignments</option>
                                <option value="task_updated">Task Updates</option>
                                <option value="project_updated">Project Updates</option>
                            </select>
                        </div>
                    ` : ''}

                    <!-- Notifications List -->
                    <div style="
                        background: rgba(0, 0, 0, 0.4);
                        border: 1px solid rgba(78, 205, 196, 0.2);
                        border-radius: 16px;
                        padding: 24px;
                    ">
                        ${this.notifications.length > 0 ? 
                            this.renderNotifications() :
                            this.renderEmptyState()
                        }
                    </div>
                </div>
            </div>
        `;
    }

    renderNotifications() {
        return this.notifications.map(notification => this.renderNotification(notification)).join('');
    }

    renderNotification(notification) {
        const timeAgo = this.getTimeAgo(new Date(notification.created_at));
        const typeInfo = this.getNotificationTypeInfo(notification.type);
        
        return `
            <div style="
                background: ${notification.read ? 'rgba(68, 68, 68, 0.2)' : 'rgba(78, 205, 196, 0.1)'};
                border: 1px solid ${notification.read ? 'rgba(68, 68, 68, 0.3)' : 'rgba(78, 205, 196, 0.3)'};
                border-radius: 12px;
                padding: 20px;
                margin-bottom: 16px;
                transition: all 0.3s ease;
                cursor: pointer;
                position: relative;
            " onclick="notificationsPageManager.markAsRead('${notification.id}')"
               onmouseover="this.style.borderColor='rgba(78, 205, 196, 0.5)'"
               onmouseout="this.style.borderColor='${notification.read ? 'rgba(68, 68, 68, 0.3)' : 'rgba(78, 205, 196, 0.3)'}'">
                
                <!-- Unread indicator -->
                ${!notification.read ? `
                    <div style="
                        position: absolute;
                        top: 16px;
                        right: 16px;
                        width: 8px;
                        height: 8px;
                        background: #4ecdc4;
                        border-radius: 50%;
                    "></div>
                ` : ''}
                
                <div style="display: flex; align-items: flex-start; gap: 16px;">
                    <div style="
                        font-size: 24px;
                        margin-top: 4px;
                        min-width: 32px;
                        text-align: center;
                    ">${typeInfo.icon}</div>
                    
                    <div style="flex: 1;">
                        <div style="
                            display: flex;
                            justify-content: space-between;
                            align-items: flex-start;
                            margin-bottom: 8px;
                        ">
                            <h3 style="
                                margin: 0;
                                color: #ffffff;
                                font-size: 16px;
                                font-weight: 600;
                            ">${notification.title}</h3>
                            <span style="
                                color: #a0a0a0;
                                font-size: 12px;
                                white-space: nowrap;
                                margin-left: 16px;
                            ">${timeAgo}</span>
                        </div>
                        
                        <p style="
                            margin: 0 0 8px 0;
                            color: #d0d0d0;
                            font-size: 14px;
                            line-height: 1.5;
                        ">${notification.message}</p>
                        
                        ${notification.project ? `
                            <div style="
                                color: #4ecdc4;
                                font-size: 12px;
                                font-weight: 500;
                            ">📂 ${notification.project}</div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    renderEmptyState() {
        return `
            <div style="
                text-align: center;
                padding: 60px 20px;
                color: #d0d0d0;
            ">
                <div style="font-size: 64px; margin-bottom: 24px;">🔔</div>
                <h3 style="margin: 0 0 16px 0; color: #ffffff; font-size: 24px;">All caught up!</h3>
                <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6;">
                    You have no notifications at the moment.<br>
                    Task assignments, project updates, and team messages will appear here.
                </p>
                
                <div style="
                    background: rgba(78, 205, 196, 0.1);
                    border: 1px solid rgba(78, 205, 196, 0.2);
                    border-radius: 12px;
                    padding: 20px;
                    margin: 32px auto 0;
                    max-width: 400px;
                    text-align: left;
                ">
                    <h4 style="margin: 0 0 12px 0; color: #4ecdc4; font-size: 16px;">📋 What triggers notifications:</h4>
                    <ul style="margin: 0; padding-left: 20px; color: #d0d0d0; font-size: 14px; line-height: 1.6;">
                        <li>Task assignments to you</li>
                        <li>Project status updates</li>
                        <li>Milestone completions</li>
                        <li>Team collaboration requests</li>
                        <li>Important system announcements</li>
                    </ul>
                </div>
            </div>
        `;
    }

    getNotificationTypeInfo(type) {
        const typeMap = {
            'task_assigned': { icon: '📋', color: '#4ecdc4' },
            'task_updated': { icon: '🔄', color: '#ff9800' },
            'task_completed': { icon: '✅', color: '#4caf50' },
            'project_updated': { icon: '📂', color: '#2196f3' },
            'milestone_completed': { icon: '🎯', color: '#9c27b0' },
            'team_message': { icon: '💬', color: '#607d8b' },
            'system': { icon: '⚙️', color: '#795548' }
        };
        
        return typeMap[type] || { icon: '📢', color: '#78909c' };
    }

    getTimeAgo(date) {
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        
        return date.toLocaleDateString();
    }

    markAsRead(notificationId) {
        const notification = this.notifications.find(n => n.id === notificationId);
        if (notification && !notification.read) {
            notification.read = true;
            this.unreadCount--;
            // In real implementation, would call API to mark as read
            this.renderNotificationsPage(document.getElementById('notifications-page-container'));
        }
    }

    markAllAsRead() {
        this.notifications.forEach(notification => {
            notification.read = true;
        });
        this.unreadCount = 0;
        // In real implementation, would call API to mark all as read
        this.renderNotificationsPage(document.getElementById('notifications-page-container'));
    }

    filterNotifications(filterType) {
        // In real implementation, would filter and re-render notifications
        console.log('Filtering notifications by:', filterType);
    }

    cleanup() {
        const container = document.getElementById('notifications-page-container');
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
window.notificationsPageManager = null;