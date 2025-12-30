'use client';

import { QueryProvider } from './QueryProvider';
import { Toaster } from 'react-hot-toast';
import { AuthBootstrapProvider } from '../auth/AuthBootstrapProvider';
import { ThemeProvider } from './ThemeProvider';
import { NotificationProvider } from '../../contexts/NotificationContext';

interface ProvidersProps {
  children: React.ReactNode;
  locale: string;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <QueryProvider>
      <NotificationProvider>
        <ThemeProvider>
          <AuthBootstrapProvider>
            {children}
          </AuthBootstrapProvider>
          <Toaster position="top-center" />
        </ThemeProvider>
      </NotificationProvider>
    </QueryProvider>
  );
} 