"use client";

import { io, Socket } from "socket.io-client";
import { useAuthStore } from "../store/authStore";
import type { 
  IWebSocketEvents, 
  IItem, 
  IUserSimple, 
  IChatMessage,
} from '../types';

export type WebSocketEvents = IWebSocketEvents;
export type Item = IItem;
export type User = IUserSimple;
export type ChatMessage = IChatMessage;

class WebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isConnected = false;
  private isRefreshing = false;
  private refreshPromise: Promise<string | null> | null = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private listeners = new Map<string, Set<any>>();

  private isClient(): boolean {
    return typeof window !== "undefined";
  }

  private async refreshAccessTokenForSocket(): Promise<string | null> {
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    this.isRefreshing = true;
    this.refreshPromise = (async () => {
      try {
        const axios = (await import('axios')).default;
        const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        const response = await axios.post(
          `${baseURL}/api/auth/refresh`,
          {},
          { withCredentials: true }
        );

        if (response.data.success && response.data.data?.accessToken) {
          const newAccessToken = response.data.data.accessToken;
          useAuthStore.getState().setAccessToken(newAccessToken);
          return newAccessToken;
        }

        return null;
      } catch (error) {
        console.error('Failed to refresh token for WebSocket:', error);
        return null;
      } finally {
        this.isRefreshing = false;
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  public connect() {
    if (!this.isClient()) return;

    if (this.socket && this.socket.connected) {
      return;
    }

    try {
      const accessToken = useAuthStore.getState().accessToken;
      
      if (!accessToken) {
        console.warn("Cannot connect WebSocket: No access token available");
        return;
      }

      const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "http://localhost:5000";

      useAuthStore.getState().setWebSocketConnecting(true);

      if (!this.socket) {
        this.socket = io(WS_URL, {
          auth: { token: accessToken },
          transports: ["websocket", "polling"],
          timeout: 10000,
          autoConnect: false,
          reconnection: false,
        });
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (this.socket as any).auth = { token: accessToken };
      }
      
      this.setupEventHandlers();

      if (!this.socket.connected) this.socket.connect();
    } catch (error) {
      console.error("Failed to connect to WebSocket:", error);
      useAuthStore.getState().setWebSocketError("Failed to connect to WebSocket");
      useAuthStore.getState().setWebSocketConnected(false);
    }
  }

  private setupEventHandlers() {
    if (!this.socket) return;

    this.socket.removeAllListeners();

    this.socket.on("connect", () => {
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.reconnectDelay = 1000;

      useAuthStore.getState().setWebSocketConnected(true);
      useAuthStore.getState().updateWebSocketLastConnected();
      
      this.reconnectListeners();
    });

    this.socket.on("disconnect", async (reason) => {
      this.isConnected = false;
      useAuthStore.getState().setWebSocketConnected(false);
      
      if (reason === "io server disconnect" || reason === "transport close") {
        const accessToken = useAuthStore.getState().accessToken;
        const isAuthenticated = useAuthStore.getState().isAuthenticated;
        
        if (accessToken && isAuthenticated) {
          const newToken = await this.refreshAccessTokenForSocket();
          if (newToken && this.socket) {
            // Socket.IO auth property is not in the type definitions, but it's a valid feature
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (this.socket as any).auth = { token: newToken };
            this.handleReconnect();
          } else {
            this.reconnectAttempts = 0;
          }
        } else {
          this.reconnectAttempts = 0;
        }
      } else {
        this.handleReconnect();
      }
    });

    this.socket.on("connect_error", async (error) => {
      const accessToken = useAuthStore.getState().accessToken;
      const isAuthenticated = useAuthStore.getState().isAuthenticated;
      
      const isAuthError = error.message?.includes('Authentication') || error.message?.includes('token');
      
      if (isAuthError && accessToken && isAuthenticated) {
        const newToken = await this.refreshAccessTokenForSocket();
        if (newToken && this.socket) {
          (this.socket as Socket & { auth?: { token: string } }).auth = { token: newToken };
          this.socket.disconnect();
          this.socket.connect();
        } else {
          useAuthStore.getState().setWebSocketError("Authentication failed");
          this.reconnectAttempts = 0;
        }
      } else if (accessToken && isAuthenticated) {
        console.error("WebSocket connection error:", error);
        useAuthStore.getState().setWebSocketError("Connection error");
        this.handleReconnect();
      } else {
        this.reconnectAttempts = 0;
        useAuthStore.getState().setWebSocketConnected(false);
      }
    });

    this.setupDomainListeners();
  }

  private setupDomainListeners() {
    if (!this.socket) return;

  }

  private handleReconnect() {
    const accessToken = useAuthStore.getState().accessToken;
    const isAuthenticated = useAuthStore.getState().isAuthenticated;
    
    if (!accessToken || !isAuthenticated) {
      this.reconnectAttempts = 0;
      return;
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      useAuthStore.getState().setWebSocketError("Failed to reconnect after multiple attempts");
      return;
    }
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    setTimeout(() => {
      const accessToken = useAuthStore.getState().accessToken;
      const isAuthenticated = useAuthStore.getState().isAuthenticated;
      
      if (!this.isConnected && accessToken && isAuthenticated) {
        this.connect();
      } else if (!accessToken || !isAuthenticated) {
        this.reconnectAttempts = 0;
      }
    }, delay);
  }

  private reconnectListeners() {
    this.listeners.forEach((listeners, event) => {
      listeners.forEach((listener) => {
        if (this.socket) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.socket.on(event as string, listener as any);
        }
      });
    });
  }

  public isSocketConnected(): boolean {
    if (!this.isClient()) return false;
    return !!(this.socket && this.socket.connected && this.isConnected);
  }

  public connectManually(): void {
    if (this.isClient()) this.connect();
  }

  public disconnect(): void {
    if (!this.isClient()) return;
    
    // Stop any reconnection attempts
    this.reconnectAttempts = 0;
    
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.listeners.clear();
    }
    
    useAuthStore.getState().setWebSocketConnected(false);
    useAuthStore.getState().setWebSocketConnecting(false);
  }

  public getSocket(): Socket | null {
    return this.socket;
  }

  public on<K extends keyof IWebSocketEvents>(event: K, listener: (data: IWebSocketEvents[K]) => void): () => void {
    if (!this.isClient()) return () => {};
    
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(listener);
    
    if (this.socket && this.isConnected) {
      // Socket.io-client's on method accepts string events with generic listeners
      this.socket.on(event as string, listener as (data: unknown) => void);
    }
    
    return () => {
      const set = this.listeners.get(event);
      if (set) set.delete(listener);
      
      if (this.socket) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this.socket.off(event as string, listener as any);
      }
    };
  }
}

const WS_SINGLETON_KEY = "__WS_SINGLETON__";

function createService() {
  return new WebSocketService();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const websocketService: WebSocketService =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any)[WS_SINGLETON_KEY] ||
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ((globalThis as any)[WS_SINGLETON_KEY] = createService());

export default websocketService;
