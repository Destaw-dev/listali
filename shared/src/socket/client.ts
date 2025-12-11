import { io, Socket } from 'socket.io-client';
import {
  ISocketUser,
  ISocketMessage,
  ISocketItemUpdate,
  ISocketListUpdate,
  ISocketUserStatus
} from '../types';

export interface SocketEventHandlers {
  onConnect?: () => void;
  onDisconnect?: (reason: string) => void;
  onUserJoined?: (user: ISocketUser) => void;
  onUserLeft?: (userId: string) => void;
  onMessageReceived?: (message: ISocketMessage) => void;
  onItemUpdated?: (update: ISocketItemUpdate) => void;
  onListUpdated?: (update: ISocketListUpdate) => void;
  onUserStatusChanged?: (status: ISocketUserStatus) => void;
  onError?: (error: any) => void;
}

export class SocketClient {
  private socket: Socket | null = null;
  private handlers: SocketEventHandlers = {};
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  constructor(
    private serverURL: string = process.env.SOCKET_URL || 'http://localhost:5000',
    private authToken?: string
  ) {}

  // Connect to socket server
  connect(userId: string, username: string, groups: string[]): Promise<void> {
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
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Setup event listeners
  private setupEventListeners(): void {
    if (!this.socket) return;

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

    this.socket.on('user_joined', (user: ISocketUser) => {
      this.handlers.onUserJoined?.(user);
    });

    this.socket.on('user_left', (userId: string) => {
      this.handlers.onUserLeft?.(userId);
    });

    this.socket.on('message_received', (message: ISocketMessage) => {
      this.handlers.onMessageReceived?.(message);
    });

    this.socket.on('item_updated', (update: ISocketItemUpdate) => {
      this.handlers.onItemUpdated?.(update);
    });

    this.socket.on('list_updated', (update: ISocketListUpdate) => {
      this.handlers.onListUpdated?.(update);
    });

    this.socket.on('user_status_changed', (status: ISocketUserStatus) => {
      this.handlers.onUserStatusChanged?.(status);
    });

    this.socket.on('error', (error: any) => {
      this.handlers.onError?.(error);
    });
  }

  // Set event handlers
  setEventHandlers(handlers: SocketEventHandlers): void {
    this.handlers = { ...this.handlers, ...handlers };
  }

  // Join a group
  joinGroup(groupId: string): void {
    this.socket?.emit('join_group', { groupId });
  }

  // Leave a group
  leaveGroup(groupId: string): void {
    this.socket?.emit('leave_group', { groupId });
  }

  // Send a message
  sendMessage(groupId: string, content: string, messageType: 'text' | 'image' | 'system' = 'text', metadata?: Record<string, any>): void {
    this.socket?.emit('send_message', {
      groupId,
      content,
      messageType,
      metadata
    });
  }

  // Update user status
  updateStatus(status: 'shopping' | 'online' | 'away', location?: { latitude: number; longitude: number }): void {
    this.socket?.emit('update_status', { status, location });
  }

  // Start shopping session
  startShoppingSession(groupId: string, listId: string, location?: { latitude: number; longitude: number }): void {
    this.socket?.emit('start_shopping', { groupId, listId, location });
  }

  // End shopping session
  endShoppingSession(): void {
    this.socket?.emit('end_shopping');
  }

  // Update item status
  updateItemStatus(itemId: string, action: 'purchase' | 'unpurchase' | 'not_available', actualPrice?: number): void {
    this.socket?.emit('update_item', { itemId, action, actualPrice });
  }

  // Get connection status
  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  // Get socket instance (for advanced usage)
  getSocket(): Socket | null {
    return this.socket;
  }

  // Update auth token
  updateAuthToken(token: string): void {
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