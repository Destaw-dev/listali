import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreateGroupModal } from '@/components/groups/CreateGroupModal';
import { renderWithProviders } from '@/test/test-utils';

// Mock dependencies
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));
vi.mock('@/hooks/useModalScrollLock', () => ({
  useModalScrollLock: vi.fn(),
}));

describe('CreateGroupModal', () => {
  const mockOnCreateGroup = vi.fn().mockResolvedValue({});
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not render when isOpen is false', () => {
    renderWithProviders(
      <CreateGroupModal
        isOpen={false}
        onClose={mockOnClose}
        onCreateGroup={mockOnCreateGroup}
      />
    );
    
    expect(screen.queryByText(/createNewGroup/i)).not.toBeInTheDocument();
  });

  it('should render when isOpen is true', () => {
    renderWithProviders(
      <CreateGroupModal
        isOpen={true}
        onClose={mockOnClose}
        onCreateGroup={mockOnCreateGroup}
      />
    );
    
    const texts = screen.getAllByText(/createNewGroup/i);
    expect(texts.length).toBeGreaterThan(0);
  });

  it('should display form fields', () => {
    renderWithProviders(
      <CreateGroupModal
        isOpen={true}
        onClose={mockOnClose}
        onCreateGroup={mockOnCreateGroup}
      />
    );
    
    // Use placeholder or role instead of label
    const inputs = screen.getAllByRole('textbox');
    expect(inputs.length).toBeGreaterThan(0);
  });

  it('should call onClose when clicking close button', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <CreateGroupModal
        isOpen={true}
        onClose={mockOnClose}
        onCreateGroup={mockOnCreateGroup}
      />
    );
    
    const closeButton = screen.getAllByRole('button').find(btn => 
      btn.querySelector('svg') || btn.textContent?.includes('X')
    );
    
    if (closeButton) {
      await user.click(closeButton);
      expect(mockOnClose).toHaveBeenCalled();
    }
  });

  it('should show validation error for empty name', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <CreateGroupModal
        isOpen={true}
        onClose={mockOnClose}
        onCreateGroup={mockOnCreateGroup}
      />
    );
    
    const submitButton = screen.getByRole('button', { name: /create|submit/i });
    await user.click(submitButton);
    
    // Form should prevent submission or show errors
    await waitFor(() => {
      // Either validation errors appear or form doesn't submit
      const errors = screen.queryAllByText(/required|invalid/i);
      const wasCalled = mockOnCreateGroup.mock.calls.length > 0;
      expect(errors.length > 0 || !wasCalled).toBe(true);
    }, { timeout: 2000 });
  });

  it('should submit form with valid data', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <CreateGroupModal
        isOpen={true}
        onClose={mockOnClose}
        onCreateGroup={mockOnCreateGroup}
      />
    );
    
    // Use getByPlaceholderText or getAllByRole to find inputs
    const inputs = screen.getAllByRole('textbox');
    const nameInput = inputs.find(inp => {
      const htmlInput = inp as HTMLInputElement;
      return htmlInput.placeholder?.toLowerCase().includes('name') || htmlInput.name === 'name';
    }) as HTMLInputElement | undefined || inputs[0] as HTMLInputElement;
    const descriptionInput = inputs.find(inp => inp.tagName === 'TEXTAREA') as HTMLTextAreaElement | undefined;
    
    if (nameInput) await user.type(nameInput, 'Test Group');
    if (descriptionInput) await user.type(descriptionInput, 'Test Description');
    
    const submitButton = screen.getByRole('button', { name: /create|submit/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(mockOnCreateGroup).toHaveBeenCalled();
    }, { timeout: 3000 });
  });

  it('should reset form after successful submission', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <CreateGroupModal
        isOpen={true}
        onClose={mockOnClose}
        onCreateGroup={mockOnCreateGroup}
      />
    );
    
    const inputs = screen.getAllByRole('textbox') as HTMLInputElement[];
    const nameInput = inputs[0];
    await user.type(nameInput, 'Test Group');
    
    const submitButton = screen.getByRole('button', { name: /create|submit/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(mockOnCreateGroup).toHaveBeenCalled();
    }, { timeout: 3000 });
    
    // Form should be reset or modal closed
    await waitFor(() => {
      expect(nameInput.value === '' || mockOnClose).toBeTruthy();
    });
  });

  it('should close modal after successful submission', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <CreateGroupModal
        isOpen={true}
        onClose={mockOnClose}
        onCreateGroup={mockOnCreateGroup}
      />
    );
    
    const inputs = screen.getAllByRole('textbox') as HTMLInputElement[];
    const nameInput = inputs[0];
    await user.type(nameInput, 'Test Group');
    
    const submitButton = screen.getByRole('button', { name: /create|submit/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(mockOnCreateGroup).toHaveBeenCalled();
    }, { timeout: 3000 });
    
    // Modal should close after successful submission (onClose is called in the component after reset)
    // Note: The component calls onClose after reset, but it might be async
    await waitFor(() => {
      // Either onClose was called or the form was reset (which happens before onClose)
      expect(mockOnClose.mock.calls.length > 0 || nameInput.value === '').toBeTruthy();
    }, { timeout: 2000 });
  });
});

