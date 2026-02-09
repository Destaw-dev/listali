import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useRouter } from '../i18n/navigation';
import { useAuthStore } from '../store/authStore';

interface UseAuthRedirectOptions {
  redirectTo?: string;
  requireAuth?: boolean;
}

export function useAuthRedirect({
  redirectTo = '/welcome',
  requireAuth = true
}: UseAuthRedirectOptions = {}) {
  const { isAuthenticated, isInitialized, isGuest } = useAuthStore();
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;

  useEffect(() => {
    if (!isInitialized) return;

    if (requireAuth && !isAuthenticated && !isGuest()) {
      const pathWithoutLocale = redirectTo.startsWith(`/${locale}/`) 
        ? redirectTo.replace(`/${locale}`, '') 
        : redirectTo;
      router.push(pathWithoutLocale);
    } else if (!requireAuth && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isInitialized, requireAuth, redirectTo, router, locale, isGuest]);

  return { isAuthenticated, isInitialized };
} 