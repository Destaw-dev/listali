'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { AxiosError } from 'axios';
import { Eye, EyeOff, Mail, Lock, User, UserCheck } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuthStore } from '../../../../store/authStore';
import { apiClient } from '../../../../lib/api';
import { useNotification } from '../../../../contexts/NotificationContext';
import { Link as IntlLink } from '../../../../i18n/navigation';
import { GoogleAuthButton } from '../../../../components/auth/GoogleAuthButton';
import { ArrowIcon } from '../../../../components/common/Arrow';
import { Button, Input } from '../../../../components/common';
import { mapInviteErrorToTranslationKey } from '../../../../lib/utils';
import { createRegisterSchema } from '../../../../lib/schemas';

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const params = useParams();
  const { isAuthenticated, isInitialized, setUser } = useAuthStore();
  const { showSuccess, showWarning, handleApiError } = useNotification();
  const t = useTranslations('auth');
  const locale = params?.locale as string || 'he';

  const registerSchema = createRegisterSchema(t);
  type RegisterForm = z.infer<typeof registerSchema>;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-secondary">{t('loading')}</p>
        </div>
      </div>
    );
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
        router.push(`/${locale}/auth/verify-email?inviteError=${encodeURIComponent(response.inviteError)}`);
        return;
      } else {
        showSuccess('auth.registerSuccess');

      }
      
      if (response.groupJoined) {
        setUser(response.user);
        router.push(`/${locale}/groups/${response.groupJoined}`);
        return;
      } else {
        router.push(`/${locale}/auth/verify-email?email=${encodeURIComponent(data.email)}`);
        return;
      }
    } catch (error) {
      if (error instanceof Error || error instanceof AxiosError) {
        handleApiError(error);
      } else {
        handleApiError(new Error('An unexpected error occurred'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const inviteCode = searchParams.get('inviteCode');
      
      const callbackUrlBase = `${window.location.origin}/${locale}/auth/callback`;
      const callbackUrl = inviteCode 
        ? `${callbackUrlBase}?inviteCode=${encodeURIComponent(inviteCode)}`
        : callbackUrlBase;
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/google/url?callback=${encodeURIComponent(callbackUrl)}`);
      const data = await response.json();
      
      if (data.success && data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.message || 'Failed to get Google OAuth URL');
      }
    } catch (error) {
      if (error instanceof Error || error instanceof AxiosError) {
        handleApiError(error);
      } else {
        handleApiError(new Error('Failed to get Google OAuth URL'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 text-text-primary bg-card">
      <div className="w-full max-w-md bg-card">
        <div className="text-center flex items-center justify-center">
          <IntlLink
            href='/welcome'
            className="inline-flex items-center text-text-primary hover:text-primary-600 mb-6 transition-colors"
          >
            <ArrowIcon className="w-5 h-5 mx-2" />
          </IntlLink>
          <div>
            <h1 className="text-3xl font-bold text-text-primary mb-3">{t('register')}</h1>
            <p className="text-secondary text-lg">{t('createAccount')}</p>
          </div>
        </div>

        <div className="mobile-card">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Input
              {...register('firstName')}
              type="text"
              id="firstName"
              placeholder={t('firstNamePlaceholder')}
              icon={<User className="w-5 h-5 text-muted" />}
              label={t('firstName')}
              error={errors.firstName?.message}
            />

            <Input
              {...register('lastName')}
              type="text"
              id="lastName"
              placeholder={t('lastNamePlaceholder')}
              icon={<User className="w-5 h-5 text-muted" />}
              label={t('lastName')}
              error={errors.lastName?.message}
            />

            <Input
              {...register('username')}
              type="text"
              id="username"
              placeholder={t('usernamePlaceholder')}
              icon={<UserCheck className="w-5 h-5 text-muted" />}
              label={t('username')}
              error={errors.username?.message}
            />

            <Input
              {...register('email')}
              type="email"
              id="email"
              placeholder={t('emailPlaceholder')}
              icon={<Mail className="w-5 h-5 text-muted" />}
              label={t('email')}
              error={errors.email?.message}
            />  

            <Input
              {...register('password')}
              type={showPassword ? 'text' : 'password'}
              id="password"
              placeholder={t('passwordPlaceholder')}
              icon={<Lock className="w-5 h-5 text-muted" />}
              label={t('password')}
              error={errors.password?.message}
              iconTwo={
                <span
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="text-muted hover:text-secondary transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </span>
              }
            />

            <Input
              {...register('confirmPassword')}
              type={showConfirmPassword ? 'text' : 'password'}
              id="confirmPassword"
              placeholder={t('confirmPasswordPlaceholder')}
              icon={<Lock className="w-5 h-5 text-muted" />}
              label={t('confirmPassword')}
              error={errors.confirmPassword?.message}
              iconTwo={
                <span
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="text-muted hover:text-secondary transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5 text-muted hover:text-secondary transition-colors" /> : <Eye className="w-5 h-5 text-muted hover:text-secondary transition-colors" />}
                </span>
              }
            />

            <Button
              variant="primary"
              size="lg"
              disabled={isLoading}
              fullWidth
              loading={isLoading}
              type="submit"
            >
              {isLoading ? t('loading') : t('registerButton')}
            </Button>
          </form>

          <div className="my-5 flex items-center">
            <div className="flex-1 border-t border-border-light"></div>
            <span className="px-4 text-sm text-muted">{t('welcome.or')}</span>
            <div className="flex-1 border-t border-border-light"></div>
          </div>

          <GoogleAuthButton 
            type="register" 
            onGoogleAuth={handleGoogleAuth}
            isLoading={isLoading}
          />

          <div className="text-center mt-5">
            <p className="text-secondary">
              {t('hasAccount')}{' '}
              <IntlLink href="/auth/login" className="text-primary-800 hover:text-primary-700 font-semibold transition-colors">
                {t('loginToAccount')}
              </IntlLink>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 