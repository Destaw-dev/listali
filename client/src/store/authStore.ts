// store/authStore.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { persist } from 'zustand/middleware';
import type { User } from '@/types';

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  lastLoginTime: number | null;
  
  // WebSocket state
  websocket: {
    isConnected: boolean;
    connectionError: string | null;
    lastConnectedAt: Date | null;
    isConnecting: boolean;
  };

  setUser: (user: User) => void;
  clearUser: () => void;
  setIsLoading: (loading: boolean) => void;
  setIsInitialized: (value: boolean) => void;
  setError: (value: string | null) => void;
  
  // WebSocket actions
  setWebSocketConnected: (connected: boolean) => void;
  setWebSocketError: (error: string | null) => void;
  setWebSocketConnecting: (connecting: boolean) => void;
  updateWebSocketLastConnected: () => void;
}

export const useAuthStore = create<AuthStore>()(
  devtools(
    persist(
      (set) => ({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        isInitialized: false,
        error: null,
        lastLoginTime: null,
        
        // WebSocket state
        websocket: {
          isConnected: false,
          connectionError: null,
          lastConnectedAt: null,
          isConnecting: false,
        },

        setUser: (user) =>
          set({
            user,
            isAuthenticated: true,
            error: null,
            lastLoginTime: Date.now(),
            isInitialized: true,
          }),

        clearUser: () => {
          // Clear token from localStorage
          if (typeof window !== 'undefined') {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
          }
          
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
            lastLoginTime: null,
            isInitialized: true,
            // Also clear WebSocket state when user logs out
            websocket: {
              isConnected: false,
              connectionError: null,
              lastConnectedAt: null,
              isConnecting: false,
            },
          });
        },

        setIsLoading: (loading) => set({ isLoading: loading }),
        setIsInitialized: (val) => set({ isInitialized: val }),
        setError: (err) => set({ error: err }),
        
        setWebSocketConnected: (connected) =>
          set((state) => ({
            websocket: {
              ...state.websocket,
              isConnected: connected,
              connectionError: connected ? null : state.websocket.connectionError,
              isConnecting: false,
            },
          })),

        setWebSocketError: (error) =>
          set((state) => ({
            websocket: {
              ...state.websocket,
              connectionError: error,
              isConnecting: false,
            },
          })),

        setWebSocketConnecting: (connecting) =>
          set((state) => ({
            websocket: {
              ...state.websocket,
              isConnecting: connecting,
            },
          })),

        updateWebSocketLastConnected: () =>
          set((state) => ({
            websocket: {
              ...state.websocket,
              lastConnectedAt: new Date(),
            },
          })),
      }),
      {
        name: 'auth-storage',
        partialize: (state) => ({
          user: state.user,
          isAuthenticated: state.isAuthenticated,
          lastLoginTime: state.lastLoginTime,
        }),
      }
    )
  )
);
