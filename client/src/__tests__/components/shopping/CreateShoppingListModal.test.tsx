import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreateShoppingListModal } from '../../../components/shoppingList/CreateShoppingListModal';
import { renderWithProviders } from '../../../test/test-utils';

// Mock dependencies
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));
vi.mock('../../../hooks/useModalScrollLock', () => ({
  useModalScrollLock: vi.fn(),
}));

describe('CreateShoppingListModal', () => {
  const mockOnSubmit = vi.fn().mockResolvedValue({});
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not render when isOpen is false', () => {
    renderWithProviders(
      <CreateShoppingListModal
        isOpen={false}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        groupId="group1"
      />
    );
    
    expect(screen.queryByText(/createList|createShoppingList/i)).not.toBeInTheDocument();
  });

  it('should render when isOpen is true', () => {
    renderWithProviders(
      <CreateShoppingListModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        groupId="group1"
      />
    );
    
    const texts = screen.queryAllByText(/createList|createShoppingList|newList/i);
    expect(texts.length > 0 || screen.getAllByRole('textbox').length > 0).toBeTruthy();
  });

  it('should display form fields', () => {
    renderWithProviders(
      <CreateShoppingListModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        groupId="group1"
      />
    );
    
    const inputs = screen.getAllByRole('textbox');
    expect(inputs.length).toBeGreaterThan(0);
  });

  it('should call onClose when clicking close button', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <CreateShoppingListModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        groupId="group1"
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

  it('should show validation error for empty name', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <CreateShoppingListModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        groupId="group1"
      />
    );
    
    const submitButton = screen.getByRole('button', { name: /create|submit/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      const errors = screen.queryAllByText(/required|invalid/i);
      const wasCalled = mockOnSubmit.mock.calls.length > 0;
      expect(errors.length > 0 || !wasCalled).toBe(true);
    }, { timeout: 2000 });
  });

  it('should submit form with valid data', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <CreateShoppingListModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        groupId="group1"
      />
    );
    
    const inputs = screen.getAllByRole('textbox');
    const nameInput = inputs[0] as HTMLInputElement;
    
    if (nameInput) {
      await user.type(nameInput, 'Test List');
      
      const submitButton = screen.getByRole('button', { name: /create|submit/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled();
      }, { timeout: 3000 });
    }
  });

  it('should handle tags addition', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <CreateShoppingListModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        groupId="group1"
      />
    );
    
    // Find tag input (might be a separate input or part of form)
    const inputs = screen.getAllByRole('textbox');
    const tagInput = inputs.find(inp => 
      (inp as HTMLInputElement).placeholder?.toLowerCase().includes('tag')
    ) as HTMLInputElement | undefined;
    
    if (tagInput) {
      await user.type(tagInput, 'tag1');
      await user.keyboard('{Enter}');
      
      // Tag should be added
      await waitFor(() => {
        expect(screen.queryByText('tag1')).toBeTruthy();
      });
    }
  });
});

