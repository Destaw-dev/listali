'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { apiClient } from '@/lib/api';
import websocketService from '@/services/websocket';

interface AuthInitializerProps {
  locale: string;
}

export function AuthInitializer({  }: AuthInitializerProps) {
  const { setIsInitialized, setUser, clearUser, isAuthenticated } = useAuthStore();

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check if there's a persisted user before attempting refresh
        const currentUser = useAuthStore.getState().user;
        const hasAccessToken = await apiClient.initAuthFromRefresh();
        
        if (hasAccessToken) {
          try {
            const user = await apiClient.getMe();
            setUser(user);
          } catch (error) {
            console.error('Failed to get user data:', error);
            // Only clear if we had a user before (meaning they were logged in)
            if (currentUser) {
              clearUser();
            }
          }
        } else {
          // Only clear user if there was one before (meaning refresh token expired)
          // If there was no user, it means user was never logged in, so nothing to clear
          if (currentUser) {
            clearUser();
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        // Only clear if there was a user before
        const currentUser = useAuthStore.getState().user;
        if (currentUser) {
          clearUser();
        }
      } finally {
        setIsInitialized(true);
      }
    };

    initializeAuth();
  }, [setIsInitialized, setUser, clearUser]);

  useEffect(() => {
    if (isAuthenticated) {
      websocketService.connect();
    } else {
      websocketService.disconnect();
    }
  }, [isAuthenticated]);

  return null;
} 