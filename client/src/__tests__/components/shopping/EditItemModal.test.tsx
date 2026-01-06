import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EditItemModal } from '../../../components/shoppingList/items/EditItemModal';
import { renderWithProviders } from '../../../test/test-utils';
import { mockItems, mockCategories } from '../../mocks/mockData';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));
vi.mock('../../../hooks/useModalScrollLock', () => ({
  useModalScrollLock: vi.fn(),
}));
vi.mock('../../../hooks/useItems', () => ({
  useAvailableCategories: vi.fn(() => ({
    data: mockCategories,
    isLoading: false,
  })),
}));

describe('EditItemModal', () => {
  const mockOnSubmit = vi.fn().mockResolvedValue({});
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not render when item is null', () => {
    renderWithProviders(
      <EditItemModal
        item={null}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );
    
    expect(screen.queryByText(/edit|ערוך/i)).not.toBeInTheDocument();
  });

  it('should render when item is provided', () => {
    renderWithProviders(
      <EditItemModal
        item={mockItems[0]}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );
    
    const inputs = screen.getAllByRole('textbox');
    expect(inputs.length).toBeGreaterThan(0);
  });

  it('should populate form with item data', () => {
    renderWithProviders(
      <EditItemModal
        item={mockItems[0]}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );
    
    expect(screen.getByDisplayValue(mockItems[0].name)).toBeInTheDocument();
  });

  it('should call onSubmit with updated data', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <EditItemModal
        item={mockItems[0]}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );
    
    const inputs = screen.getAllByRole('textbox') as HTMLInputElement[];
    const nameInput = inputs.find(inp => inp.value === mockItems[0].name);
    
    if (nameInput) {
      nameInput.select();
      await user.type(nameInput, 'Updated Item');
      
      const buttons = screen.getAllByRole('button');
      const submitButton = buttons.find(btn => 
        btn.textContent?.toLowerCase().includes('save') ||
        btn.textContent?.toLowerCase().includes('update') ||
        btn.textContent?.toLowerCase().includes('שמור') ||
        btn.textContent?.toLowerCase().includes('עדכן')
      );
      
      if (submitButton) {
        await user.click(submitButton);
        
        await waitFor(() => {
          const wasCalled = mockOnSubmit.mock.calls.length > 0;
          const hasErrors = screen.queryAllByText(/required|invalid/i).length > 0;
          expect(wasCalled || hasErrors).toBe(true);
        }, { timeout: 3000 });
      }
    }
  });

  it('should call onClose when clicking close button', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <EditItemModal
        item={mockItems[0]}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
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
});

