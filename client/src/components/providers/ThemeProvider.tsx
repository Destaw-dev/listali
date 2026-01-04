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

  // כדי לא להוסיף transition על טעינה ראשונה
  const didInitialApply = useRef(false);

  // 1) קבע theme מהשרת (אם קיים) פעם אחת
  useEffect(() => {
    if (isInitialized) return;

    if (isAuthenticated && user?.preferences) {
      const serverTheme: Theme = user.preferences.darkMode ? 'dark' : 'light';
      if (serverTheme !== theme) setTheme(serverTheme);
    }

    setIsInitialized(true);
  }, [isAuthenticated, user?.preferences, theme, setTheme, isInitialized]);

  // 2) החל theme הכי מוקדם (לפני paint) כדי למנוע flicker
  useLayoutEffect(() => {
    if (!isInitialized) return;

    const root = document.documentElement;

    // apply
    const finalTheme = resolveTheme(theme);
    root.setAttribute('data-theme', finalTheme);

    // רק אחרי שהחלת בפעם הראשונה — אפשר להפעיל smooth transitions בהחלפות עתידיות
    if (!didInitialApply.current) {
      didInitialApply.current = true;
      return;
    }

    // הוספת class קצרה למעבר חלק רק בהחלפה (לא תמיד)
    root.classList.add('theme-transition');
    const t = window.setTimeout(() => {
      root.classList.remove('theme-transition');
    }, 220);

    return () => window.clearTimeout(t);
  }, [theme, isInitialized]);

  // 3) האזן לשינוי system theme רק אם theme === system
  useEffect(() => {
    if (!isInitialized) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      if (theme === 'system') {
        document.documentElement.setAttribute('data-theme', resolveTheme('system'));
      }
    };

    mediaQuery.addEventListener('change', onChange);
    return () => mediaQuery.removeEventListener('change', onChange);
  }, [theme, isInitialized]);

  return <>{children}</>;
}
