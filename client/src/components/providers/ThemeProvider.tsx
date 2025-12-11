'use client';

import { useEffect, useState } from 'react';
import { useThemeStore } from '@/store/themeStore';
import { useAuthStore } from '@/store/authStore';
import { useRouter, usePathname } from 'next/navigation';
import { useParams } from 'next/navigation';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme, setTheme } = useThemeStore();
  const { isAuthenticated, user } = useAuthStore();
  const [isInitialized, setIsInitialized] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const locale = (params?.locale as string) || 'he';

  // Initialize theme from user preferences
  useEffect(() => {
    if (!isInitialized) {
      if (isAuthenticated && user?.preferences) {
        // User is authenticated - use server preferences
        const serverTheme = user.preferences.darkMode ? 'dark' : 'light';
        if (serverTheme !== theme) {
          setTheme(serverTheme);
        }
      }
      // For unauthenticated users, theme is handled by themeStore with persist middleware
      
      setIsInitialized(true);
    }
  }, [user?.preferences, theme, setTheme, isInitialized, isAuthenticated]);

  useEffect(() => {
    if (!isInitialized) return;

    // Apply theme on client side
    const applyTheme = (currentTheme: string) => {
      const root = document.documentElement;
      
      if (currentTheme === 'system') {
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        root.setAttribute('data-theme', systemPrefersDark ? 'dark' : 'light');
      } else {
        root.setAttribute('data-theme', currentTheme);
      }
    };

    // Apply initial theme
    applyTheme(theme);

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = () => {
      if (theme === 'system') {
        applyTheme('system');
      }
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);

    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange);
    };
  }, [theme, isInitialized]);

  return <>{children}</>;
}
