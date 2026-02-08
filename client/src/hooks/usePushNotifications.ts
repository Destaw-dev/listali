'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '../store/authStore';
import { apiClient } from '../lib/api';
import { useNotification } from '../contexts/NotificationContext';

interface PushSubscriptionJSON {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export function usePushNotifications() {
  const { isAuthenticated } = useAuthStore();
  const { showSuccess, showError } = useNotification();
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);

  const vapidPublicKey = typeof window !== 'undefined'
    ? (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? '').trim()
    : '';

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
    }
  }, []);

  const checkSubscription = useCallback(async () => {
    if (!isSupported || !isAuthenticated) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.getSubscription();
      setSubscription(sub);
      setIsSubscribed(!!sub);
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  }, [isSupported, isAuthenticated]);

  useEffect(() => {
    checkSubscription();
  }, [checkSubscription]);

  const subscribe = useCallback(async () => {
    if (!isSupported || !isAuthenticated) {
      const err = new Error('Push not supported or not authenticated');
      showError('Push notifications are not supported or you are not authenticated');
      throw err;
    }

    if (!vapidPublicKey) {
      const err = new Error('Missing VAPID public key');
      showError('Push notifications are not configured. Please contact support.');
      throw err;
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      const err = new Error('Notification permission denied');
      showError('Notification permission denied');
      throw err;
    }
  
    const registration = await navigator.serviceWorker.ready;
  
    let sub = await registration.pushManager.getSubscription();
  
    if (!sub) {
      const keyArray = urlBase64ToUint8Array(vapidPublicKey);
      sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: keyArray,
      });
    }
  
    const subscriptionJSON: PushSubscriptionJSON = {
      endpoint: sub.endpoint,
      keys: {
        p256dh: arrayBufferToBase64(sub.getKey('p256dh')!),
        auth: arrayBufferToBase64(sub.getKey('auth')!)
      }
    };
  
    await apiClient.savePushSubscription(subscriptionJSON);
  
    setSubscription(sub);
    setIsSubscribed(true);
    showSuccess('Push notifications enabled successfully');
  
    return sub;
  }, [isSupported, isAuthenticated, vapidPublicKey, showSuccess, showError]);
  

  const unsubscribe = useCallback(async () => {
    if (!subscription) return;

    try {
      await subscription.unsubscribe();
      await apiClient.removePushSubscription(subscription.endpoint);
      setSubscription(null);
      setIsSubscribed(false);
      showSuccess('Push notifications disabled successfully');
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      showError('Failed to disable push notifications');
    }
  }, [subscription, showSuccess, showError]);

  return {
    isSupported,
    isSubscribed,
    isPushConfigured: !!vapidPublicKey,
    subscribe,
    unsubscribe,
    checkSubscription
  };
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}
