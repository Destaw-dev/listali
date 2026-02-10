import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, createMockMutationResult } from '../../test/test-utils';
import InvitationsPage from '../../app/[locale]/invitations/page';
import { useInvitations, useAcceptInvitation, useDeclineInvitation, useJoinRequests } from '../../hooks/useInvitations';

const mockInvitations = [
  {
    _id: 'inv1',
    group: {
      _id: 'group1',
      name: 'Test Group',
      description: 'Test Description',
      membersCount: 5,
    },
    invitedBy: {
      _id: 'user1',
      username: 'inviter',
      firstName: 'Test',
      lastName: 'User',
    },
    role: 'member' as const,
    invitedAt: new Date().toISOString(),
    status: 'pending' as const,
    code: 'ABC123',
  },
];

vi.mock('../../hooks/useInvitations', () => ({
  useInvitations: vi.fn(),
  useAcceptInvitation: vi.fn(),
  useDeclineInvitation: vi.fn(),
  useJoinRequests: vi.fn(),
}));
vi.mock('../../hooks/useAuthRedirect', () => ({
  useAuthRedirect: () => ({
    isAuthenticated: true,
    isInitialized: true,
  }),
}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => '/invitations',
  useParams: () => ({ locale: 'he' }),
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
  usePathname: () => '/invitations',
}));
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

const mockJoinRequests = [
  {
    _id: 'req1',
    group: {
      _id: 'group2',
      name: 'Join Request Group',
      description: 'Test Description',
      membersCount: 3,
    },
    inviteCode: 'XYZ789',
    role: 'member' as const,
    requestedAt: new Date().toISOString(),
    status: 'pending' as const,
  },
];

describe('InvitationsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useInvitations).mockReturnValue({
      data: mockInvitations,
      isLoading: false,
      error: null,
    } as ReturnType<typeof useInvitations>);
    vi.mocked(useJoinRequests).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as ReturnType<typeof useJoinRequests>);
    vi.mocked(useAcceptInvitation).mockReturnValue(
      createMockMutationResult({
        mutateAsync: vi.fn().mockResolvedValue({}),
        isPending: false,
      })
    );
    vi.mocked(useDeclineInvitation).mockReturnValue(
      createMockMutationResult({
        mutateAsync: vi.fn().mockResolvedValue({}),
        isPending: false,
      })
    );
  });

  it('should render invitations page', () => {
    renderWithProviders(<InvitationsPage />);
    const invitationTexts = screen.getAllByText(/invitations|הזמנות/i);
    expect(invitationTexts.length).toBeGreaterThan(0);
  });

  it('should display invitations list', () => {
    renderWithProviders(<InvitationsPage />);
    expect(screen.getByText(mockInvitations[0].group.name)).toBeInTheDocument();
  });

  it('should show accept button', () => {
    renderWithProviders(<InvitationsPage />);
    const acceptButton = screen.getByRole('button', { name: /accept|קבל/i });
    expect(acceptButton).toBeInTheDocument();
  });

  it('should show decline button', () => {
    renderWithProviders(<InvitationsPage />);
    const declineButton = screen.getByRole('button', { name: /decline|דחה/i });
    expect(declineButton).toBeInTheDocument();
  });

  it('should handle accept invitation', async () => {
    const mockAccept = vi.fn().mockResolvedValue({});
    vi.mocked(useAcceptInvitation).mockReturnValue(
      createMockMutationResult({
        mutateAsync: mockAccept,
        isPending: false,
      })
    );

    const user = userEvent.setup();
    renderWithProviders(<InvitationsPage />);
    
    const acceptButton = screen.getByRole('button', { name: /accept|קבל/i });
    await user.click(acceptButton);
    
    await waitFor(() => {
      expect(mockAccept).toHaveBeenCalled();
    });
  });

  it('should handle decline invitation', async () => {
    const mockDecline = vi.fn().mockResolvedValue({});
    vi.mocked(useDeclineInvitation).mockReturnValue(
      createMockMutationResult({
        mutateAsync: mockDecline,
        isPending: false,
      })
    );

    const user = userEvent.setup();
    renderWithProviders(<InvitationsPage />);
    
    const declineButton = screen.getByRole('button', { name: /decline|דחה/i });
    await user.click(declineButton);
    
    await waitFor(() => {
      expect(mockDecline).toHaveBeenCalled();
    });
  });

  it('should show loading state', () => {
    vi.mocked(useInvitations).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as ReturnType<typeof useInvitations>);

    renderWithProviders(<InvitationsPage />);
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeTruthy();
  });

  it('should show empty state when no invitations', () => {
    vi.mocked(useInvitations).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as ReturnType<typeof useInvitations>);

    renderWithProviders(<InvitationsPage />);
    const emptyState = screen.queryByText(/no invitations|noNewInvitations|אין הזמנות/i);
    expect(emptyState || screen.queryByText(/noNewInvitations/i)).toBeTruthy();
  });

  it('should display join requests section when join requests exist', () => {
    vi.mocked(useJoinRequests).mockReturnValue({
      data: mockJoinRequests,
      isLoading: false,
      error: null,
    } as ReturnType<typeof useJoinRequests>);

    renderWithProviders(<InvitationsPage />);
    expect(screen.getByText(mockJoinRequests[0].group.name)).toBeInTheDocument();
    const heading = screen.getByRole('heading', { name: /pendingJoinRequests/i });
    expect(heading).toBeInTheDocument();
    expect(screen.getByText(/waitingForApproval/i)).toBeInTheDocument();
  });

  it('should not display join requests section when no join requests', () => {
    vi.mocked(useJoinRequests).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as ReturnType<typeof useJoinRequests>);

    renderWithProviders(<InvitationsPage />);
    const joinRequestSection = screen.queryByText(/pendingJoinRequests/i);
    expect(joinRequestSection).not.toBeInTheDocument();
  });

  it('should show loading state for join requests', () => {
    vi.mocked(useJoinRequests).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as ReturnType<typeof useJoinRequests>);

    renderWithProviders(<InvitationsPage />);
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeTruthy();
  });
});

