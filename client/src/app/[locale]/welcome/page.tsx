'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { ShoppingCart, Users, Zap } from 'lucide-react';
import { Link as IntlLink } from '@/i18n/navigation';

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
  }, [isAuthenticated, isInitialized]);

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-surface safe-area-inset flex items-center justify-center">
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
    <div className="min-h-screen bg-surface safe-area-inset">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary rounded-full mb-6">
            <ShoppingCart className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-primary mb-6">
            {t('welcome.title')}
          </h1>
          <p className="text-lg md:text-xl text-secondary max-w-3xl mx-auto leading-relaxed">
            {t('welcome.subtitle')}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-5">
          <div className="text-center mobile-card">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-success rounded-xl mb-6">
              <Users className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-primary mb-4">
              {t('welcome.features.groups.title')}
            </h3>
            <p className="text-secondary leading-relaxed">
              {t('welcome.features.groups.description')}
            </p>
          </div>

          <div className="text-center mobile-card">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-xl mb-6">
              <ShoppingCart className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-primary mb-4">
              {t('welcome.features.lists.title')}
            </h3>
            <p className="text-secondary leading-relaxed">
              {t('welcome.features.lists.description')}
            </p>
          </div>

          <div className="text-center mobile-card">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-secondary rounded-xl mb-6">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-primary mb-4">
              {t('welcome.features.realtime.title')}
            </h3>
            <p className="text-secondary leading-relaxed">
              {t('welcome.features.realtime.description')}
            </p>
          </div>
        </div>

        <div className="text-center space-y-1">
          <IntlLink
            href="/auth/login"
            className="btn-primary inline-flex items-center justify-center w-full md:w-auto px-12 py-4 text-lg font-semibold"
          >
            {t('welcome.loginButton')}
          </IntlLink>
          
          <div className="text-muted text-lg">{t('welcome.or')}</div>
          
          <IntlLink
            href="/auth/register"
            className="btn-outline inline-flex items-center justify-center w-full md:w-auto px-12 py-4 text-lg font-semibold"
          >
            {t('welcome.registerButton')}
          </IntlLink>
        </div>
      </div>
    </div>
  );
} 