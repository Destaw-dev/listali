'use client';

import { useEffect, useState } from 'react';
import { useThemeStore } from '@/store/themeStore';
import { useAuthStore } from '@/store/authStore';
import { Theme } from '@/types';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme, setTheme } = useThemeStore();
  const { isAuthenticated, user } = useAuthStore();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!isInitialized) {
      if (isAuthenticated && user?.preferences) {
        const serverTheme = user.preferences.darkMode ? 'dark' : 'light';
        if (serverTheme !== theme) {
          setTheme(serverTheme);
        }
      }
      
      setIsInitialized(true);
    }
  }, [user?.preferences, theme, setTheme, isInitialized, isAuthenticated]);

  useEffect(() => {
    if (!isInitialized) return;

    const applyTheme = (currentTheme: Theme) => {
      const root = document.documentElement;

      if (currentTheme === 'system') {
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        root.setAttribute('data-theme', systemPrefersDark ? 'dark' : 'light');
      } else {
        root.setAttribute('data-theme', currentTheme);
      }
    };

    applyTheme(theme);

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
