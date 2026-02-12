import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useRouter } from '../i18n/navigation';
import { useAuthStore } from '../store/authStore';

interface UseAuthRedirectOptions {
  redirectTo?: string;
  requireAuth?: boolean;
}

/**
 * useAuthRedirect: runs redirect in useEffect. Returns `safeToShow: true` only
 * after the effect has run and we did NOT redirect, so the page can avoid
 * flashing content before redirect.
 */
export function useAuthRedirect({
  redirectTo = '/welcome',
  requireAuth = true
}: UseAuthRedirectOptions = {}) {
  const { isAuthenticated, authReady } = useAuthStore();
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const [safeToShow, setSafeToShow] = useState(false);

  useEffect(() => {
    if (!authReady) return;

    if (requireAuth && !isAuthenticated) {
      const pathWithoutLocale = redirectTo.startsWith(`/${locale}/`)
        ? redirectTo.replace(`/${locale}`, '')
        : redirectTo;
      router.push(pathWithoutLocale);
      return;
    }
    if (!requireAuth && isAuthenticated) {
      router.push('/dashboard');
      return;
    }

    setSafeToShow(true);
  }, [isAuthenticated, authReady, requireAuth, redirectTo, router, locale]);

  return { isAuthenticated, isReady: authReady, safeToShow };
}
