'use client';

import { useState } from 'react';
import { useRouter } from '../../../../i18n/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '../../../../store/authStore';
import { useGuestListsStore } from '../../../../store/guestListsStore';
import { apiClient } from '../../../../lib/api';
import { migrateGuestLists } from '../../../../lib/migration';
import { useNotification } from '../../../../contexts/NotificationContext';
import { Link as IntlLink } from '../../../../i18n/navigation';
import { GoogleAuthButton } from '../../../../components/auth/GoogleAuthButton';
import { useParams } from 'next/navigation';
import { Button, Input, LoadingState } from '../../../../components/common';
import { ArrowIcon } from '../../../../components/common/Arrow';
import { createLoginSchema } from '../../../../lib/schemas';
import { useAuthRedirect } from '@/hooks/useAuthRedirect';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const router = useRouter();
  const params = useParams();
  const { setUser, isAuthenticated, authReady } = useAuthStore();
  const { showSuccess, handleApiError } = useNotification();
  const t = useTranslations('auth');
  const locale = params?.locale as string || 'he';

  const loginSchema = createLoginSchema(t);
  type LoginForm = z.infer<typeof loginSchema>;

    useAuthRedirect({
      redirectTo: '/dashboard',
      requireAuth: false,
    });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  if (!authReady) {
    return <LoadingState variant="page" size="lg" message={t('loading')} />;
  }

  if (isAuthenticated) {
    return null;
  }

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      const response = await apiClient.login(data.email, data.password);
      setUser(response.user);
      
      const guestLists = useGuestListsStore.getState().lists;
      if (guestLists && guestLists.length > 0) {
        try {
          const migrated = await migrateGuestLists();
          if (migrated) {
            console.log('Guest lists migrated successfully');
          }
        } catch (migrationError) {
          console.error('Migration error (non-blocking):', migrationError);
        }
      }
      
      showSuccess('auth.loginSuccess');
      router.push('/dashboard');
    } catch (error) {
      if (error && typeof error === 'object' && 'response' in error) {
        const apiError = error as { response?: { data?: { isEmailVerified?: boolean } } };
        if (apiError.response?.data?.isEmailVerified === false) {
          router.push(`/auth/verify-email?email=${encodeURIComponent(data.email)}&status=emailNotVerified`);
          return;
        }
      }
      if (error instanceof Error) {
        handleApiError(error);
      } else {
        handleApiError(new Error(t('loginError')));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setIsGoogleLoading(true);
    try {
      const callbackUrl = `${window.location.origin}/${locale}/auth/callback`;
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/google/url?callback=${encodeURIComponent(callbackUrl)}`);
      const data = await response.json();
      if (data.success && data.data.url) {
        window.location.href = data.data.url;
      } else {
        throw new Error(data.message || t('googleAuthError'));
      }
    } catch (error) {
      if (error instanceof Error) {
        handleApiError(error);
      } else {
        handleApiError(new Error(t('googleAuthError')));
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-[var(--color-surface)] via-[var(--color-background)] to-[var(--color-status-secondary-soft)]">
      {/* Animated Background Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 inset-inline-start-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse-soft" />
        <div className="absolute bottom-20 inset-inline-end-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse-soft" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-accent/5 rounded-full blur-3xl animate-pulse-soft" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative container mx-auto px-4 py-8 flex justify-center items-center min-h-screen">
        <div className="w-full max-w-md">
          {/* Back Button & Header */}
          <div className="mb-8">
            <IntlLink
              href="/welcome"
              className="inline-flex items-center text-text-primary hover:text-primary transition-all duration-200 hover:gap-3 gap-2"
            >
              <ArrowIcon className="w-5 h-5" />
              <span className="text-sm font-medium">{t('navigation.back')}</span>
            </IntlLink>
            <div className="text-center">
              <h1 className="text-4xl font-bold text-text-primary">
                {t('login')}
              </h1>
              <p className="text-text-muted text-lg">{t('loginToAccount')}</p>
            </div>
          </div>

          {/* Glass Card */}
          <div className="bg-card/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-border/50 p-8 animate-fade-in-up">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <Input
                  {...register('email')}
                  type="email"
                  id="email"
                  placeholder={t('emailPlaceholder')}
                  label={t('email')}
                  variant="outlined"
                  className="h-12"
                  error={errors.email?.message}
              />

                <Input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  placeholder={t('passwordPlaceholder')}
                  label={t('password')}
                  error={errors.password?.message}
                  variant="outlined"
                  className="h-12"
                  iconTwo={
                  <button
                    type="button"
                    aria-label={showPassword ? t('hidePassword') : t('showPassword')}
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                  }/>
            <Button
              variant="primary"
              size="lg"
              disabled={isLoading || isGoogleLoading}
              fullWidth
              loading={isLoading}
              type="submit"
              className="shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {isLoading ? t('loading') : t('loginButton')}
            </Button>
          </form>

          <div className="my-3 flex items-center">
            <div className="flex-1 border-t border-border/30"></div>
            <span className="px-4 text-sm text-text-muted font-medium">{t('welcome.or')}</span>
            <div className="flex-1 border-t border-border/30"></div>
          </div>

          <GoogleAuthButton 
            type="login" 
            onGoogleAuth={handleGoogleAuth}
            disabled={isGoogleLoading || isLoading}
            isLoading={isGoogleLoading}
          />

          <div className="text-center mt-6">
            <p className="text-text-muted">
              {t('noAccount')}{' '}
              <IntlLink href="/auth/register" className="text-primary hover:text-secondary font-semibold transition-all duration-200">
                {t('createAccount')}
              </IntlLink>
            </p>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
