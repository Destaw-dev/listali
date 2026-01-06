'use client';

import { useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { apiClient } from '../../lib/api';
import websocketService from '../../services/websocket';

interface AuthInitializerProps {
  locale: string;
}

export function AuthInitializer({  }: AuthInitializerProps) {
  const { setIsInitialized, setUser, clearUser, isAuthenticated } = useAuthStore();

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const currentUser = useAuthStore.getState().user;
        const hasAccessToken = await apiClient.initAuthFromRefresh();
        
        if (hasAccessToken) {
          try {
            const user = await apiClient.getMe();
            setUser(user);
          } catch (error) {
            console.error('Failed to get user data:', error);
            if (currentUser) {
              clearUser();
            }
          }
        } else {
          if (currentUser) {
            clearUser();
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
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