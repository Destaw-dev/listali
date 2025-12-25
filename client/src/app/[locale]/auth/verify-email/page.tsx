'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/common/Button';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { apiClient } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { mapInviteErrorToTranslationKey } from '@/lib/utils';
import { useNotification } from '@/contexts/NotificationContext';

function VerifyEmailContent() {

  const [verificationStatus, setVerificationStatus] = useState<'verifying' | 'success' | 'error' | 'expired' | 'alreadyVerified' | 'inviteError' | 'default' | 'emailNotVerified'>('verifying');
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [verificationSent, setVerificationSent] = useState(false);
  
  const t = useTranslations('auth');
  const tInvitations = useTranslations('invitations');
  const tRoot = useTranslations();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { showSuccess, showError } = useNotification();
  const { setUser } = useAuthStore();

  const token = searchParams.get('token');
  const email = searchParams.get('email');
  const locale = searchParams.get('locale') || 'he';
  const inviteError = searchParams.get('inviteError');
  const status = searchParams.get('status');

  useEffect(() => {
    if (token) {
      verifyEmail(token);
    } else if (inviteError) {
      setVerificationStatus('inviteError');
    } else if (status === 'emailNotVerified') {
      setVerificationStatus('emailNotVerified');
    } else {
      setVerificationStatus('default');
    }
  }, [token, inviteError]);

  useEffect(() => {
    if (verificationStatus === 'success') {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [verificationStatus]);

  useEffect(() => {
    if (verificationStatus === 'success' && countdown === 0) {
      router.push(`/${locale}/dashboard`);
    }
  }, [verificationStatus, countdown, router, locale]);

  const verifyEmail = async (verificationToken: string) => {
    try {
      const data = await apiClient.verifyEmail(verificationToken, email || undefined);
      setUser(data.user);
      setVerificationStatus('success');
    } catch (error: any) {
      console.error('Verification error:', error);
      if (error.response.data.message?.includes('expired') || error.response.data.message?.includes('TOKEN_EXPIRED')) {
        setVerificationStatus('expired');
      } else if (error.response.data.message?.includes('already verified')) {
        setVerificationStatus('alreadyVerified');
      } else {
        setVerificationStatus('error');
      }
    }
  };

  const resendVerification = async () => {
    if (!email) return;
    
    setIsResending(true);
    try {
      await apiClient.resendVerification(email);
      showSuccess('auth.verificationEmailSent');
      setVerificationSent(true);
    } catch (error: any) {
      showError('auth.verificationEmailError');
    } finally {
      setIsResending(false);
    }
  };

  const renderContent = () => {
    switch (verificationStatus) {
      case 'verifying':
        return (
          <div className="text-center">
            <LoadingSpinner size="lg" />
            <h2 className="text-xl font-semibold mt-4">{t('verifyingEmail')}</h2>
            <p className="text-gray-600 mt-2">{t('pleaseWait')}</p>
          </div>
        );

      case 'success':
        return (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-green-600 mb-2">{t('emailVerified')}</h2>
            <p className="text-gray-600 mb-4">{t('verificationSuccess')}</p>
            <p className="text-sm text-gray-500">
              {t('redirectingIn')} {countdown} {t('seconds')}
            </p>
            <Button 
              onClick={() => router.push(`/${locale}/dashboard`)}
              className="mt-4"
            >
              {t('goToDashboard')}
            </Button>
          </div>
        );

      case 'expired':
        return (
          <div className="text-center">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-yellow-600 mb-2">{t('verificationExpired')}</h2>
            {!verificationSent ? <p className="text-gray-600 mb-4">{t('verificationExpiredMessage')}</p> : (
              <p className="text-gray-600 mb-4">{t('verificationEmailSent')}</p>
            )}
            <Button 
              onClick={resendVerification}
              disabled={isResending}
              size='lg'
            >
              {isResending ? t('sending') : t('resendVerification')}
            </Button>
          </div>
        );

      case 'error':
        return (
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-red-600 mb-2">{t('verificationFailed')}</h2>
            {!verificationSent ? <p className="text-gray-600 mb-4">{t('verificationFailedMessage')}</p> : (
              <p className="text-gray-600 mb-4">{t('verificationEmailSent')}</p>
            )}
            <Button 
              onClick={resendVerification}
              disabled={isResending}
              size='lg'
            >
              {isResending ? t('sending') : t('resendVerification')}
            </Button>
          </div>
        );

      case 'alreadyVerified':
        return (
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7V3l-9 10z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-blue-600 mb-2">{t('emailAlreadyVerified')}</h2>
            <p className="text-gray-600 mb-4">{t('emailAlreadyVerifiedMessage')}</p>
            <Button 
              onClick={() => router.push(`/${locale}/auth/login`)}
            >
              {t('backToLogin')}
            </Button>
          </div>
        );

      case 'inviteError': {
        const inviteErrorMsg = inviteError ? decodeURIComponent(inviteError) : '';
        const inviteErrorKey = inviteErrorMsg ? mapInviteErrorToTranslationKey(inviteErrorMsg) : 'inviteErrorMessage';
        let errorMessage = t('inviteErrorMessage');
        
        if (inviteErrorKey.startsWith('invitations.')) {
          errorMessage = tInvitations(inviteErrorKey.replace('invitations.', ''));
        } else if (inviteErrorKey.includes('.')) {
          errorMessage = tRoot(inviteErrorKey);
        } else if (inviteErrorMsg) {
          errorMessage = inviteErrorMsg;
        }
        
        return (
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-red-600 mb-2">{t('inviteError')}</h2>
            <p className="text-gray-600 mb-4">{errorMessage}</p>
            <p className="text-text-primary mb-4">{t('pleaseCheckYourEmail')}</p>
            <Button 
              onClick={resendVerification}
              disabled={isResending}
              size='lg'
            >
              {isResending ? t('sending') : t('resendVerification')}
            </Button>
          </div>
        );
      }

      case 'emailNotVerified':
        return (
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-2">{t('emailNotVerified')}</h2>
            <p className="text-gray-600 mb-4">{t('emailNotVerifiedMessage')}</p>
            <Button 
              onClick={resendVerification}
              disabled={isResending}
              size='lg'
            >
              {isResending ? t('sending') : t('resendVerification')}
            </Button>
          </div>
        );

      default:
        return (
          <div className="text-center flex flex-col items-center justify-center gap-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold">{t('verificationEmailSent')}</h2>
            <p className="text-text-primary">{t('pleaseCheckYourEmail')}</p>
            <Button 
              onClick={resendVerification}
              disabled={isResending}
              size='lg'
            >
              {isResending ? t('sending') : t('resendVerification')}
            </Button>

          </div>
        );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {t('emailVerification')}
          </h1>
          <p className="text-gray-600">
            {t('emailVerificationSubtitle')}
          </p>
        </div>

        <div className="bg-white py-8 px-6 shadow rounded-lg">
          {renderContent()}
        </div>

        <div className="text-center text-sm text-gray-500">
          <p>{t('verificationHelp')}</p>
          <p className="mt-1">
            {t('contactSupport')}{' '}
            <a href="mailto:support@listali.co.il" className="text-blue-600 hover:text-blue-500">
              support@listali.co.il
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<LoadingSpinner size="lg" />}>
      <VerifyEmailContent />
    </Suspense>
  );
} 