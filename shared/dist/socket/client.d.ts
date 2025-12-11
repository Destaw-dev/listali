import { Socket } from 'socket.io-client';
import { ISocketUser, ISocketMessage, ISocketItemUpdate, ISocketListUpdate, ISocketUserStatus } from '../types';
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
export declare class SocketClient {
    private serverURL;
    private authToken?;
    private socket;
    private handlers;
    private isConnected;
    private reconnectAttempts;
    private maxReconnectAttempts;
    private reconnectDelay;
    constructor(serverURL?: string, authToken?: string | undefined);
    connect(userId: string, username: string, groups: string[]): Promise<void>;
    disconnect(): void;
    private setupEventListeners;
    setEventHandlers(handlers: SocketEventHandlers): void;
    joinGroup(groupId: string): void;
    leaveGroup(groupId: string): void;
    sendMessage(groupId: string, content: string, messageType?: 'text' | 'image' | 'system', metadata?: Record<string, any>): void;
    updateStatus(status: 'shopping' | 'online' | 'away', location?: {
        latitude: number;
        longitude: number;
    }): void;
    startShoppingSession(groupId: string, listId: string, location?: {
        latitude: number;
        longitude: number;
    }): void;
    endShoppingSession(): void;
    updateItemStatus(itemId: string, action: 'purchase' | 'unpurchase' | 'not_available', actualPrice?: number): void;
    getConnectionStatus(): boolean;
    getSocket(): Socket | null;
    updateAuthToken(token: string): void;
}
export declare const socketClient: SocketClient;
export default SocketClient;
//# sourceMappingURL=client.d.ts.map