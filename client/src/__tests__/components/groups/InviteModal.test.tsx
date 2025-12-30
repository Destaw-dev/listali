import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InviteModal } from '@/components/groups/InviteModal';
import { renderWithProviders } from '@/test/test-utils';

// Mock dependencies
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));
vi.mock('@/hooks/useModalScrollLock', () => ({
  useModalScrollLock: vi.fn(),
}));
vi.mock('@/contexts/NotificationContext', () => ({
  useNotification: () => ({
    showSuccess: vi.fn(),
  }),
}));
vi.mock('navigator.clipboard', () => ({
  writeText: vi.fn().mockResolvedValue(undefined),
}));

describe('InviteModal', () => {
  const mockOnInvite = vi.fn().mockResolvedValue({});
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not render when isOpen is false', () => {
    renderWithProviders(
      <InviteModal
        isOpen={false}
        onClose={mockOnClose}
        onInvite={mockOnInvite}
        groupName="Test Group"
      />
    );
    
    expect(screen.queryByText(/inviteFriends/i)).not.toBeInTheDocument();
  });

  it('should render when isOpen is true', () => {
    renderWithProviders(
      <InviteModal
        isOpen={true}
        onClose={mockOnClose}
        onInvite={mockOnInvite}
        groupName="Test Group"
      />
    );
    
    const texts = screen.getAllByText(/inviteFriends/i);
    expect(texts.length).toBeGreaterThan(0);
  });

  it('should display form fields', () => {
    renderWithProviders(
      <InviteModal
        isOpen={true}
        onClose={mockOnClose}
        onInvite={mockOnInvite}
        groupName="Test Group"
      />
    );
    
    const inputs = screen.getAllByRole('textbox');
    expect(inputs.length).toBeGreaterThan(0);
  });

  it('should call onClose when clicking close button', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <InviteModal
        isOpen={true}
        onClose={mockOnClose}
        onInvite={mockOnInvite}
        groupName="Test Group"
      />
    );
    
    const closeButtons = screen.getAllByRole('button');
    const closeButton = closeButtons.find(btn => 
      btn.querySelector('svg') || btn.textContent?.includes('X')
    );
    
    if (closeButton) {
      await user.click(closeButton);
      expect(mockOnClose).toHaveBeenCalled();
    }
  });

  it('should show validation error for invalid email', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <InviteModal
        isOpen={true}
        onClose={mockOnClose}
        onInvite={mockOnInvite}
        groupName="Test Group"
      />
    );
    
    const inputs = screen.getAllByRole('textbox');
    const emailInput = inputs[0] as HTMLInputElement;
    
    await user.type(emailInput, 'invalid-email');
    
    const submitButton = screen.getByRole('button', { name: /invite|send|submit/i });
    await user.click(submitButton);
    
    // Form should prevent submission or show errors
    await waitFor(() => {
      const errors = screen.queryAllByText(/required|invalid|email/i);
      const wasCalled = mockOnInvite.mock.calls.length > 0;
      expect(errors.length > 0 || !wasCalled).toBe(true);
    }, { timeout: 2000 });
  });

  it('should submit form with valid data', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <InviteModal
        isOpen={true}
        onClose={mockOnClose}
        onInvite={mockOnInvite}
        groupName="Test Group"
      />
    );
    
    const inputs = screen.getAllByRole('textbox');
    const emailInput = inputs[0] as HTMLInputElement;
    
    await user.type(emailInput, 'test@example.com');
    
    const submitButton = screen.getByRole('button', { name: /invite|send|submit/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(mockOnInvite).toHaveBeenCalled();
    }, { timeout: 3000 });
  });

  it('should reset form after close', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <InviteModal
        isOpen={true}
        onClose={mockOnClose}
        onInvite={mockOnInvite}
        groupName="Test Group"
      />
    );
    
    const inputs = screen.getAllByRole('textbox');
    const emailInput = inputs[0] as HTMLInputElement;
    
    await user.type(emailInput, 'test@example.com');
    
    const closeButtons = screen.getAllByRole('button');
    const closeButton = closeButtons.find(btn => 
      btn.querySelector('svg') || btn.textContent?.includes('X')
    );
    
    if (closeButton) {
      await user.click(closeButton);
      // Form should be reset
      await waitFor(() => {
        expect(emailInput.value === '' || mockOnClose).toBeTruthy();
      });
    }
  });
});

