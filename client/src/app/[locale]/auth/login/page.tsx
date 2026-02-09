'use client';

import { useEffect, useState } from 'react';
import { useRouter } from '../../../../i18n/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff,  } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '../../../../store/authStore';
import { useGuestListsStore } from '../../../../store/guestListsStore';
import { apiClient } from '../../../../lib/api';
import { migrateGuestLists } from '../../../../lib/migration';
import { useNotification } from '../../../../contexts/NotificationContext';
import { Link as IntlLink } from '../../../../i18n/navigation';
import { GoogleAuthButton } from '../../../../components/auth/GoogleAuthButton';
import { useParams } from 'next/navigation';
import { Button, Input } from '../../../../components/common';
import { ArrowIcon } from '../../../../components/common/Arrow';
import { createLoginSchema } from '../../../../lib/schemas';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const router = useRouter();
  const params = useParams();
  const { setUser, isAuthenticated, isInitialized } = useAuthStore();
  const { showSuccess, handleApiError } = useNotification();
  const t = useTranslations('auth');
  const locale = params?.locale as string || 'he';

  const loginSchema = createLoginSchema(t);
  type LoginForm = z.infer<typeof loginSchema>;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    if (isInitialized && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isInitialized, locale, router]);

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
        handleApiError(new Error('Login failed'));
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
        throw new Error(data.message || 'Failed to get Google OAuth URL');
      }
    } catch (error) {
      if (error instanceof Error) {
        handleApiError(error);
      } else {
        handleApiError(new Error('Failed to get Google OAuth URL'));
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-25px)] bg-card flex justify-center items-center p-4 pt-5 text-text-primary">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-start gap-10 sm:gap-30 ">
          <IntlLink
            href={`/welcome`}
            className="inline-flex items-center text-text-primary hover:text-text-secondary mb-6 transition-colors"
          >
            <ArrowIcon className="w-5 h-5 mx-2" />
          </IntlLink>
          <div>
            <h1 className="text-3xl font-bold text-text-primary mb-3">{t('auth.login')}</h1>
            <p className="text-text-secondary text-lg">{t('auth.loginToAccount')}</p>
          </div>
        </div>

        <div className="mobile-card">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <Input
                  {...register('email')}
                  type="email"
                  id="email"
                  placeholder={t('auth.emailPlaceholder')}
                  label={t('auth.email')}
                  error={errors.email?.message}
              />

                <Input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  placeholder={t('auth.passwordPlaceholder')}
                  label={t('auth.password')}
                  error={errors.password?.message}
                  iconTwo={
                  <span
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-text-muted hover:text-text-secondary transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </span>
                  }/>
            <Button
              variant="primary"
              size="lg"
              disabled={isLoading || isGoogleLoading}
              fullWidth
              loading={isLoading}
              type="submit"
            >
              {isLoading ? t('auth.loading') : t('auth.loginButton')}
            </Button>
          </form>

          <div className="my-5 flex items-center">
            <div className="flex-1 border-t border-border-light"></div>
            <span className="px-4 text-sm text-muted">{t('welcome.or')}</span>
            <div className="flex-1 border-t border-border-light"></div>
          </div>

          <GoogleAuthButton 
            type="login" 
            onGoogleAuth={handleGoogleAuth}
            disabled={isGoogleLoading || isLoading}
            isLoading={isGoogleLoading}
          />

          <div className="text-center mt-5">
            <p className='text-text-secondary'>
              {t('auth.noAccount')}{' '}
              <IntlLink href="/auth/register" className="text-text-primary-600 hover:text-text-primary-700 font-semibold transition-colors">
                {t('auth.createAccount')}
              </IntlLink>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 