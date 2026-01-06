'use client';

import React, { createContext, useContext, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import { AxiosError } from 'axios';

export enum NotificationType {
  ERROR = 'error',
  NETWORK = 'network',
  VALIDATION = 'validation',
  AUTH = 'auth',
  SERVER = 'server',
  CLIENT = 'client',
  SUCCESS = 'success',
  INFO = 'info',
  WARNING = 'warning'
}

export interface NotificationMessage {
  type: NotificationType;
  message: string;
  details?: string;
  action?: string;
  duration?: number;
}

interface NotificationContextType {
  showToast: (message: string, type?: NotificationType, duration?: number) => void;
  showError: (error: Error | string, type?: NotificationType) => void;
  showSuccess: (message: string, options?: { [key: string]: string }) => void;
  showWarning: (message: string, options?: { [key: string]: string }) => void;
  showInfo: (message: string, options?: { [key: string]: string }) => void;
  handleApiError: (error: Error | AxiosError) => void;
  handleValidationError: (field: string, message: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const t = useTranslations();

  const showToast = useCallback((message: string, type: NotificationType = NotificationType.INFO, duration?: number) => {
    const toastOptions = {
      duration: duration || (type === NotificationType.SUCCESS ? 3000 : 5000),
      position: 'top-center' as const,
      style: {
        background: getToastColor(type),
        color: '#fff',
        fontWeight: '500',
        borderRadius: '12px',
        padding: '12px 16px',
        fontSize: '14px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      },
    };

    switch (type) {
      case NotificationType.SUCCESS:
        toast.success(message, toastOptions);
        break;
      case NotificationType.ERROR:
      case NotificationType.NETWORK:
      case NotificationType.SERVER:
      case NotificationType.CLIENT:
        toast.error(message, toastOptions);
        break;
      case NotificationType.WARNING:
        toast(message, { ...toastOptions, icon: '⚠️' });
        break;
      case NotificationType.INFO:
        toast(message, { ...toastOptions, icon: 'ℹ️' });
        break;
      default:
        toast(message, toastOptions);
    }
  }, []);

  const showError = useCallback((error: Error | string, type: NotificationType = NotificationType.CLIENT) => {
    let message: string;
    
    if (typeof error === 'string') {
      if (error.includes('.')) {
        message = t(error);
      } else {
        message = error;
      }
    } else {
      const errorKey = getErrorKey(error);
      message = t(`notifications.${errorKey}`, { defaultMessage: error.message });
    }
    
    showToast(message, type);
  }, [t, showToast]);

  const showSuccess = useCallback((messageKey: string, options?: { [key: string]: string }) => {
    const translatedMessage = t(messageKey, options);
    showToast(translatedMessage, NotificationType.SUCCESS);
  }, [t, showToast]);

  const showWarning = useCallback((messageKey: string, options?: { [key: string]: string }) => {
    const translatedMessage = t(messageKey, options);
    showToast(translatedMessage, NotificationType.WARNING);
  }, [t, showToast]);

  const showInfo = useCallback((messageKey: string, options?: { [key: string]: string }) => {
    const translatedMessage = t(messageKey, options);
    showToast(translatedMessage, NotificationType.INFO);
  }, [t, showToast]);

  const handleApiError = useCallback((error: Error | AxiosError) => {
    if (error instanceof AxiosError) {
      if (!error.response) {
        showError('notifications.networkError', NotificationType.NETWORK);
        return;
      }

      const status = error.response.status;
      const errorData = error.response.data as { message?: string; errors?: Record<string, string> };
    
    switch (status) {
      case 400:
        showError('notifications.badRequest', NotificationType.CLIENT);
        break;
      case 401:
        showError('notifications.unauthorized', NotificationType.AUTH);
        break;
      case 403:
        showError('notifications.forbidden', NotificationType.AUTH);
        break;
      case 404:
        showError('notifications.notFound', NotificationType.CLIENT);
        break;
      case 422:
        const validationMessage = errorData?.message || 'notifications.validationError';
        showError(validationMessage, NotificationType.VALIDATION);
        break;
      case 500:
        showError('notifications.serverError', NotificationType.SERVER);
        break;
      default:
        const message = errorData?.message || 'notifications.unknownError';
        showError(message, NotificationType.SERVER);
      }
    } else {
      showError(error, NotificationType.CLIENT);
    }
  }, [showError]);

  const handleValidationError = useCallback((field: string, message: string) => {
    const translatedMessage = t('notifications.validationError', { field, message });
    showError(translatedMessage, NotificationType.VALIDATION);
  }, [t, showError]);

  const value: NotificationContextType = {
    showToast,
    showError,
    showSuccess,
    showWarning,
    showInfo,
    handleApiError,
    handleValidationError,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}

function getToastColor(type: NotificationType): string {
  switch (type) {
    case NotificationType.SUCCESS:
      return '#10b981';
    case NotificationType.ERROR:
      return '#ef4444';
    case NotificationType.NETWORK:
    case NotificationType.SERVER:
    case NotificationType.CLIENT:
      return '#ef4444';
    case NotificationType.WARNING:
      return '#f59e0b';
    case NotificationType.INFO:
      return '#3b82f6';
    default:
      return '#6b7280';
  }
}

function getErrorKey(error: Error): string {
  if (error.message.includes('Network Error')) return 'networkError';
  if (error.message.includes('timeout')) return 'timeoutError';
  if (error.message.includes('Unauthorized')) return 'unauthorized';
  if (error.message.includes('Forbidden')) return 'forbidden';
  if (error.message.includes('Not Found')) return 'notFound';
  if (error.message.includes('Validation')) return 'validationError';
  
  return 'unknownError';
}
