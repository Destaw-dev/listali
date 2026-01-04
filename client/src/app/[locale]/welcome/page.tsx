'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '../../../store/authStore';
import { ShoppingCart, Users, Zap } from 'lucide-react';
import { Button } from '../../../components/common/Button';

export default function WelcomePage() {
  const t = useTranslations();
  const router = useRouter();
  const params = useParams();
  const { isAuthenticated, isInitialized } = useAuthStore();
  const locale = params?.locale as string || 'he';

  useEffect(() => {
    if (isInitialized && isAuthenticated) {
      router.push(`/${locale}/dashboard`);
    }
  }, [isAuthenticated, isInitialized, router, locale]);

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-secondary">{t('auth.loading')}</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-card text-text-primary">
      <div className="container mx-auto px-4 py-5">
        <div className="text-center mb-12 shadow-md rounded-lg bg-surface justify-center gap-4 py-5">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary rounded-full">
            <ShoppingCart className="w-10 h-10 text-text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold  bg-gradient-to-r from-primary-500 to-primary-700 rounded-full p-2 text-transparent bg-clip-text">
            {t('welcome.title')}
          </h1>
          <p className="text-lg md:text-xl text-secondary max-w-3xl mx-auto leading-relaxed">
            {t('welcome.subtitle')}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-5">
          <div className="text-center bg-surface shadow-md rounded-lg py-4">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-success rounded-xl mb-6">
              <Users className="w-8 h-8 text-text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-text-primary mb-4">
              {t('welcome.features.groups.title')}
            </h3>
            <p className="text-secondary leading-relaxed">
              {t('welcome.features.groups.description')}
            </p>
          </div>

          <div className="text-center bg-surface shadow-md rounded-lg py-4">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-500 rounded-xl mb-6">
              <ShoppingCart className="w-8 h-8 text-text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-text-primary mb-4">
              {t('welcome.features.lists.title')}
            </h3>
            <p className="text-secondary leading-relaxed">
              {t('welcome.features.lists.description')}
            </p>
          </div>

          <div className="text-center bg-surface shadow-md rounded-lg py-4">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-warning-500 rounded-xl mb-6">
              <Zap className="w-8 h-8 text-text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-text-primary mb-4">
              {t('welcome.features.realtime.title')}
            </h3>
            <p className="text-secondary leading-relaxed">
              {t('welcome.features.realtime.description')}
            </p>
          </div>
        </div>

        <div className="text-center space-y-1">

          <Button
            variant="primary"
            onClick={() => router.push(`/${locale}/auth/login`)}
            size="lg"
          >
            {t('welcome.loginButton')}
          </Button>
          <div className="text-text-muted text-lg">{t('welcome.or')}</div>
          
          <Button
            variant="outlineBlue"
            onClick={() => router.push(`/${locale}/auth/register`)}
            size="lg"
          >
            {t('welcome.registerButton')}
          </Button>
        </div>
      </div>
    </div>
  );
} 