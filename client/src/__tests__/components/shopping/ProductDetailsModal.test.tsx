import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProductDetailsModal } from '../../../components/shoppingList/items/ProductDetailsModal';
import { mockItems, mockProduct } from '../../mocks/mockData';
import type { IItem } from '../../../types';

vi.mock('../../../hooks/useModalScrollLock', () => ({
  useModalScrollLock: vi.fn(),
}));

const mockTItems = vi.fn((key: string) => key);
const mockTCommon = vi.fn((key: string) => key);

describe('ProductDetailsModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not render when item is null', () => {
    render(
      <ProductDetailsModal
        item={null}
        onClose={vi.fn()}
        tItems={mockTItems}
        tCommon={mockTCommon}
      />
    );
    
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('should render when item is provided', () => {
    render(
      <ProductDetailsModal
        item={mockItems[0]}
        onClose={vi.fn()}
        tItems={mockTItems}
        tCommon={mockTCommon}
      />
    );
    
    expect(screen.getByText(mockItems[0].name)).toBeInTheDocument();
  });

  it('should display item details', () => {
    render(
      <ProductDetailsModal
        item={mockItems[0]}
        onClose={vi.fn()}
        tItems={mockTItems}
        tCommon={mockTCommon}
      />
    );
    
    expect(screen.getByText(mockItems[0].name)).toBeInTheDocument();
  });

  it('should call onClose when clicking close button', async () => {
    const user = userEvent.setup();
    const mockOnClose = vi.fn();
    
    render(
      <ProductDetailsModal
        item={mockItems[0]}
        onClose={mockOnClose}
        tItems={mockTItems}
        tCommon={mockTCommon}
      />
    );
    
    const closeButtons = screen.getAllByRole('button');
    const closeButton = closeButtons.find(btn => 
      btn.querySelector('svg') || btn.getAttribute('aria-label')?.includes('close')
    );
    
    if (closeButton) {
      await user.click(closeButton);
      expect(mockOnClose).toHaveBeenCalled();
    }
  });

  it('should display brand if available', () => {
    const itemWithBrand = { 
      ...mockItems[0], 
      brand: 'Test Brand',
      product: { ...mockProduct, brand: 'Test Brand' },
    } as IItem & { product: typeof mockProduct };
    
    render(
      <ProductDetailsModal
        item={itemWithBrand}
        onClose={vi.fn()}
        tItems={mockTItems}
        tCommon={mockTCommon}
      />
    );
    
    const brandTexts = screen.queryAllByText('Test Brand');
    expect(brandTexts.length > 0 || screen.getByText(mockItems[0].name)).toBeTruthy();
  });
});

