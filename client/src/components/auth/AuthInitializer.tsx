'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { apiClient } from '@/lib/api';
import websocketService from '@/services/websocket';
import { useRouter, usePathname } from 'next/navigation';

interface AuthInitializerProps {
  locale: string;
}

export function AuthInitializer({ locale }: AuthInitializerProps) {
  const { setIsInitialized, setUser, clearUser, isAuthenticated } = useAuthStore();

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        
        if (token) {
          try {
            const user = await apiClient.getMe();
            setUser(user);
            
          } catch (error) {
            console.error('Failed to get user data:', error);
            clearUser();
          }
        } else {
          clearUser();
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        clearUser();
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