import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { persist } from 'zustand/middleware';
import type { User } from '../types';
import { apiClient } from '../lib/api';

// Generate or retrieve guest ID from localStorage
const getOrCreateGuestId = (): string => {
  if (typeof window === 'undefined') return '';
  
  const stored = localStorage.getItem('guest-id');
  if (stored) return stored;
  
  // Generate cryptographically secure UUID v4
  const uuid = crypto.randomUUID();
  
  localStorage.setItem('guest-id', uuid);
  return uuid;
};

export type AuthMode = 'guest' | 'authenticated' | null;

export interface AuthStore {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  authMode: AuthMode | null; // 'guest' | 'authenticated'
  guestId: string | null; // UUID for guest user (persisted in localStorage)
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
  setGuestMode: () => void; // Set guest mode (no redirect)
  clearUser: () => void;
  clearAuth: () => void;
  setIsLoading: (loading: boolean) => void;
  setIsInitialized: (value: boolean) => void;
  setError: (value: string | null) => void;
  setAuthReady: (ready: boolean) => void;
  bootstrapAuth: () => Promise<void>;
  
  // Helper getters (computed)
  isGuest: () => boolean;
  isAuthed: () => boolean;
  
  setWebSocketConnected: (connected: boolean) => void;
  setWebSocketError: (error: string | null) => void;
  setWebSocketConnecting: (connecting: boolean) => void;
  updateWebSocketLastConnected: () => void;
}

export const useAuthStore = create<AuthStore>()(
  devtools(
    persist(
      (set, get) => {
        
        return {
          user: null,
          accessToken: null,
          isAuthenticated: false,
          authMode: null,
          guestId: null,
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
              authMode: 'authenticated' as AuthMode,
              error: null,
              lastLoginTime: Date.now(),
              isInitialized: true,
            }),

          setGuestMode: () =>
            set({
            user: null,
            accessToken: null,
            isAuthenticated: false,
            authMode: 'guest' as AuthMode,
            isLoading: false,
            error: null,
            isInitialized: true,
            guestId: typeof window !== 'undefined' ? getOrCreateGuestId() : null,
            websocket: {
              isConnected: false,
              connectionError: null,
              lastConnectedAt: null,
              isConnecting: false,
            },
          }),

        setAccessToken: (token) =>
          set({ accessToken: token }),

        clearUser: () => {
          set({
            user: null,
            accessToken: null,
            isAuthenticated: false,
            authMode: null,
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
            authMode: null,
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

        setIsLoading: (loading) => set({ isLoading: loading }),
        setIsInitialized: (val) => set({ isInitialized: val }),
        setError: (err) => set({ error: err }),
        setAuthReady: (ready) => set({ authReady: ready }),

        bootstrapAuth: async () => {
          const state = get();
          if (state.isBootstrapping) {
            return;
          }

          set({ isBootstrapping: true });

          try {
            const hasAccessToken = await apiClient.initAuthFromRefresh();
            
            if (hasAccessToken) {
              try {
                const user = await apiClient.getMe();
                set({ 
                  user, 
                  isAuthenticated: true, 
                  authMode: 'authenticated' as AuthMode,
                  error: null, 
                  lastLoginTime: Date.now(), 
                  isInitialized: true 
                });
              } catch (error) {
                console.error('Failed to get user data:', error);
                // On 401, set guest mode (NO redirect)
                const currentUser = get().user;
                if (currentUser) {
                  set({ user: null, accessToken: null, isAuthenticated: false, authMode: null, lastLoginTime: null, isInitialized: true });

                } else if (get().isGuest()) {
                  set({ authMode: 'guest' as AuthMode, isInitialized: true });
                }
              }
            } else {
              const currentUser = get().user;
              if (currentUser) {
                set({ user: null, accessToken: null, isAuthenticated: false, authMode: null, lastLoginTime: null, isInitialized: true });
              } else if (get().isGuest()) {
                set({ authMode: 'guest' as AuthMode, isInitialized: true });
              }
            }
          } catch (error) {
            console.error('Auth bootstrap error:', error);
            const currentUser = get().user;
            if (currentUser) {
              set({ user: null, accessToken: null, isAuthenticated: false, authMode: null, lastLoginTime: null, isInitialized: true });
            } else if (get().isGuest()) {
              set({ authMode: 'guest' as AuthMode, isInitialized: true });
            }
          } finally {
            set({ authReady: true, isBootstrapping: false, isInitialized: true });
          }
        },

        // Helper getters
        isGuest: () => {
          const state = get();
          return state.authMode === 'guest' && !state.isAuthenticated;
        },

        isAuthed: () => {
          const state = get();
          return state.authMode === 'authenticated' && state.isAuthenticated;
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
        };
      },
      {
        name: 'auth-storage',
        partialize: (state: AuthStore) => ({
          user: state.user,
          isAuthenticated: state.isAuthenticated,
          authMode: state.authMode,
          lastLoginTime: state.lastLoginTime,
        }),
      }
    )
  )
);
