import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { persist } from 'zustand/middleware';
import type { User } from '../types';
import { apiClient } from '../lib/api';

interface AuthStore {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  lastLoginTime: number | null;
  authReady: boolean;
  isBootstrapping: boolean;
  
  websocket: {
    isConnected: boolean;
    connectionError: string | null;
    lastConnectedAt: Date | null;
    isConnecting: boolean;
  };

  setUser: (user: User) => void;
  setAccessToken: (token: string | null) => void;
  clearUser: () => void;
  clearAuth: () => void;
  setIsLoading: (loading: boolean) => void;
  setIsInitialized: (value: boolean) => void;
  setError: (value: string | null) => void;
  setAuthReady: (ready: boolean) => void;
  bootstrapAuth: () => Promise<void>;
  
  setWebSocketConnected: (connected: boolean) => void;
  setWebSocketError: (error: string | null) => void;
  setWebSocketConnecting: (connecting: boolean) => void;
  updateWebSocketLastConnected: () => void;
}

export const useAuthStore = create<AuthStore>()(
  devtools(
    persist(
      (set, get) => ({
        user: null,
        accessToken: null,
        isAuthenticated: false,
        isLoading: false,
        isInitialized: false,
        error: null,
        lastLoginTime: null,
        authReady: false,
        isBootstrapping: false,
        
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

        setAccessToken: (token) =>
          set({ accessToken: token }),

        clearUser: () => {
          set({
            user: null,
            accessToken: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
            lastLoginTime: null,
            isInitialized: true,
            websocket: {
              isConnected: false,
              connectionError: null,
              lastConnectedAt: null,
              isConnecting: false,
            },
          });
        },

        clearAuth: () => {
          set({
            user: null,
            accessToken: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
            lastLoginTime: null,
            isInitialized: true, // Ensure initialized is true so redirect hooks can work
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
        setAuthReady: (ready) => set({ authReady: ready }),

        bootstrapAuth: async () => {
          const state = get();
          // If already bootstrapping, return
          if (state.isBootstrapping) {
            return;
          }

          set({ isBootstrapping: true });

          try {
            const hasAccessToken = await apiClient.initAuthFromRefresh();
            
            if (hasAccessToken) {
              try {
                const user = await apiClient.getMe();
                set({ user, isAuthenticated: true, error: null, lastLoginTime: Date.now(), isInitialized: true });
              } catch (error) {
                console.error('Failed to get user data:', error);
                // Clear auth if we had a user before
                const currentUser = get().user;
                if (currentUser) {
                  set({ user: null, accessToken: null, isAuthenticated: false, lastLoginTime: null, isInitialized: true });
                }
              }
            } else {
              // Clear auth if we had a user before (refresh token expired)
              const currentUser = get().user;
              if (currentUser) {
                set({ user: null, accessToken: null, isAuthenticated: false, lastLoginTime: null, isInitialized: true });
              }
            }
          } catch (error) {
            console.error('Auth bootstrap error:', error);
            // Clear auth if we had a user before
            const currentUser = get().user;
            if (currentUser) {
              set({ user: null, accessToken: null, isAuthenticated: false, lastLoginTime: null, isInitialized: true });
            }
          } finally {
            set({ authReady: true, isBootstrapping: false, isInitialized: true });
          }
        },
        
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
