import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/test-utils';
import WelcomePage from '@/app/[locale]/welcome/page';
import { useAuthStore } from '@/store/authStore';
import { mockUser } from '../mocks/mockData';

// Mock dependencies
vi.mock('@/store/authStore');
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
  useParams: () => ({ locale: 'he' }),
}));
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));
vi.mock('@/i18n/navigation', () => ({
  Link: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>,
}));

describe('WelcomePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render welcome page when not authenticated', () => {
    vi.mocked(useAuthStore).mockReturnValue({
      user: null,
      isAuthenticated: false,
      isInitialized: true,
    } as ReturnType<typeof useAuthStore>);

    renderWithProviders(<WelcomePage />);
    // Check for welcome text (might appear multiple times)
    const welcomeTexts = screen.getAllByText(/welcome|ברוכים/i);
    expect(welcomeTexts.length).toBeGreaterThan(0);
  });

  it('should redirect when authenticated', () => {
    vi.mocked(useAuthStore).mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      isInitialized: true,
    } as ReturnType<typeof useAuthStore>);

    renderWithProviders(<WelcomePage />);
    // Should redirect or return null
    expect(screen.queryByText(/welcome/i)).not.toBeInTheDocument();
  });

  it('should show loading state', () => {
    vi.mocked(useAuthStore).mockReturnValue({
      user: null,
      isAuthenticated: false,
      isInitialized: false,
    } as ReturnType<typeof useAuthStore>);

    renderWithProviders(<WelcomePage />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('should show login and register links', () => {
    vi.mocked(useAuthStore).mockReturnValue({
      user: null,
      isAuthenticated: false,
      isInitialized: true,
    } as ReturnType<typeof useAuthStore>);

    renderWithProviders(<WelcomePage />);
    const links = screen.getAllByRole('link');
    expect(links.length).toBeGreaterThan(0);
  });
});

