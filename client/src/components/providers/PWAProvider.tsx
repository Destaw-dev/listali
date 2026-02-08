'use client';

import { useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { usePushNotifications } from '../../hooks/usePushNotifications';

export function PWAProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  const { isSupported, checkSubscription } = usePushNotifications();

  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator
    ) {
      navigator.serviceWorker
        .register('/sw.js', {
          scope: '/'
        })
        .then((registration) => {
          
          setInterval(() => {
            registration.update();
          }, 60000);
          
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('🔄 New service worker available');
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error('❌ Service Worker registration failed:', error);
          console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            name: error.name
          });
        });

      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });
    } else {
      console.warn('⚠️ Service Worker not supported in this browser');
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && isSupported) {
      checkSubscription();
    }
  }, [isAuthenticated, isSupported, checkSubscription]);

  return <>{children}</>;
}
