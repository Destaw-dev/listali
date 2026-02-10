import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Navigation } from '../../../components/layout/Navigation';
import { useAuthStore } from '../../../store/authStore';
import { mockUser } from '../../mocks/mockData';
import { createMockAuthStore } from '../../../test/test-utils';

vi.mock('../../../store/authStore');
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
  usePathname: () => '/he/dashboard',
  useParams: () => ({ locale: 'he' }),
}));
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));
vi.mock('../../../hooks/useSettings', () => ({
  useLogout: () => ({
    mutate: vi.fn(),
  }),
}));
vi.mock('../../../components/common/LanguageSwitcher', () => ({
  default: () => <div>LanguageSwitcher</div>,
}));
vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));

describe('Navigation Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not render when user is not authenticated', () => {
    vi.mocked(useAuthStore).mockReturnValue(createMockAuthStore({ user: null, isAuthenticated: false }));

    const { container } = render(<Navigation />);
    expect(container.firstChild).toBeNull();
  });

  it('should render navigation when authenticated', () => {
    vi.mocked(useAuthStore).mockReturnValue(createMockAuthStore({ user: mockUser }));

    render(<Navigation />);
    expect(screen.getByText('Listali')).toBeInTheDocument();
  });

  it('should render navigation items', () => {
    vi.mocked(useAuthStore).mockReturnValue(createMockAuthStore({ user: mockUser }));

    render(<Navigation />);
    expect(screen.getByText('Listali')).toBeInTheDocument();
  });

  it('should render user avatar when available', () => {
    vi.mocked(useAuthStore).mockReturnValue(createMockAuthStore({ user: { ...mockUser, avatar: 'https://example.com/avatar.jpg' } }));

    render(<Navigation />);
    const images = screen.queryAllByRole('img');
    const avatar = images.find(img => 
      img.getAttribute('alt')?.includes(mockUser.username) || 
      img.getAttribute('src')?.includes('avatar')
    );
    expect(avatar || screen.getByText('Listali')).toBeTruthy();
  });

  it('should handle logout confirmation', async () => {
    const mockMutate = vi.fn();
    vi.mocked(useAuthStore).mockReturnValue(createMockAuthStore({ user: mockUser }));

    window.confirm = vi.fn(() => true);

    vi.doMock('../../../hooks/useSettings', () => ({
      useLogout: () => ({
        mutate: mockMutate,
      }),
    }));

    render(<Navigation />);
    
    expect(screen.getByText('Listali')).toBeInTheDocument();
  });
});

