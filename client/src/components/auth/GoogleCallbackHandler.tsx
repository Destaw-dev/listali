'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../store/authStore';
import { apiClient } from '../../lib/api';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useNotification } from '../../contexts/NotificationContext';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { mapInviteErrorToTranslationKey } from '../../lib/utils';
import { Button } from '../common';

export function GoogleCallbackHandler() {
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const params = useParams();
  const { setUser } = useAuthStore();
  const { showSuccess, showWarning, handleApiError } = useNotification();
  const locale = params?.locale as string || 'he';
  const t = useTranslations('auth');

  useEffect(() => {
    const handleGoogleCallback = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const hasGoogleParams = urlParams.has('token') || urlParams.has('user') || urlParams.has('google');

        console.log('urlParams', urlParams);
        console.log('hasGoogleParams', hasGoogleParams);
        
        if (hasGoogleParams) {
          const user = await apiClient.handleGoogleCallback();
          
          if (user) {
            setUser(user);
            showSuccess('auth.googleLoginSuccess');
            
            const inviteError = urlParams.get('inviteError');
            if (inviteError) {
              const inviteErrorMsg = decodeURIComponent(inviteError);
              const translationKey = mapInviteErrorToTranslationKey(inviteErrorMsg);
              showWarning(translationKey);
            }
            
            const groupJoined = urlParams.get('groupJoined');
            if (groupJoined) {
              router.push(`/${locale}/groups/${groupJoined}`);
            } else {
              router.push(`/${locale}/dashboard`);
            }
          } else {
            const loginError = new Error(t('googleLoginError'));
            setError(t('googleLoginError'));
            handleApiError(loginError);
            router.push(`/${locale}/welcome`);
          }
        } else {
          router.push(`/${locale}/welcome`);
        }
        } catch (error) {
          console.error('Google callback error:', error);
          if (error instanceof Error) {
            setError(error.message);
            handleApiError(error);
          } else {
            const defaultError = new Error('auth.googleLoginError');
            setError(defaultError.message);
            handleApiError(defaultError);
          }
          router.push(`/${locale}/welcome`);
        } finally {
        setIsProcessing(false);
      }
    };

    handleGoogleCallback();
  }, [setUser, router, locale, t, showSuccess, showWarning, handleApiError]);

  if (error) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-error mb-4">{t('loginError')}</h1>
          <p className="text-secondary mb-6">{error}</p>
          <Button variant='primary' size='lg' fullWidth loading={isProcessing} onClick={() => router.push(`/${locale}/auth/login`)}>
            {t('backToLogin')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="text-center">
        <LoadingSpinner message={t('processingGoogleLogin')} />
      </div>
    </div>
  );
} 