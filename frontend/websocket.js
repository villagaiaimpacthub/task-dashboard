// WebSocket Manager
class WebSocketManager {
    constructor() {
        this.ws = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000;
        this.isConnecting = false;
        this.messageHandlers = [];
    }

    // Connect to WebSocket
    connect(token) {
        if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
            return;
        }

        this.isConnecting = true;
        this.updateConnectionStatus('connecting', 'Connecting...');

        try {
            // Use same dynamic IP detection as contractApi
            let backendUrl;
            if (window.devConfig && window.devConfig.backendUrl) {
                backendUrl = window.devConfig.backendUrl;
            } else {
                // Fallback - should not happen if dev-connect is used
                backendUrl = window.location.hostname === 'localhost' 
                    ? 'http://localhost:8000' 
                    : `http://${window.location.hostname}:8000`;
            }
            
            // Check if backend supports real WebSocket
            // Current backend (simple_backend.py) doesn't support real WebSocket
            // Following development rules: Remove fake features rather than simulate
            
            console.log('WebSocket not available - backend does not support real WebSocket protocol');
            console.log('Backend URL:', backendUrl);
            
            // Set status to indicate WebSocket is not available
            this.updateConnectionStatus('unavailable', 'Real-time features unavailable');
            this.isConnecting = false;
            return;
            
            // WebSocket event handlers removed - not applicable when WebSocket unavailable

        } catch (error) {
            console.error('Failed to create WebSocket connection:', error);
            this.isConnecting = false;
            this.updateConnectionStatus('disconnected', 'Failed to connect');
        }
    }
    

    // Schedule reconnection attempt
    scheduleReconnect(token) {
        this.reconnectAttempts++;
        const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
        
        console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
        this.updateConnectionStatus('connecting', `Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        
        setTimeout(() => {
            this.connect(token);
        }, delay);
    }

    // Disconnect WebSocket
    disconnect() {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.close(1000, 'User initiated disconnect');
        }
        this.ws = null;
        
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
        }

        this.updateConnectionStatus('disconnected', 'Disconnected');
    }

    // Send message
    send(message) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            try {
                this.ws.send(JSON.stringify(message));
                console.log('WebSocket message sent:', message);
                return true;
            } catch (error) {
                console.error('Failed to send WebSocket message:', error);
                return false;
            }
        } else {
            console.warn('WebSocket not connected, cannot send message');
            return false;
        }
    }

    // Send ping message
    sendPing() {
        this.send({
            type: 'ping',
            payload: { timestamp: Date.now() }
        });
    }

    // Setup periodic ping
    setupPingInterval() {
        this.pingInterval = setInterval(() => {
            this.sendPing();
        }, 30000); // Ping every 30 seconds
    }

    // Send chat message
    sendChatMessage(message) {
        return this.send({
            type: 'chat_message',
            payload: { message }
        });
    }

    // Handle incoming messages
    handleMessage(message) {
        console.log('WebSocket message received:', message);
        
        // Handle specific message types
        switch (message.type) {
            case 'pong':
                // Handle pong response
                break;
                
            case 'chat_message':
                this.notifyHandlers('chat', message);
                break;
                
            case 'task_status_update':
                this.notifyHandlers('task_update', message);
                // Refresh tasks when status changes
                if (window.app && window.app.refreshTasks) {
                    window.app.refreshTasks();
                }
                break;
                
            case 'task_assignment_update':
                this.notifyHandlers('task_assignment', message);
                // Refresh tasks when assignments change
                if (window.app && window.app.refreshTasks) {
                    window.app.refreshTasks();
                }
                break;
                
            case 'task_chat_message':
                this.notifyHandlers('task_chat', message);
                // Handle task chat messages
                if (window.app && window.app.handleIncomingChatMessage) {
                    window.app.handleIncomingChatMessage(message);
                }
                break;
                
            case 'direct_message':
                this.notifyHandlers('direct_message', message);
                // TODO: Handle direct messages when DM feature is implemented
                break;
                
            default:
                console.log('Unknown message type:', message.type);
        }
        
        // Notify all handlers
        this.notifyHandlers('message', message);
    }

    // Add message handler
    addMessageHandler(handler) {
        this.messageHandlers.push(handler);
    }

    // Remove message handler
    removeMessageHandler(handler) {
        const index = this.messageHandlers.indexOf(handler);
        if (index > -1) {
            this.messageHandlers.splice(index, 1);
        }
    }

    // Notify all handlers
    notifyHandlers(type, data) {
        this.messageHandlers.forEach(handler => {
            try {
                handler(type, data);
            } catch (error) {
                console.error('Message handler error:', error);
            }
        });
    }

    // Update connection status in UI
    updateConnectionStatus(status, text) {
        const indicator = document.getElementById('statusIndicator');
        const statusText = document.getElementById('statusText');
        
        if (indicator && statusText) {
            indicator.className = `status-indicator ${status}`;
            statusText.textContent = text;
        }
    }

    // Check if connected
    isConnected() {
        return this.ws && this.ws.readyState === WebSocket.OPEN;
    }
}

// Create global WebSocket manager instance
const wsManager = new WebSocketManager();