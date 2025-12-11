import { io } from 'socket.io-client';
export class SocketClient {
    constructor(serverURL = process.env.SOCKET_URL || 'http://localhost:5000', authToken) {
        this.serverURL = serverURL;
        this.authToken = authToken;
        this.socket = null;
        this.handlers = {};
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000;
    }
    // Connect to socket server
    connect(userId, username, groups) {
        return new Promise((resolve, reject) => {
            if (this.socket?.connected) {
                resolve();
                return;
            }
            this.socket = io(this.serverURL, {
                auth: {
                    token: this.authToken
                },
                transports: ['websocket', 'polling'],
                timeout: 20000,
                forceNew: true
            });
            this.setupEventListeners();
            this.socket.on('connect', () => {
                this.isConnected = true;
                this.reconnectAttempts = 0;
                // Join user to their groups
                if (groups.length > 0) {
                    this.socket?.emit('join_groups', { groups });
                }
                this.handlers.onConnect?.();
                resolve();
            });
            this.socket.on('connect_error', (error) => {
                this.isConnected = false;
                this.handlers.onError?.(error);
                reject(error);
            });
        });
    }
    // Disconnect from socket server
    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.isConnected = false;
        }
    }
    // Setup event listeners
    setupEventListeners() {
        if (!this.socket)
            return;
        this.socket.on('disconnect', (reason) => {
            this.isConnected = false;
            this.handlers.onDisconnect?.(reason);
            // Attempt to reconnect if not manually disconnected
            if (reason !== 'io client disconnect' && this.reconnectAttempts < this.maxReconnectAttempts) {
                setTimeout(() => {
                    this.reconnectAttempts++;
                    this.socket?.connect();
                }, this.reconnectDelay * this.reconnectAttempts);
            }
        });
        this.socket.on('user_joined', (user) => {
            this.handlers.onUserJoined?.(user);
        });
        this.socket.on('user_left', (userId) => {
            this.handlers.onUserLeft?.(userId);
        });
        this.socket.on('message_received', (message) => {
            this.handlers.onMessageReceived?.(message);
        });
        this.socket.on('item_updated', (update) => {
            this.handlers.onItemUpdated?.(update);
        });
        this.socket.on('list_updated', (update) => {
            this.handlers.onListUpdated?.(update);
        });
        this.socket.on('user_status_changed', (status) => {
            this.handlers.onUserStatusChanged?.(status);
        });
        this.socket.on('error', (error) => {
            this.handlers.onError?.(error);
        });
    }
    // Set event handlers
    setEventHandlers(handlers) {
        this.handlers = { ...this.handlers, ...handlers };
    }
    // Join a group
    joinGroup(groupId) {
        this.socket?.emit('join_group', { groupId });
    }
    // Leave a group
    leaveGroup(groupId) {
        this.socket?.emit('leave_group', { groupId });
    }
    // Send a message
    sendMessage(groupId, content, messageType = 'text', metadata) {
        this.socket?.emit('send_message', {
            groupId,
            content,
            messageType,
            metadata
        });
    }
    // Update user status
    updateStatus(status, location) {
        this.socket?.emit('update_status', { status, location });
    }
    // Start shopping session
    startShoppingSession(groupId, listId, location) {
        this.socket?.emit('start_shopping', { groupId, listId, location });
    }
    // End shopping session
    endShoppingSession() {
        this.socket?.emit('end_shopping');
    }
    // Update item status
    updateItemStatus(itemId, action, actualPrice) {
        this.socket?.emit('update_item', { itemId, action, actualPrice });
    }
    // Get connection status
    getConnectionStatus() {
        return this.isConnected;
    }
    // Get socket instance (for advanced usage)
    getSocket() {
        return this.socket;
    }
    // Update auth token
    updateAuthToken(token) {
        this.authToken = token;
        if (this.socket) {
            this.socket.auth = { token };
        }
    }
}
// Export singleton instance
export const socketClient = new SocketClient();
// Export for platform-specific implementations
export default SocketClient;
//# sourceMappingURL=client.js.map