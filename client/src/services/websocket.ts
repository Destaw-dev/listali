"use client";

import { io, Socket } from "socket.io-client";
import { useAuthStore } from "@/store/authStore";
import type { 
  IWebSocketEvents, 
  IItem, 
  IUserSimple, 
  IChatMessage,
} from '@/types';

// ============================================================================
// TYPES - IMPORTED FROM CLIENT TYPES
// ============================================================================
// All types are imported from client types

// Type aliases for backward compatibility
export type WebSocketEvents = IWebSocketEvents;
export type Item = IItem;
export type User = IUserSimple;
export type ChatMessage = IChatMessage;

// ============================================================================
// WEBSOCKET SERVICE
// ============================================================================

class WebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isConnected = false;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private listeners = new Map<string, Set<any>>();

  // --------- Utils ---------
  private isClient(): boolean {
    return typeof window !== "undefined" && typeof localStorage !== "undefined";
  }

  // --------- Connection ---------
  public connect() {
    if (!this.isClient()) return;

    // Guard: don't connect twice
    if (this.socket && this.socket.connected) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "http://localhost:5000";

      useAuthStore.getState().setWebSocketConnecting(true);

      if (!this.socket) {
        this.socket = io(WS_URL, {
          auth: { token },
          transports: ["websocket", "polling"],
          timeout: 10000,
          autoConnect: false,
          reconnection: true,
        });
      } else {
        (this.socket as any).auth = { token };
      }
      
      this.setupEventHandlers();

      if (!this.socket.connected) this.socket.connect();
    } catch (error) {
      console.error("Failed to connect to WebSocket:", error);
      useAuthStore.getState().setWebSocketError("Failed to connect to WebSocket");
      this.handleReconnect();
    }
  }

  private setupEventHandlers() {
    if (!this.socket) return;

    // Avoid duplicate handlers on reconnect/HMR
    this.socket.removeAllListeners();

    // Connection lifecycle
    this.socket.on("connect", () => {
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.reconnectDelay = 1000;

      useAuthStore.getState().setWebSocketConnected(true);
      useAuthStore.getState().updateWebSocketLastConnected();
      
      // Reconnect all existing listeners to Socket.IO
      this.reconnectListeners();
    });

    this.socket.on("disconnect", (reason) => {
      this.isConnected = false;
      if (reason === "io server disconnect" || reason === "transport close") {
        // Connection lost - this will be handled by the notification system
        this.handleReconnect();
      }
    });

    this.socket.on("connect_error", (error) => {
      console.error("WebSocket connection error:", error);
      useAuthStore.getState().setWebSocketError("Connection error");
      this.handleReconnect();
    });

    // Domain listeners
    this.setupDomainListeners();
  }

  private setupDomainListeners() {
    if (!this.socket) return;

  }

  private handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      useAuthStore.getState().setWebSocketError("Failed to reconnect after multiple attempts");
      return;
    }
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    setTimeout(() => {
      if (!this.isConnected) this.connect();
    }, delay);
  }

  private reconnectListeners() {
    // Reconnect all existing listeners to Socket.IO
    this.listeners.forEach((listeners, event) => {
      listeners.forEach((listener) => {
        if (this.socket) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.socket.on(event as string, listener as any);
        }
      });
    });
  }

  // -------------------- Public API --------------------
  public isSocketConnected(): boolean {
    if (!this.isClient()) return false;
    return !!(this.socket && this.socket.connected && this.isConnected);
  }

  public connectManually(): void {
    if (this.isClient()) this.connect();
  }

  public disconnect(): void {
    if (!this.isClient()) return;
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.listeners.clear();
    }
  }

  public getSocket(): Socket | null {
    return this.socket;
  }

  public on<K extends keyof IWebSocketEvents>(event: K, listener: (data: IWebSocketEvents[K]) => void): () => void {
    if (!this.isClient()) return () => {};
    
    // Add to local listeners map
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(listener);
    
    // Also connect directly to Socket.IO for real-time events
    if (this.socket && this.isConnected) {
      this.socket.on(event as string, listener as any);
    }
    
    return () => {
      // Remove from local map
      const set = this.listeners.get(event);
      if (set) set.delete(listener);
      
      // Remove from Socket.IO
      if (this.socket) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this.socket.off(event as string, listener as any);
      }
    };
  }
}

// -------------------- Singleton (HMR-safe) --------------------
const WS_SINGLETON_KEY = "__WS_SINGLETON__";

function createService() {
  return new WebSocketService();
}

// HMR-safe singleton pattern
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const websocketService: WebSocketService =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any)[WS_SINGLETON_KEY] ||
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ((globalThis as any)[WS_SINGLETON_KEY] = createService());

export default websocketService;
