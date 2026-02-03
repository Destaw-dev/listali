import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
      router.push(`${redirectTo}`);
    } else if (!requireAuth && isAuthenticated) {
      router.push(`/${locale}/dashboard`);
    }
  }, [isAuthenticated, isInitialized, requireAuth, redirectTo, router, locale, isGuest]);

  return { isAuthenticated, isInitialized };
} 