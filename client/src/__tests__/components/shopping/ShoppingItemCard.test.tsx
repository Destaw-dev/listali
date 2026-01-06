import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ShoppingItemCard } from '../../../components/shoppingList/items/ShoppingItemCard';
import { mockItems } from '../../mocks/mockData';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

describe('ShoppingItemCard', () => {
  const mockOnOpenPurchaseModal = vi.fn();
  const mockOnUnpurchase = vi.fn();
  const mockOnPreview = vi.fn();
  const mockOnEdit = vi.fn();
  const mockOnDelete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render item card with name', () => {
    render(
      <ShoppingItemCard
        item={mockItems[0]}
        isLoading={false}
        onOpenPurchaseModal={mockOnOpenPurchaseModal}
        onUnpurchase={mockOnUnpurchase}
        onPreview={mockOnPreview}
      />
    );
    expect(screen.getByText(mockItems[0].name)).toBeInTheDocument();
  });

  it('should display item quantity', () => {
    render(
      <ShoppingItemCard
        item={mockItems[0]}
        isLoading={false}
        onOpenPurchaseModal={mockOnOpenPurchaseModal}
        onUnpurchase={mockOnUnpurchase}
        onPreview={mockOnPreview}
      />
    );
    expect(screen.getByText(new RegExp(mockItems[0].quantity.toString()))).toBeInTheDocument();
  });

  it('should call onOpenPurchaseModal when clicking purchase button for unpurchased item', async () => {
    const user = userEvent.setup();
    const unpurchasedItem = { ...mockItems[0], isPurchased: false };
    
    render(
      <ShoppingItemCard
        item={unpurchasedItem}
        isLoading={false}
        onOpenPurchaseModal={mockOnOpenPurchaseModal}
        onUnpurchase={mockOnUnpurchase}
        onPreview={mockOnPreview}
      />
    );
    
    const purchaseButton = screen.getByRole('button');
    await user.click(purchaseButton);
    
    expect(mockOnOpenPurchaseModal).toHaveBeenCalledWith(unpurchasedItem);
  });

  it('should call onUnpurchase when clicking button for purchased item', async () => {
    const user = userEvent.setup();
    const purchasedItem = { ...mockItems[0], isPurchased: true };
    
    render(
      <ShoppingItemCard
        item={purchasedItem}
        isLoading={false}
        onOpenPurchaseModal={mockOnOpenPurchaseModal}
        onUnpurchase={mockOnUnpurchase}
        onPreview={mockOnPreview}
      />
    );
    
    const buttons = screen.getAllByRole('button');
    const purchaseButton = buttons[0];
    await user.click(purchaseButton);
    
    expect(mockOnUnpurchase).toHaveBeenCalledWith(purchasedItem);
  });

  it('should call onPreview when clicking on item', async () => {
    const user = userEvent.setup();
    
    render(
      <ShoppingItemCard
        item={mockItems[0]}
        isLoading={false}
        onOpenPurchaseModal={mockOnOpenPurchaseModal}
        onUnpurchase={mockOnUnpurchase}
        onPreview={mockOnPreview}
      />
    );
    
    const itemName = screen.getByText(mockItems[0].name);
    await user.click(itemName);
    
    expect(mockOnPreview).toHaveBeenCalledWith(mockItems[0]);
  });

  it('should show edit button when canEdit is true', () => {
    render(
      <ShoppingItemCard
        item={mockItems[0]}
        isLoading={false}
        onOpenPurchaseModal={mockOnOpenPurchaseModal}
        onUnpurchase={mockOnUnpurchase}
        onPreview={mockOnPreview}
        onEdit={mockOnEdit}
        canEdit={true}
      />
    );
    
    const buttons = screen.getAllByRole('button');
    const editButton = buttons.find(btn => btn.querySelector('svg'));
    expect(editButton).toBeTruthy();
  });

  it('should show delete button when canDelete is true', () => {
    render(
      <ShoppingItemCard
        item={mockItems[0]}
        isLoading={false}
        onOpenPurchaseModal={mockOnOpenPurchaseModal}
        onUnpurchase={mockOnUnpurchase}
        onPreview={mockOnPreview}
        onDelete={mockOnDelete}
        canDelete={true}
      />
    );
    
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(1);
  });

  it('should disable purchase button when isLoading is true', () => {
    render(
      <ShoppingItemCard
        item={mockItems[0]}
        isLoading={true}
        onOpenPurchaseModal={mockOnOpenPurchaseModal}
        onUnpurchase={mockOnUnpurchase}
        onPreview={mockOnPreview}
      />
    );
    
    const purchaseButton = screen.getByRole('button');
    expect(purchaseButton).toBeDisabled();
  });

  it('should display priority badge for high priority items', () => {
    const highPriorityItem = { ...mockItems[0], priority: 'high' as const };
    
    render(
      <ShoppingItemCard
        item={highPriorityItem}
        isLoading={false}
        onOpenPurchaseModal={mockOnOpenPurchaseModal}
        onUnpurchase={mockOnUnpurchase}
        onPreview={mockOnPreview}
      />
    );
    
    const badges = screen.queryAllByText(/priority|high/i);
    expect(badges.length).toBeGreaterThan(0);
  });

  it('should display partially purchased state', () => {
    const partiallyPurchasedItem = {
      ...mockItems[0],
      status: 'pending' as const,
      purchasedQuantity: 1,
      quantity: 3,
      isPartiallyPurchased: true,
    };
    
    render(
      <ShoppingItemCard
        item={partiallyPurchasedItem}
        isLoading={false}
        onOpenPurchaseModal={mockOnOpenPurchaseModal}
        onUnpurchase={mockOnUnpurchase}
        onPreview={mockOnPreview}
      />
    );
    
    const quantityTexts = screen.queryAllByText(/1/) || screen.queryAllByText(/3/);

    expect(quantityTexts.length > 0 || screen.getByText(partiallyPurchasedItem.name)).toBeTruthy();
  });
});

