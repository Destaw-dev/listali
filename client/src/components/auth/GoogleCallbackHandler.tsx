'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { apiClient } from '@/lib/api';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useNotification } from '@/contexts/NotificationContext';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { mapInviteErrorToTranslationKey } from '@/lib/utils';

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
            setError(t('googleLoginError'));
            handleApiError(error);
            router.push(`/${locale}/welcome`);
          }
        } else {
          router.push(`/${locale}/welcome`);
        }
        } catch (error: any) {
          console.error('Google callback error:', error);
          setError(error.message || 'auth.googleLoginError');
          handleApiError(error);
          router.push(`/${locale}/welcome`);
        } finally {
        setIsProcessing(false);
      }
    };

    handleGoogleCallback();
  }, [setUser, router]);

  if (error) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-error mb-4">{t('loginError')}</h1>
          <p className="text-secondary mb-6">{error}</p>
          <button
            onClick={() => router.push(`/${locale}/auth/login`)}
            className="btn-primary"
          >
            {t('backToLogin')}
          </button>
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