'use client';

import { useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import websocketService from '../../services/websocket';

interface AuthBootstrapProviderProps {
  children: React.ReactNode;
}

export function AuthBootstrapProvider({ children }: AuthBootstrapProviderProps) {
  const { authReady, isAuthenticated, bootstrapAuth } = useAuthStore();

  useEffect(() => {
    bootstrapAuth();
  }, [bootstrapAuth]);

  useEffect(() => {
    if (authReady && isAuthenticated) {
      websocketService.connect();
    } else {
      websocketService.disconnect();
    }
  }, [authReady, isAuthenticated]);

  if (!authReady) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return <>{children}</>;
}

