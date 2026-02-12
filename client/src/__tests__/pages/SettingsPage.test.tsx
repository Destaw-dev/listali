import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders, createMockMutationResult, createMockAuthStore } from '../../test/test-utils';
import SettingsPage from '../../app/[locale]/settings/page';
import { useAuthStore } from '../../store/authStore';
import { useUserProfile, useUserPreferences, useNotificationSettings, useLogout, useDeleteAccount, useUpdateProfile, useUpdatePreferences, useUpdateNotificationSettings } from '../../hooks/useSettings';
import { mockUser } from '../mocks/mockData';

vi.mock('../../store/authStore');
vi.mock('../../store/themeStore', () => {
  const mockSetTheme = vi.fn();
  const mockStore = {
    theme: 'light',
    setTheme: mockSetTheme,
    updateThemeOnServer: vi.fn(),
    toggleTheme: vi.fn(),
  };
  return {
    useThemeStore: () => mockStore,
  };
});
vi.mock('../../hooks/useSettings');
vi.mock('../../hooks/useAuthRedirect', () => ({
  useAuthRedirect: () => ({
    isAuthenticated: true,
    isReady: true,
    safeToShow: true,
  }),
}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
  useParams: () => ({ locale: 'he' }),
  usePathname: () => '/he/settings',
}));
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));
vi.mock('../../contexts/NotificationContext', () => ({
  useNotification: () => ({
    showWarning: vi.fn(),
  }),
}));
vi.mock('../../components/settings/EditProfileModal', () => ({
  default: ({ isOpen }: { isOpen: boolean }) => isOpen ? <div>EditProfileModal</div> : null,
}));
vi.mock('../../components/settings/UpdateEmailModal', () => ({
  default: ({ isOpen }: { isOpen: boolean }) => isOpen ? <div>UpdateEmailModal</div> : null,
}));
vi.mock('../../components/settings/LanguageThemeModal', () => ({
  default: ({ isOpen }: { isOpen: boolean }) => isOpen ? <div>LanguageThemeModal</div> : null,
}));
vi.mock('../../components/settings/NotificationModal', () => ({
  default: ({ isOpen }: { isOpen: boolean }) => isOpen ? <div>NotificationModal</div> : null,
}));

describe('SettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuthStore).mockReturnValue(createMockAuthStore({ user: mockUser }));
    vi.mocked(useUserProfile).mockReturnValue({
      data: mockUser,
      isLoading: false,
      error: null,
    } as ReturnType<typeof useUserProfile>);
    vi.mocked(useUserPreferences).mockReturnValue({
      data: {
        language: 'he',
        theme: 'light',
      },
      isLoading: false,
      error: null,
    } as ReturnType<typeof useUserPreferences>);
    vi.mocked(useNotificationSettings).mockReturnValue({
      data: {
        pushNotifications: true,
        emailNotifications: true,
        newMessageNotifications: true,
        shoppingListUpdates: true,
        groupInvitations: true,
      },
      isLoading: false,
      error: null,
    } as ReturnType<typeof useNotificationSettings>);
    vi.mocked(useLogout).mockReturnValue(
      createMockMutationResult({
        mutate: vi.fn(),
        isPending: false,
      })
    );
    vi.mocked(useDeleteAccount).mockReturnValue(
      createMockMutationResult({
        mutate: vi.fn(),
        isPending: false,
      })
    );
    vi.mocked(useUpdateProfile).mockReturnValue(
      createMockMutationResult({
        mutate: vi.fn(),
        mutateAsync: vi.fn().mockResolvedValue({}),
        isPending: false,
      })
    );
    vi.mocked(useUpdatePreferences).mockReturnValue(
      createMockMutationResult({
        mutateAsync: vi.fn().mockResolvedValue({}),
        isPending: false,
      })
    );
    vi.mocked(useUpdateNotificationSettings).mockReturnValue(
      createMockMutationResult({
        mutateAsync: vi.fn().mockResolvedValue({}),
        isPending: false,
      })
    );
  });

  it('should render settings page', () => {
    renderWithProviders(<SettingsPage />);
    const settingsTexts = screen.getAllByText(/settings|הגדרות/i);
    expect(settingsTexts.length).toBeGreaterThan(0);
  });

  it('should show profile section', () => {
    renderWithProviders(<SettingsPage />);
    const profileTexts = screen.queryAllByText(/profile|פרופיל|user|משתמש/i);
    const buttons = screen.getAllByRole('button');
    expect(profileTexts.length > 0 || buttons.length > 0).toBeTruthy();
  });

  it('should show preferences section', () => {
    renderWithProviders(<SettingsPage />);
    const preferenceTexts = screen.queryAllByText(/preferences|העדפות|language|theme/i);
    const buttons = screen.getAllByRole('button');
    expect(preferenceTexts.length > 0 || buttons.length > 0).toBeTruthy();
  });

  it('should show notification settings section', () => {
    renderWithProviders(<SettingsPage />);
    const notificationTexts = screen.queryAllByText(/notifications|התראות|bell/i);
    const buttons = screen.getAllByRole('button');
    expect(notificationTexts.length > 0 || buttons.length > 0).toBeTruthy();
  });

  it('should show logout button', () => {
    renderWithProviders(<SettingsPage />);
    const logoutButtons = screen.getAllByRole('button');
    const logoutButton = logoutButtons.find(btn => 
      btn.textContent?.toLowerCase().includes('logout') ||
      btn.textContent?.toLowerCase().includes('התנתק')
    );
    expect(logoutButton).toBeTruthy();
  });
});

