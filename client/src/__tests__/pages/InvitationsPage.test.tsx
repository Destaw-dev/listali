import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, createMockMutationResult } from '../../test/test-utils';
import InvitationsPage from '../../app/[locale]/invitations/page';
import { useInvitations, useAcceptInvitation, useDeclineInvitation } from '../../hooks/useInvitations';

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

vi.mock('../../hooks/useInvitations');
vi.mock('../../hooks/useAuthRedirect', () => ({
  useAuthRedirect: () => ({
    isAuthenticated: true,
    isInitialized: true,
  }),
}));
vi.mock('next/navigation', () => ({
  useParams: () => ({ locale: 'he' }),
}));
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

describe('InvitationsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useInvitations).mockReturnValue({
      data: mockInvitations,
      isLoading: false,
      error: null,
    } as ReturnType<typeof useInvitations>);
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
});

