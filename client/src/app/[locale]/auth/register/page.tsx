'use client';

import { useState } from 'react';
import { useRouter } from '../../../../i18n/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { AxiosError } from 'axios';
import { Eye, EyeOff } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuthStore } from '../../../../store/authStore';
import { apiClient } from '../../../../lib/api';
import { useNotification } from '../../../../contexts/NotificationContext';
import { Link as IntlLink } from '../../../../i18n/navigation';
import { GoogleAuthButton } from '../../../../components/auth/GoogleAuthButton';
import { ArrowIcon } from '../../../../components/common/Arrow';
import { Button, Input, LoadingState } from '../../../../components/common';
import { mapInviteErrorToTranslationKey } from '../../../../lib/utils';
import { createRegisterSchema } from '../../../../lib/schemas';
import { useAuthRedirect } from '@/hooks/useAuthRedirect';

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const router = useRouter();
  const params = useParams();
  const { isAuthenticated, authReady, setUser } = useAuthStore();
  const { showSuccess, showWarning, handleApiError } = useNotification();
  const t = useTranslations('auth');
  const locale = params?.locale as string || 'he';

  const registerSchema = createRegisterSchema(t);
  type RegisterForm = z.infer<typeof registerSchema>;

  useAuthRedirect({
    redirectTo: '/dashboard',
    requireAuth: false,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  if (!authReady) {
    return <LoadingState variant="page" size="lg" message={t('loading')} />;
  }

  if (isAuthenticated) {
    return null;
  }

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true);
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const inviteCode = searchParams.get('inviteCode');
      
      const response = await apiClient.register({
        firstName: data.firstName,
        lastName: data.lastName,
        username: data.username,
        email: data.email,
        password: data.password,
        inviteCode: inviteCode || undefined,
      });
      
      if (response.inviteError) {
        const translationKey = mapInviteErrorToTranslationKey(response.inviteError);
        showWarning(translationKey);
        router.push(`/auth/verify-email?inviteError=${encodeURIComponent(response.inviteError)}`);
        return;
      } else {
        showSuccess('auth.registerSuccess');

      }
      
      if (response.groupJoined) {
        setUser(response.user);
        router.push(`/groups/${response.groupJoined}`);
        return;
      } else {
        router.push(`/auth/verify-email?email=${encodeURIComponent(data.email)}`);
        return;
      }
    } catch (error) {
      if (error instanceof Error || error instanceof AxiosError) {
        handleApiError(error);
      } else {
        handleApiError(new Error(t('registerError')));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setIsGoogleLoading(true);
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const inviteCode = searchParams.get('inviteCode');
      const callbackUrl = inviteCode 
        ? `${window.location.origin}/${locale}/auth/callback?inviteCode=${encodeURIComponent(inviteCode)}`
        : `${window.location.origin}/${locale}/auth/callback`;
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/google/url?callback=${encodeURIComponent(callbackUrl)}&inviteCode=${encodeURIComponent(inviteCode || '')}`);
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
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-b from-background via-surface to-background">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-28 left-1/2 h-80 w-[44rem] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
      </div>

      <div className="relative container mx-auto px-4 py-8 flex justify-center items-center min-h-screen">
        <div className="w-full max-w-lg">
          <div className="mb-6">
            <IntlLink
              href="/welcome"
              className="mb-6 inline-flex items-center gap-2 text-text-primary hover:text-primary transition-all duration-200"
            >
              <ArrowIcon className="w-5 h-5" />
              <span className="text-sm font-medium">{t('navigation.back')}</span>
            </IntlLink>
            <div className="space-y-2 text-center">
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-text-primary">
                {t('register')}
              </h1>
              <p className="mx-auto max-w-md text-base md:text-lg text-text-muted">{t('createAccount')}</p>
            </div>
          </div>

          <div className="animate-fade-in-up rounded-2xl border border-border/60 bg-card/95 p-6 shadow-xl sm:p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  {...register('firstName')}
                  type="text"
                  id="firstName"
                  placeholder={t('firstNamePlaceholder')}
                  label={t('firstName') + ' *'}
                  error={errors.firstName?.message}
                  variant="outlined"
                  className='h-12'
                />

                <Input
                  {...register('lastName')}
                  type="text"
                  id="lastName"
                  placeholder={t('lastNamePlaceholder')}
                  label={t('lastName') + ' *'}
                  error={errors.lastName?.message}
                  variant="outlined"
                  className="h-12"
                />
              </div>

              <Input
                {...register('username')}
                type="text"
                id="username"
                placeholder={t('usernamePlaceholder')}
                label={t('username') + ' *'}
                error={errors.username?.message}
                variant="outlined"
                className="h-12"
              />

              <Input
                {...register('email')}
                type="email"
                id="email"
                placeholder={t('emailPlaceholder')}
                label={t('email') + ' *'}
                error={errors.email?.message}
                variant="outlined"
                className="h-12"
              />

              <Input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                id="password"
                placeholder={t('passwordPlaceholder')}
                label={t('password') + ' *'}
                error={errors.password?.message}
                variant="outlined"
                className="h-12"
                iconTwo={
                  <button
                    type="button"
                    aria-label={showPassword ? t('hidePassword') : t('showPassword')}
                    aria-pressed={showPassword}
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="rounded-md text-text-muted hover:text-text-secondary transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                }
              />

              <Input
                {...register('confirmPassword')}
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                placeholder={t('confirmPasswordPlaceholder')}
                label={t('confirmPassword') + ' *'}
                error={errors.confirmPassword?.message}
                variant="outlined"
                className="h-12"
                iconTwo={
                  <button
                    type="button"
                    aria-label={showConfirmPassword ? t('hidePassword') : t('showPassword')}
                    aria-pressed={showConfirmPassword}
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="rounded-md text-text-muted hover:text-text-secondary transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                }
              />

              <Button
                variant="primary"
                size="lg"
                disabled={isLoading || isGoogleLoading}
                fullWidth
                loading={isLoading}
                type="submit"
                className="mt-2 h-12 shadow-md hover:shadow-lg transition-all duration-200"
              >
                {isLoading ? t('loading') : t('registerButton')}
              </Button>
            </form>

            <div className="my-3 flex items-center">
              <div className="flex-1 border-t border-border/40"></div>
              <span className="px-4 text-sm font-medium text-text-muted">{t('welcome.or')}</span>
              <div className="flex-1 border-t border-border/40"></div>
            </div>

            <GoogleAuthButton 
              type="register" 
              onGoogleAuth={handleGoogleAuth}
              disabled={isGoogleLoading || isLoading}
              isLoading={isGoogleLoading}
            />

            <div className="mt-6 text-center">
              <p className="text-text-muted">
                {t('hasAccount')}{' '}
                <IntlLink href="/auth/login" className="font-semibold text-primary hover:text-secondary transition-all duration-200">
                  {t('loginToAccount')}
                </IntlLink>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
