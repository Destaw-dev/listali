'use client';

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { Theme } from '../../types';

function resolveTheme(theme: Theme) {
  if (theme !== 'system') return theme;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme, setTheme } = useThemeStore();
  const { isAuthenticated, user } = useAuthStore();

  const [isInitialized, setIsInitialized] = useState(false);


  const didInitialApply = useRef(false);

  useEffect(() => {
    if (isInitialized) return;

    if (isAuthenticated && user?.preferences) {
      const serverTheme: Theme = user.preferences.theme;
      if (serverTheme !== theme) setTheme(serverTheme as Theme);
    }

    setIsInitialized(true);
  }, [isAuthenticated, user?.preferences, theme, setTheme, isInitialized]);

  useLayoutEffect(() => {
    if (!isInitialized) return;

    const root = document.documentElement;

    const finalTheme = resolveTheme(theme);
    root.setAttribute('data-theme', finalTheme);

    if (!didInitialApply.current) {
      didInitialApply.current = true;
      return;
    }

    root.classList.add('theme-transition');
    const t = window.setTimeout(() => {
      root.classList.remove('theme-transition');
    }, 220);

    return () => window.clearTimeout(t);
  }, [theme, isInitialized]);

  useEffect(() => {
    if (!isInitialized) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      if (theme === 'system') {
        const resolved = resolveTheme('system');
        const root = document.documentElement;
        root.setAttribute('data-theme', resolved);
      }
    };

    mediaQuery.addEventListener('change', onChange);
    return () => mediaQuery.removeEventListener('change', onChange);
  }, [theme, isInitialized]);

  return <>{children}</>;
}
