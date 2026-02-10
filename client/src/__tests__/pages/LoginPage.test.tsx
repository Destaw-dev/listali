import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../test/test-utils';
import LoginPage from '../../app/[locale]/auth/login/page';
import { apiClient } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { mockUser } from '../mocks/mockData';

vi.mock('../../lib/api');
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
vi.mock('../../contexts/NotificationContext', () => ({
  useNotification: () => ({
    showSuccess: vi.fn(),
    handleApiError: vi.fn(),
  }),
}));
vi.mock('../../components/auth/GoogleAuthButton', () => ({
  GoogleAuthButton: () => <button>Google Auth</button>,
}));
vi.mock('../../i18n/navigation', () => ({
  Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => '/login',
}));

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuthStore).mockReturnValue({
      user: null,
      isAuthenticated: false,
      isInitialized: true,
      setUser: vi.fn(),
    } as ReturnType<typeof useAuthStore>);
  });

  it('should render login form', () => {
    renderWithProviders(<LoginPage />);
    const emailInput = screen.getByPlaceholderText(/email|אימייל/i) || screen.queryByLabelText(/email/i);
    const passwordInput = screen.getByPlaceholderText(/password|סיסמה/i) || screen.queryByLabelText(/password/i);
    expect(emailInput || passwordInput).toBeTruthy();
  });

  it('should show validation errors for empty form', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);
    
    const submitButton = screen.getByRole('button', { name: /login|submit/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.queryByText(/required|invalid/i)).toBeInTheDocument();
    });
  });

  it('should submit login form with valid data', async () => {
    const mockLogin = vi.fn().mockResolvedValue({
      user: mockUser,
      accessToken: 'token123',
    });
    vi.mocked(apiClient.login).mockImplementation(mockLogin);

    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);
    
    const emailInput = screen.getByPlaceholderText(/email|אימייל/i) as HTMLInputElement;
    const passwordInput = screen.getByPlaceholderText(/password|סיסמה/i) as HTMLInputElement;
    const submitButton = screen.getByRole('button', { name: /login|submit|התחבר/i });
    
    if (emailInput && passwordInput) {
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'Password123');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'Password123');
      }, { timeout: 3000 });
    }
  });

  it('should toggle password visibility', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);
    
    const passwordInput = screen.getByPlaceholderText(/password|סיסמה/i) as HTMLInputElement;
    if (passwordInput) {
      expect(passwordInput).toHaveAttribute('type', 'password');
      
      const toggleButtons = screen.getAllByRole('button');
      const toggleButton = toggleButtons.find(btn => 
        btn.querySelector('svg') || btn.getAttribute('aria-label')?.includes('password')
      );
      
      if (toggleButton) {
        await user.click(toggleButton);
        
        await waitFor(() => {
          expect(passwordInput).toHaveAttribute('type', 'text');
        });
      }
    }
  });

  it('should redirect if already authenticated', () => {
    vi.mocked(useAuthStore).mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      isInitialized: true,
      setUser: vi.fn(),
    } as ReturnType<typeof useAuthStore>);

    renderWithProviders(<LoginPage />);
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('should show loading state', () => {
    vi.mocked(useAuthStore).mockReturnValue({
      user: null,
      isAuthenticated: false,
      isInitialized: false,
      setUser: vi.fn(),
    } as ReturnType<typeof useAuthStore>);

    renderWithProviders(<LoginPage />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });
});

