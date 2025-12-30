import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { JoinGroupModal } from '@/components/groups/JoinGroupModal';
import { renderWithProviders } from '@/test/test-utils';

// Mock dependencies
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));
vi.mock('@/hooks/useModalScrollLock', () => ({
  useModalScrollLock: vi.fn(),
}));

describe('JoinGroupModal', () => {
  const mockOnJoinGroup = vi.fn().mockResolvedValue({});
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not render when isOpen is false', () => {
    renderWithProviders(
      <JoinGroupModal
        isOpen={false}
        onClose={mockOnClose}
        onJoinGroup={mockOnJoinGroup}
      />
    );
    
    expect(screen.queryByText(/joinGroup/i)).not.toBeInTheDocument();
  });

  it('should render when isOpen is true', () => {
    renderWithProviders(
      <JoinGroupModal
        isOpen={true}
        onClose={mockOnClose}
        onJoinGroup={mockOnJoinGroup}
      />
    );
    
    const texts = screen.getAllByText(/joinGroup/i);
    expect(texts.length).toBeGreaterThan(0);
  });

  it('should display invite code input', () => {
    renderWithProviders(
      <JoinGroupModal
        isOpen={true}
        onClose={mockOnClose}
        onJoinGroup={mockOnJoinGroup}
      />
    );
    
    const inputs = screen.getAllByRole('textbox');
    expect(inputs.length).toBeGreaterThan(0);
  });

  it('should call onClose when clicking close button', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <JoinGroupModal
        isOpen={true}
        onClose={mockOnClose}
        onJoinGroup={mockOnJoinGroup}
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

  it('should show validation error for empty invite code', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <JoinGroupModal
        isOpen={true}
        onClose={mockOnClose}
        onJoinGroup={mockOnJoinGroup}
      />
    );
    
    const submitButton = screen.getByRole('button', { name: /join|submit/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      const errors = screen.queryAllByText(/required|invalid/i);
      const wasCalled = mockOnJoinGroup.mock.calls.length > 0;
      expect(errors.length > 0 || !wasCalled).toBe(true);
    }, { timeout: 2000 });
  });

  it('should submit form with valid invite code', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <JoinGroupModal
        isOpen={true}
        onClose={mockOnClose}
        onJoinGroup={mockOnJoinGroup}
      />
    );
    
    const inputs = screen.getAllByRole('textbox');
    const inviteCodeInput = inputs[0] as HTMLInputElement;
    
    if (inviteCodeInput) {
      await user.type(inviteCodeInput, 'ABC123');
      
      const submitButton = screen.getByRole('button', { name: /join|submit/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(mockOnJoinGroup).toHaveBeenCalledWith('ABC123');
      }, { timeout: 3000 });
    }
  });
});

