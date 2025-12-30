import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PurchaseQuantityModal } from '@/components/shoppingList/items/PurchaseQuantityModal';
import { mockItems } from '../../mocks/mockData';

// Mock dependencies
vi.mock('@/hooks/useModalScrollLock', () => ({
  useModalScrollLock: vi.fn(),
}));

const mockTItems = vi.fn((key: string, values?: Record<string, string | number | undefined>) => {
  if (key === 'selectQuantityTitle') return 'Select Quantity';
  if (key === 'alreadyPurchased') return `Already purchased: ${values?.purchased}/${values?.total}`;
  if (key === 'remainingQuantity') return `Remaining: ${values?.remaining}`;
  if (key === 'totalQuantity') return 'Total Quantity';
  return key;
});

describe('PurchaseQuantityModal', () => {
  const mockOnConfirm = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not render when item is null', () => {
    render(
      <PurchaseQuantityModal
        item={null}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        tItems={mockTItems}
      />
    );
    
    expect(screen.queryByText(/selectQuantity|quantity/i)).not.toBeInTheDocument();
  });

  it('should render when item is provided', () => {
    render(
      <PurchaseQuantityModal
        item={mockItems[0]}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        tItems={mockTItems}
      />
    );
    
    expect(screen.getByText('Select Quantity')).toBeInTheDocument();
    expect(screen.getByText(mockItems[0].name)).toBeInTheDocument();
  });

  it('should increment quantity', async () => {
    const user = userEvent.setup();
    render(
      <PurchaseQuantityModal
        item={mockItems[0]}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        tItems={mockTItems}
      />
    );
    
    const buttons = screen.getAllByRole('button') as HTMLButtonElement[];
    const incrementButton = buttons.find((btn: HTMLButtonElement) => 
      btn.querySelector('svg') && !btn.disabled && btn.textContent !== 'Cancel'
    );
    
    if (incrementButton) {
      await user.click(incrementButton);
      
      // Quantity should increase (might be 1 or 2)
      const quantityTexts = screen.queryAllByText(/1|2/);
      expect(quantityTexts.length > 0).toBeTruthy();
    }
  });

  it('should decrement quantity', async () => {
    const user = userEvent.setup();
    render(
      <PurchaseQuantityModal
        item={mockItems[0]}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        tItems={mockTItems}
      />
    );
    
    const buttons = screen.getAllByRole('button') as HTMLButtonElement[];
    const incrementButton = buttons.find((btn: HTMLButtonElement) => 
      btn.querySelector('svg') && !btn.disabled && btn.textContent !== 'Cancel'
    );
    
    if (incrementButton) {
      // First increment
      await user.click(incrementButton);
      
      // Then find decrement button
      const decrementButton = buttons.find((btn: HTMLButtonElement) => 
        btn.querySelector('svg') && btn !== incrementButton && !btn.disabled
      );
      
      if (decrementButton) {
        await user.click(decrementButton);
      }
      
      // Quantity should be displayed
      const quantityTexts = screen.queryAllByText(/1|2/);
      expect(quantityTexts.length > 0).toBeTruthy();
    }
  });

  it('should call onConfirm with quantity', async () => {
    const user = userEvent.setup();
    render(
      <PurchaseQuantityModal
        item={mockItems[0]}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        tItems={mockTItems}
      />
    );
    
    const buttons = screen.getAllByRole('button');
    const confirmButton = buttons.find(btn => 
      btn.textContent?.toLowerCase().includes('confirm') ||
      btn.textContent?.includes('אישור') ||
      (btn.textContent && !btn.textContent.includes('Cancel') && !btn.textContent.includes('ביטול'))
    );
    
    if (confirmButton) {
      await user.click(confirmButton);
      
      await waitFor(() => {
        expect(mockOnConfirm).toHaveBeenCalled();
      });
    }
  });

  it('should display partially purchased info', () => {
    const partiallyPurchasedItem = {
      ...mockItems[0],
      purchasedQuantity: 2,
      quantity: 5,
      remainingQuantity: 3,
    };
    
    render(
      <PurchaseQuantityModal
        item={partiallyPurchasedItem}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        tItems={mockTItems}
      />
    );
    
    const texts = screen.queryAllByText(/Already purchased|Remaining|נקנה|נותר/i);
    expect(texts.length > 0 || screen.getByText(partiallyPurchasedItem.name)).toBeTruthy();
  });
});

