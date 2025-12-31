import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useAuthRedirect } from '../../../hooks/useAuthRedirect';
import { useAuthStore } from '../../../store/authStore';
import { useRouter, useParams } from 'next/navigation';

// Mock dependencies
vi.mock('../../../store/authStore');
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  useParams: vi.fn(),
}));

describe('useAuthRedirect Hook', () => {
  const mockPush = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({
      push: mockPush,
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
      replace: vi.fn(),
      prefetch: vi.fn(),
    } as ReturnType<typeof useRouter>);
    vi.mocked(useParams).mockReturnValue({
      locale: 'he',
    });
  });

  it('should return auth state when initialized', () => {
    vi.mocked(useAuthStore).mockReturnValue({
      isAuthenticated: true,
      isInitialized: true,
    } as ReturnType<typeof useAuthStore>);

    const { result } = renderHook(() => useAuthRedirect());

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.isInitialized).toBe(true);
  });

  it('should redirect when requireAuth is true and user is not authenticated', async () => {
    vi.mocked(useAuthStore).mockReturnValue({
      isAuthenticated: false,
      isInitialized: true,
    } as ReturnType<typeof useAuthStore>);

    renderHook(() => useAuthRedirect({
      redirectTo: '/welcome',
      requireAuth: true,
    }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/welcome');
    });
  });

  it('should not redirect when requireAuth is true and user is authenticated', () => {
    vi.mocked(useAuthStore).mockReturnValue({
      isAuthenticated: true,
      isInitialized: true,
    } as ReturnType<typeof useAuthStore>);

    renderHook(() => useAuthRedirect({
      redirectTo: '/welcome',
      requireAuth: true,
    }));

    expect(mockPush).not.toHaveBeenCalled();
  });

  it('should redirect to dashboard when requireAuth is false and user is authenticated', async () => {
    vi.mocked(useAuthStore).mockReturnValue({
      isAuthenticated: true,
      isInitialized: true,
    } as ReturnType<typeof useAuthStore>);

    renderHook(() => useAuthRedirect({
      requireAuth: false,
    }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/he/dashboard');
    });
  });

  it('should not redirect when not initialized', () => {
    vi.mocked(useAuthStore).mockReturnValue({
      isAuthenticated: false,
      isInitialized: false,
    } as ReturnType<typeof useAuthStore>);

    renderHook(() => useAuthRedirect({
      redirectTo: '/welcome',
      requireAuth: true,
    }));

    expect(mockPush).not.toHaveBeenCalled();
  });
});

