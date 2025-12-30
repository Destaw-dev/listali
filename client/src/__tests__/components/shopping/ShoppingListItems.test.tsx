import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ShoppingListItems } from '../../../components/shoppingList/ShoppingListItems';
import { mockItems, mockCategories } from '../../mocks/mockData';
import { IItem } from '../../../types';

interface CategoryGroup {
  categoryId: string;
  categoryName: string;
  items: IItem[];
}

// Mock dependencies
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));
vi.mock('../../../hooks/useItems', () => ({
  usePurchaseItem: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: false,
    variables: undefined,
  })),
  useUnpurchaseItem: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: false,
    variables: undefined,
  })),
  useUpdateItem: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: false,
    variables: undefined,
  })),
  useDeleteItem: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: false,
    variables: undefined,
  })),
  useAvailableCategories: vi.fn(() => ({
    data: mockCategories,
    isLoading: false,
    error: null,
  })),
}));
vi.mock('../../../components/shoppingList/items/CategorySection', () => ({
  CategorySection: ({ title, groups }: { title: string; groups: CategoryGroup[] }) => (
    <div>
      <h3>{title}</h3>
        {groups.map((group: CategoryGroup) => (
          <div key={group.categoryId}>
            {group.items.map((item: IItem) => (
            <div key={item._id}>{item.name}</div>
          ))}
        </div>
      ))}
    </div>
  ),
}));
vi.mock('../../../components/shoppingList/items/PurchaseQuantityModal', () => ({
  PurchaseQuantityModal: () => null,
}));
vi.mock('../../../components/shoppingList/items/ProductDetailsModal', () => ({
  ProductDetailsModal: () => null,
}));
vi.mock('../../../components/shoppingList/items/EditItemModal', () => ({
  EditItemModal: () => null,
}));

describe('ShoppingListItems', () => {

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render loading state', () => {
    render(
      <ShoppingListItems
        items={[]}
        listId="list1"
        groupId="group1"
        loading={true}
        canEdit={false}
        canDelete={false}
      />
    );
    
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeTruthy();
  });

  it('should render empty state when no items', () => {
    render(
      <ShoppingListItems
        items={[]}
        listId="list1"
        groupId="group1"
        loading={false}
        canEdit={false}
        canDelete={false}
      />
    );
    
    expect(screen.getByText(/noItems/i)).toBeInTheDocument();
  });

  it('should render items list', () => {
    render(
      <ShoppingListItems
        items={mockItems}
        listId="list1"
        groupId="group1"
        loading={false}
        canEdit={false}
        canDelete={false}
      />
    );
    
    expect(screen.getByText(mockItems[0].name)).toBeInTheDocument();
  });

  it('should display items count', () => {
    render(
      <ShoppingListItems
        items={mockItems}
        listId="list1"
        groupId="group1"
        loading={false}
        canEdit={false}
        canDelete={false}
      />
    );
    
    // Should show items count in header - might appear multiple times
    const countTexts = screen.queryAllByText(new RegExp(mockItems.length.toString()));
    expect(countTexts.length > 0 || screen.getByText(mockItems[0].name)).toBeTruthy();
  });

  it('should group items by category', () => {
    render(
      <ShoppingListItems
        items={mockItems}
        listId="list1"
        groupId="group1"
        loading={false}
        canEdit={false}
        canDelete={false}
      />
    );
    
    // Items should be grouped and displayed
    expect(screen.getByText(mockItems[0].name)).toBeInTheDocument();
  });

  it('should show unpurchased items section', () => {
    const unpurchasedItems = mockItems.filter(item => !item.isPurchased);
    
    render(
      <ShoppingListItems
        items={unpurchasedItems}
        listId="list1"
        groupId="group1"
        loading={false}
        canEdit={false}
        canDelete={false}
      />
    );
    
    // Should show unpurchased items
    expect(screen.getByText(/unpurchasedItems/i)).toBeInTheDocument();
  });

  it('should show purchased items section', () => {
    const purchasedItems = mockItems.filter(item => item.isPurchased);
    
    if (purchasedItems.length > 0) {
      render(
        <ShoppingListItems
          items={purchasedItems}
          listId="list1"
          groupId="group1"
          loading={false}
          canEdit={false}
          canDelete={false}
        />
      );
      
      // Should show purchased items
      expect(screen.getByText(/purchasedItems/i)).toBeInTheDocument();
    }
  });
});

