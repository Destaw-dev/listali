'use client';

import { useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { usePushNotifications } from '../../hooks/usePushNotifications';

export function PWAProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  const { isSupported, checkSubscription } = usePushNotifications();

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    let didReload = false;

    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then(async (registration) => {
        try {
          await registration.update();
        } catch {}

        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('🔄 New service worker available (consider prompting user to refresh)');
            }
          });
        });
      })
      .catch((error) => {
        console.error('❌ Service Worker registration failed:', error);
      });

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (didReload) return;
      didReload = true;

      setTimeout(() => window.location.reload(), 500);
    });
  }, []);

  useEffect(() => {
    if (isAuthenticated && isSupported) {
      checkSubscription();
    }
  }, [isAuthenticated, isSupported, checkSubscription]);

  return <>{children}</>;
}
