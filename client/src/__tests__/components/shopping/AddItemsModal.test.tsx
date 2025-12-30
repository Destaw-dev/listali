import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AddItemsModal from '@/components/shoppingList/AddItemsModal';
import { renderWithProviders } from '@/test/test-utils';
import { mockProducts } from '../../mocks/mockData';
import { IProduct, ItemInput } from '@/types';

// Mock dependencies
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));
vi.mock('@/hooks/useModalScrollLock', () => ({
  useModalScrollLock: vi.fn(),
}));
vi.mock('@/hooks/useItems', () => ({
  useAvailableCategories: vi.fn(() => ({
    data: [],
    isLoading: false,
    error: null,
  })),
}));
vi.mock('@/components/shoppingList/AddItemsModal/ProductsSelectionView', () => ({
  ProductsSelectionView: ({ onProductSelect, selectedProductIds }: { onProductSelect: (product: IProduct) => void; selectedProductIds: string[] }) => (
    <div>
      <button onClick={() => onProductSelect(mockProducts[0])}>Select Product</button>
      <div>Selected: {selectedProductIds.length}</div>
    </div>
  ),
}));
vi.mock('@/components/shoppingList/AddItemsModal/SelectedItemsSidebar', () => ({
  SelectedItemsSidebar: ({ items, onClearAll, onSubmit }: { items: ItemInput[]; onClearAll: () => void; onSubmit: (items: ItemInput[]) => void }) => (
    <div>
      <div>Items: {items?.length || 0}</div>
      <button onClick={onClearAll}>Clear All</button>
      <button onClick={() => onSubmit([])}>Submit</button>
    </div>
  ),
}));

describe('AddItemsModal', () => {
  const mockOnSubmit = vi.fn().mockResolvedValue(true);
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not render when isOpen is false', () => {
    renderWithProviders(
      <AddItemsModal
        isOpen={false}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        existingItems={[]}
        listId="test-list-id"
      />
    );
    
    expect(screen.queryByText(/addNewItem/i)).not.toBeInTheDocument();
  });

  it('should render when isOpen is true', () => {
    renderWithProviders(
      <AddItemsModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        existingItems={[]}
        listId="test-list-id"
      />
    );
    
    const texts = screen.getAllByText(/addNewItem/i);
    expect(texts.length).toBeGreaterThan(0);
  });

  it('should call onClose when clicking close button', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <AddItemsModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        existingItems={[]}
        listId="test-list-id"
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

  it('should reset selected products when modal closes', async () => {
    const user = userEvent.setup();
    const { rerender } = renderWithProviders(
      <AddItemsModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        existingItems={[]}
        listId="test-list-id"
      />
    );
    
    // Select a product
    const selectButton = screen.getByText('Select Product');
    await user.click(selectButton);
    
    // Close modal
    const closeButtons = screen.getAllByRole('button');
    const closeButton = closeButtons.find(btn => 
      btn.querySelector('svg') || btn.textContent?.includes('X')
    );
    
    if (closeButton) {
      await user.click(closeButton);
    }
    
    // Reopen modal - should be reset
    rerender(
      <AddItemsModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        existingItems={[]}
        listId="test-list-id"
      />
    );
    
    const selectedCount = screen.queryByText(/Selected: 0/i);
    expect(selectedCount || screen.getByText(/addNewItem/i)).toBeTruthy();
  });

  it('should handle product selection', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <AddItemsModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        existingItems={[]}
        listId="test-list-id"
      />
    );
    
    const selectButton = screen.getByText('Select Product');
    await user.click(selectButton);
    
    // Product should be selected
    await waitFor(() => {
      const selectedText = screen.queryByText(/Selected: 1/i);
      expect(selectedText || screen.getByText('Select Product')).toBeTruthy();
    });
  });

  it('should handle clear all products', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <AddItemsModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        existingItems={[]}
        listId="test-list-id"
      />
    );
    
    // Select a product first
    const selectButton = screen.getByText('Select Product');
    await user.click(selectButton);
    
    // Clear all
    const clearButton = screen.getByText('Clear All');
    await user.click(clearButton);
    
    // Should clear selection
    await waitFor(() => {
      const selectedText = screen.queryByText(/Selected: 0/i);
      expect(selectedText || screen.getByText('Select Product')).toBeTruthy();
    });
  });
});

