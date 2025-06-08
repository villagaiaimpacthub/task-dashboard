// WebSocket Manager - Disabled
// Current backend (simple_backend.py) doesn't support real WebSocket protocol
// Following development rules: Remove fake features rather than simulate

class WebSocketManager {
    constructor() {
        this.ws = null;
        this.isConnecting = false;
        this.messageHandlers = [];
    }

    // Connect to WebSocket - Disabled
    connect(token) {
        console.log('WebSocket not available - backend does not support real WebSocket protocol');
        this.isConnecting = false;
        return;
    }

    // Disconnect - No-op since WebSocket is disabled
    disconnect() {
        console.log('WebSocket disconnect called but WebSocket is disabled');
    }

    // Add message handler - No-op since WebSocket is disabled
    addMessageHandler(handler) {
        // No-op - WebSocket is disabled
    }

    // Check if connected - Always false since WebSocket is disabled
    isConnected() {
        return false;
    }

    // Send message - No-op since WebSocket is disabled
    send(message) {
        console.log('WebSocket send called but WebSocket is disabled');
    }
}

// Create global instance for compatibility
const wsManager = new WebSocketManager();