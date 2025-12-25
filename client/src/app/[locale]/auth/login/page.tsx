'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/store/authStore';
import { apiClient } from '@/lib/api';
import { useNotification } from '@/contexts/NotificationContext';
import { Link as IntlLink } from '@/i18n/navigation';
import { GoogleAuthButton } from '@/components/auth/GoogleAuthButton';
import { useParams } from 'next/navigation';
import { Button, Input } from '@/components/common';
import { ArrowIcon } from '@/components/common/Arrow';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const params = useParams();
  const { setUser, isAuthenticated, isInitialized } = useAuthStore();
  const { showSuccess, handleApiError } = useNotification();
  const t = useTranslations('auth');
  const locale = params?.locale as string || 'he';
  const loginSchema = z.object({
    email: z.string().email(t('emailInvalid')),
    password: z.string().min(6, t('passwordMinLength')),
  });

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
      router.push(`/${locale}/dashboard`);
    }
  }, [isAuthenticated, isInitialized, locale, router]);

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
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
      showSuccess('auth.loginSuccess');
      router.push(`/${locale}/dashboard`);
    } catch (error: unknown) {
      const apiError = error as { response?: { data?: { isEmailVerified?: boolean } } };
      console.log('error.isEmailVerified', apiError.response?.data?.isEmailVerified);
      if (apiError.response?.data?.isEmailVerified === false) {
        router.push(`/${locale}/auth/verify-email?email=${encodeURIComponent(data.email)}&&status=emailNotVerified`);
        return;
      } else {
        handleApiError(error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    try {
      const callbackUrl = `${window.location.origin}/${locale}/auth/callback`;
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/google/url?callback=${encodeURIComponent(callbackUrl)}`);
      const data = await response.json();
      
      if (data.success && data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.message || 'Failed to get Google OAuth URL');
      }
    } catch (error: unknown) {
      handleApiError(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-54px)] bg-surface flex justify-center p-4 pt-5">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 flex items-center justify-center">
          <IntlLink
            href={`/welcome`}
            className="inline-flex items-center text-primary hover:text-primary-600 mb-6 transition-colors"
          >
            <ArrowIcon className="w-5 h-5 mx-2" />
          </IntlLink>
          <div>
            <h1 className="text-3xl font-bold text-primary mb-3">{t('auth.login')}</h1>
            <p className="text-secondary text-lg">{t('auth.loginToAccount')}</p>
          </div>
        </div>

        <div className="mobile-card">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <Input
                  {...register('email')}
                  type="email"
                  id="email"
                  placeholder={t('auth.emailPlaceholder')}
                  icon={<Mail className="w-4 h-4 text-muted" />}
                  label={t('auth.email')}
                  error={errors.email?.message}
              />

                <Input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  placeholder={t('auth.passwordPlaceholder')}
                  icon={<Lock className="w-4 h-4 text-muted" />}
                  label={t('auth.password')}
                  error={errors.password?.message}
                  iconTwo={
                  <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-muted hover:text-secondary transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
                  }/>
            <Button
              variant="primary"
              size="lg"
              disabled={isLoading}
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
            isLoading={isLoading}
          />

          <div className="text-center mt-5">
            <p className='text-secondary'>
              {t('auth.noAccount')}{' '}
              <IntlLink href="/auth/register" className="text-primaryT-600 hover:text-primary-700 font-semibold transition-colors">
                {t('auth.createAccount')}
              </IntlLink>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 