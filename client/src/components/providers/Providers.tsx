'use client';

import { QueryProvider } from './QueryProvider';
import { Toaster } from 'react-hot-toast';
import { AuthInitializer } from '@/components/auth/AuthInitializer';
import { ThemeProvider } from './ThemeProvider';
import { NotificationProvider } from '@/contexts/NotificationContext';

interface ProvidersProps {
  children: React.ReactNode;
  locale: string;
}

export function Providers({ children, locale }: ProvidersProps) {
  return (
    <QueryProvider>
      <NotificationProvider>
        <ThemeProvider>
          <AuthInitializer locale={locale} />
          {children}
          <Toaster position="top-center" />
        </ThemeProvider>
      </NotificationProvider>
    </QueryProvider>
  );
} 