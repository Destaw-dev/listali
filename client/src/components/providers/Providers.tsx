'use client';

import { QueryProvider } from './QueryProvider';
import { Toaster } from 'react-hot-toast';
import { AuthBootstrapProvider } from '../auth/AuthBootstrapProvider';
import { ThemeProvider } from './ThemeProvider';
import { NotificationProvider } from '../../contexts/NotificationContext';
import { PWAProvider } from './PWAProvider';

interface ProvidersProps {
  children: React.ReactNode;
  locale: string;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <QueryProvider>
      <NotificationProvider>
        <ThemeProvider>
          <PWAProvider>
            <AuthBootstrapProvider>
              {children}
            </AuthBootstrapProvider>
          </PWAProvider>
          <Toaster position="top-center" />
        </ThemeProvider>
      </NotificationProvider>
    </QueryProvider>
  );
} 