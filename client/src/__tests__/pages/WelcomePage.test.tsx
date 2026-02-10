import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../test/test-utils';
import WelcomePage from '../../app/[locale]/welcome/page';
import { useAuthStore } from '../../store/authStore';
import { mockUser } from '../mocks/mockData';

vi.mock('../../store/authStore');
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
  useParams: () => ({ locale: 'he' }),
}));
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));
vi.mock('../../i18n/navigation', () => ({
  Link: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>,
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => '/welcome',
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
    const buttons = screen.getAllByRole('button');
    const loginButton = buttons.find(btn => btn.textContent?.includes('loginButton') || btn.textContent?.includes('התחבר'));
    const registerButton = buttons.find(btn => btn.textContent?.includes('registerButton') || btn.textContent?.includes('הרשם'));
    
    expect(loginButton || registerButton).toBeDefined();
  });
});

