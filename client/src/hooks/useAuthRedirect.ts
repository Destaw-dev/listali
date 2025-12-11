import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

interface UseAuthRedirectOptions {
  redirectTo?: string;
  requireAuth?: boolean;
}

export function useAuthRedirect({
  redirectTo = '/welcome',
  requireAuth = true
}: UseAuthRedirectOptions = {}) {
  const { isAuthenticated, isInitialized } = useAuthStore();
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;

  useEffect(() => {
    if (!isInitialized) return;

    if (requireAuth && !isAuthenticated) {
      // Redirect unauthenticated users
      router.push(`${redirectTo}`);
    } else if (!requireAuth && isAuthenticated) {
      // Redirect authenticated users (for auth pages)
      router.push(`/${locale}/dashboard`);
    }
  }, [isAuthenticated, isInitialized, requireAuth, redirectTo, router]);

  return { isAuthenticated, isInitialized };
} 