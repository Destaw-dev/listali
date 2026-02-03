'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Lock, Mail, Chrome } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useAuthStore } from '../../store/authStore';
import { GoogleAuthButton } from './GoogleAuthButton';

interface RequireAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  actionName?: string;
}

export function RequireAuthModal({ isOpen, onClose, actionName }: RequireAuthModalProps) {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string || 'he';
  const t = useTranslations('auth.RequireAuthModal');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleGoogleAuth = async () => {
    setIsGoogleLoading(true);
    try {
      const callbackUrl = `${window.location.origin}/${locale}/auth/callback`;
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/google/url?callback=${encodeURIComponent(callbackUrl)}`);
      const data = await response.json();
      if (data.success && data.data.url) {
        window.location.href = data.data.url;
      } else {
        throw new Error(data.message || 'Failed to get Google OAuth URL');
      }
    } catch (error) {
      console.error('Google auth error:', error);
      alert('שגיאה בהתחברות עם Google. אנא נסה שוב.');
      setIsGoogleLoading(false);
    }
  };

  const handleEmailLogin = () => {
    router.push(`/${locale}/auth/register`);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Modal
      onClose={onClose}
      title={t('title')}
      iconHeader={<Lock className="w-5 h-5 text-primary" />}
      subtitle={t('subtitle')}
      size="md"
    >
      <div className="p-6 space-y-4" dir="rtl">
        <p className="text-text-secondary text-sm leading-relaxed">
          {t('description')}
        </p>

        <div className="flex flex-col gap-3 pt-4">
          <GoogleAuthButton
            type="register"
            onGoogleAuth={handleGoogleAuth}
            disabled={isGoogleLoading}
            isLoading={isGoogleLoading}
          />

          <Button
            variant="secondary"
            size="lg"
            onClick={handleEmailLogin}
            icon={<Mail className="w-5 h-5" />}
            className="w-full justify-center"
          >
            {t('register')}
          </Button>
        </div>

        <p className="text-text-muted text-xs text-center pt-2">
          {t('footer')}
        </p>
      </div>
    </Modal>
  );
}
