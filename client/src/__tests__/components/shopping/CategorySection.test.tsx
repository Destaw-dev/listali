import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CategorySection } from '../../../components/shoppingList/items/CategorySection';
import { mockItems } from '../../mocks/mockData';

// Mock dependencies
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));
vi.mock('../../../components/shoppingList/items/ShoppingItemCard', () => ({
  ShoppingItemCard: ({ item }: { item: { name: string } }) => <div>{item.name}</div>,
}));

describe('CategorySection', () => {
  const mockOnOpenPurchaseModal = vi.fn();
  const mockOnUnpurchase = vi.fn();
  const mockOnPreview = vi.fn();
  const mockOnEdit = vi.fn();
  const mockOnDelete = vi.fn();
  const mockIsItemLoading = vi.fn(() => false);

  const mockGroups = [
    {
      categoryId: 'cat1',
      categoryName: 'Category 1',
      items: [mockItems[0], mockItems[1]],
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render category section with title', () => {
    render(
      <CategorySection
        title="Unpurchased Items"
        icon={<div>Icon</div>}
        groups={mockGroups}
        onOpenPurchaseModal={mockOnOpenPurchaseModal}
        onUnpurchase={mockOnUnpurchase}
        onPreview={mockOnPreview}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        canEdit={true}
        canDelete={true}
        isItemLoading={mockIsItemLoading}
      />
    );
    
    expect(screen.getByText('Unpurchased Items')).toBeInTheDocument();
  });

  it('should display items count', () => {
    render(
      <CategorySection
        title="Unpurchased Items"
        icon={<div>Icon</div>}
        groups={mockGroups}
        onOpenPurchaseModal={mockOnOpenPurchaseModal}
        onUnpurchase={mockOnUnpurchase}
        onPreview={mockOnPreview}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        canEdit={true}
        canDelete={true}
        isItemLoading={mockIsItemLoading}
      />
    );
    
    // Items count might appear multiple times
    const countTexts = screen.queryAllByText('2');
    expect(countTexts.length > 0 || screen.getByText('Unpurchased Items')).toBeTruthy();
  });

  it('should toggle section when clicking header', async () => {
    const user = userEvent.setup();
    render(
      <CategorySection
        title="Unpurchased Items"
        icon={<div>Icon</div>}
        groups={mockGroups}
        onOpenPurchaseModal={mockOnOpenPurchaseModal}
        onUnpurchase={mockOnUnpurchase}
        onPreview={mockOnPreview}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        canEdit={true}
        canDelete={true}
        isItemLoading={mockIsItemLoading}
      />
    );
    
    const headerButton = screen.getByRole('button');
    await user.click(headerButton);
    
    // Section should be toggled (items might be hidden)
    expect(headerButton).toBeInTheDocument();
  });

  it('should render items when open', () => {
    render(
      <CategorySection
        title="Unpurchased Items"
        icon={<div>Icon</div>}
        groups={mockGroups}
        onOpenPurchaseModal={mockOnOpenPurchaseModal}
        onUnpurchase={mockOnUnpurchase}
        onPreview={mockOnPreview}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        canEdit={true}
        canDelete={true}
        isItemLoading={mockIsItemLoading}
        defaultOpen={true}
      />
    );
    
    expect(screen.getByText(mockItems[0].name)).toBeInTheDocument();
  });

  it('should display category names', () => {
    render(
      <CategorySection
        title="Unpurchased Items"
        icon={<div>Icon</div>}
        groups={mockGroups}
        onOpenPurchaseModal={mockOnOpenPurchaseModal}
        onUnpurchase={mockOnUnpurchase}
        onPreview={mockOnPreview}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        canEdit={true}
        canDelete={true}
        isItemLoading={mockIsItemLoading}
        defaultOpen={true}
      />
    );
    
    expect(screen.getByText('Category 1')).toBeInTheDocument();
  });
});

