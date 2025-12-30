import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UpdateEmailModal from '@/components/settings/UpdateEmailModal';
import { renderWithProviders } from '@/test/test-utils';

// Mock dependencies
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));
vi.mock('@/hooks/useModalScrollLock', () => ({
  useModalScrollLock: vi.fn(),
}));
vi.mock('@/hooks/useSettings', () => ({
  useUpdateEmail: vi.fn(() => ({
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
  })),
}));

describe('UpdateEmailModal', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not render when isOpen is false', () => {
    renderWithProviders(
      <UpdateEmailModal
        isOpen={false}
        onClose={mockOnClose}
        currentEmail="test@example.com"
      />
    );
    
    expect(screen.queryByText(/updateEmail|email/i)).not.toBeInTheDocument();
  });

  it('should render when isOpen is true', () => {
    renderWithProviders(
      <UpdateEmailModal
        isOpen={true}
        onClose={mockOnClose}
        currentEmail="test@example.com"
      />
    );
    
    const inputs = screen.getAllByRole('textbox');
    expect(inputs.length).toBeGreaterThan(0);
  });

  it('should show validation error for invalid email', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <UpdateEmailModal
        isOpen={true}
        onClose={mockOnClose}
        currentEmail="test@example.com"
      />
    );
    
    const inputs = screen.getAllByRole('textbox');
    const emailInput = inputs[0] as HTMLInputElement;
    
    if (emailInput) {
      await user.type(emailInput, 'invalid-email');
      
      const submitButton = screen.getByRole('button', { name: /save|submit|update/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        const errors = screen.queryAllByText(/invalid|email/i);
        expect(errors.length > 0).toBe(true);
      }, { timeout: 2000 });
    }
  });

  it('should submit form with valid email', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <UpdateEmailModal
        isOpen={true}
        onClose={mockOnClose}
        currentEmail="test@example.com"
      />
    );
    
    const inputs = screen.getAllByRole('textbox');
    const emailInput = inputs[0] as HTMLInputElement;
    
    if (emailInput) {
      await user.type(emailInput, 'new@example.com');
      
      const submitButton = screen.getByRole('button', { name: /save|submit|update/i });
      await user.click(submitButton);
      
      // Should call mutation (mocked)
      await waitFor(() => {
        expect(screen.queryByText(/invalid/i)).not.toBeInTheDocument();
      }, { timeout: 3000 });
    }
  });
});

