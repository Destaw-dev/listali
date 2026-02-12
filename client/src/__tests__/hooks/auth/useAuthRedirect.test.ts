import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useAuthRedirect } from '../../../hooks/useAuthRedirect';
import { useAuthStore } from '../../../store/authStore';
import { useRouter, useParams } from 'next/navigation';
import { createMockAuthStore } from '../../../test/test-utils';

const mockPush = vi.fn();

vi.mock('../../../store/authStore');
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  useParams: vi.fn(),
}));
vi.mock('../../../i18n/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/he/dashboard',
}));

describe('useAuthRedirect Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPush.mockClear();
    vi.mocked(useParams).mockReturnValue({
      locale: 'he',
    });
  });

  it('should return auth state when initialized', async () => {
    vi.mocked(useAuthStore).mockReturnValue(createMockAuthStore({ isAuthenticated: true, authReady: true, isGuest: () => false }));

    const { result } = renderHook(() => useAuthRedirect());

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.isReady).toBe(true);
    await waitFor(() => {
      expect(result.current.safeToShow).toBe(true);
    });
  });

  it('should redirect when requireAuth is true and user is not authenticated', async () => {
    vi.mocked(useAuthStore).mockReturnValue(createMockAuthStore({ isAuthenticated: false, isInitialized: true, authMode: null }));

    renderHook(() => useAuthRedirect({
      redirectTo: '/welcome',
      requireAuth: true,
    }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalled();
    }, { timeout: 2000 });
  });

  it('should not redirect when requireAuth is true and user is authenticated', () => {
    vi.mocked(useAuthStore).mockReturnValue(createMockAuthStore({ isAuthenticated: true, isInitialized: true }));

    renderHook(() => useAuthRedirect({
      redirectTo: '/welcome',
      requireAuth: true,
    }));

    expect(mockPush).not.toHaveBeenCalled();
  });

  it('should redirect to dashboard when requireAuth is false and user is authenticated', async () => {
    vi.mocked(useAuthStore).mockReturnValue(createMockAuthStore({ isAuthenticated: true, isInitialized: true }));

    renderHook(() => useAuthRedirect({
      requireAuth: false,
    }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalled();
    }, { timeout: 2000 });
  });

  it('should not redirect when not initialized', () => {
    vi.mocked(useAuthStore).mockReturnValue(createMockAuthStore({ isAuthenticated: false, isInitialized: false }));

    renderHook(() => useAuthRedirect({
      redirectTo: '/welcome',
      requireAuth: true,
    }));

    expect(mockPush).not.toHaveBeenCalled();
  });
});

