'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Mail, Lock, User, UserCheck } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/store/authStore';
import { apiClient } from '@/lib/api';
import { useNotification } from '@/contexts/NotificationContext';
import { Link as IntlLink } from '@/i18n/navigation';
import { GoogleAuthButton } from '@/components/auth/GoogleAuthButton';
import { useParams } from 'next/navigation';
import { ArrowIcon } from '@/components/common/Arrow';
import { Button, Input } from '@/components/common';


export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const params = useParams();
  const { isAuthenticated, isInitialized } = useAuthStore();
  const { showSuccess, handleApiError } = useNotification();
  const t = useTranslations('auth');
  const locale = params?.locale as string || 'he';

  const registerSchema = z.object({
    firstName: z.string().min(2, t('firstNameMinLength')),
    lastName: z.string().min(2, t('lastNameMinLength')),
    username: z.string().min(3, t('usernameMinLength')),
    email: z.string().email(t('emailInvalid')),
    password: z.string().min(6, t('passwordMinLength')),
    confirmPassword: z.string(),
  }).refine((data) => data.password === data.confirmPassword, {
    message: t('passwordsDoNotMatch'),
    path: ['confirmPassword'],
  });

type RegisterForm = z.infer<typeof registerSchema>;



  // Move useForm to the top, before any conditional returns
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  // Show loading while auth is initializing
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-surface safe-area-inset flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-secondary">{t('loading')}</p>
        </div>
      </div>
    );
  }

  // Don't render register page for authenticated users
  if (isAuthenticated) {
    return null;
  }

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true);
    try {
      await apiClient.register({
        firstName: data.firstName,
        lastName: data.lastName,
        username: data.username,
        email: data.email,
        password: data.password,
      });
      showSuccess('registerSuccess');
      router.push(`/${locale}/auth/verify-email?email=${encodeURIComponent(data.email)}`);
    } catch (error: any) {
      handleApiError(error);
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
    } catch (error: any) {
      handleApiError(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface safe-area-inset flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8 flex items-center justify-center">
          <IntlLink
            href='/welcome'
            className="inline-flex items-center text-primary hover:text-primary-600 mb-6 transition-colors"
          >
            <ArrowIcon className="w-5 h-5 mx-2" />
          </IntlLink>
          <div>
            <h1 className="text-3xl font-bold text-primary mb-3">{t('register')}</h1>
            <p className="text-secondary text-lg">{t('createAccount')}</p>
          </div>
        </div>

        {/* Register Form */}
        <div className="mobile-card">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* First Name Field */}
            <Input
              {...register('firstName')}
              type="text"
              id="firstName"
              placeholder={t('firstNamePlaceholder')}
              icon={<User className="w-4 h-4 text-muted" />}
              label={t('firstName')}
              error={errors.firstName?.message}
            />

            {/* Last Name Field */}
            <Input
              {...register('lastName')}
              type="text"
              id="lastName"
              placeholder={t('lastNamePlaceholder')}
              icon={<User className="w-4 h-4 text-muted" />}
              label={t('lastName')}
              error={errors.lastName?.message}
            />

            {/* Username Field */}
            <Input
              {...register('username')}
              type="text"
              id="username"
              placeholder={t('usernamePlaceholder')}
              icon={<UserCheck className="w-4 h-4 text-muted" />}
              label={t('username')}
              error={errors.username?.message}
            />

            {/* Email Field */}
            <Input
              {...register('email')}
              type="email"
              id="email"
              placeholder={t('emailPlaceholder')}
              icon={<Mail className="w-4 h-4 text-muted" />}
              label={t('email')}
              error={errors.email?.message}
            />  

            {/* Password Field */}
            <Input
              {...register('password')}
              type={showPassword ? 'text' : 'password'}
              id="password"
              placeholder={t('passwordPlaceholder')}
              icon={<Lock className="w-4 h-4 text-muted" />}
              label={t('password')}
              error={errors.password?.message}
              iconTwo={
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="text-muted hover:text-secondary transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              }
            />

            {/* Confirm Password Field */}
            <Input
              {...register('confirmPassword')}
              type={showConfirmPassword ? 'text' : 'password'}
              id="confirmPassword"
              placeholder={t('confirmPasswordPlaceholder')}
              icon={<Lock className="w-4 h-4 text-muted" />}
              label={t('confirmPassword')}
              error={errors.confirmPassword?.message}
              iconTwo={
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="text-muted hover:text-secondary transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              }
            />

            {/* Submit Button */}
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

          {/* Divider */}
          <div className="my-5 flex items-center">
            <div className="flex-1 border-t border-border-light"></div>
            <span className="px-4 text-sm text-muted">{t('welcome.or')}</span>
            <div className="flex-1 border-t border-border-light"></div>
          </div>

          {/* Google Auth Button */}
          <GoogleAuthButton 
            type="register" 
            onGoogleAuth={handleGoogleAuth}
            isLoading={isLoading}
          />

          {/* Login Link */}
          <div className="text-center mt-5">
            <p className="text-secondary">
              {t('hasAccount')}{' '}
              <IntlLink href="/auth/login" className="text-primaryT-800 hover:text-primaryT-700 font-semibold transition-colors">
                {t('loginToAccount')}
              </IntlLink>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 