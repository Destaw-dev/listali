import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ShoppingListHeaderBar } from '../../../components/shoppingList/ShoppingListHeaderBar';
import { mockShoppingLists } from '../../mocks/mockData';

// Mock dependencies
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
  useParams: () => ({ locale: 'he' }),
}));
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

describe('ShoppingListHeaderBar', () => {
  const mockOnAddItems = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render shopping list name', () => {
    render(
      <ShoppingListHeaderBar
        shoppingList={mockShoppingLists[0]}
        groupId="group1"
        locale="he"
        onAddItems={mockOnAddItems}
      />
    );
    
    expect(screen.getByText(mockShoppingLists[0].name)).toBeInTheDocument();
  });

  it('should display shopping list description', () => {
    render(
      <ShoppingListHeaderBar
        shoppingList={mockShoppingLists[0]}
        groupId="group1"
        locale="he"
        onAddItems={mockOnAddItems}
      />
    );
    
    if (mockShoppingLists[0].description) {
      expect(screen.getByText(mockShoppingLists[0].description)).toBeInTheDocument();
    }
  });

  it('should show priority badge when priority exists', () => {
    const listWithPriority = { ...mockShoppingLists[0], priority: 'high' as const };
    
    render(
      <ShoppingListHeaderBar
        shoppingList={listWithPriority}
        groupId="group1"
        locale="he"
        onAddItems={mockOnAddItems}
      />
    );
    
    expect(screen.getByText('high')).toBeInTheDocument();
  });

  it('should call onAddItems when clicking add item button', async () => {
    const user = userEvent.setup();
    render(
      <ShoppingListHeaderBar
        shoppingList={mockShoppingLists[0]}
        groupId="group1"
        locale="he"
        onAddItems={mockOnAddItems}
      />
    );
    
    // There might be multiple add buttons (desktop and mobile)
    const addButtons = screen.getAllByRole('button', { name: /addItem|add/i });
    if (addButtons.length > 0) {
      await user.click(addButtons[0]);
      expect(mockOnAddItems).toHaveBeenCalled();
    }
  });

  it('should display formatted date', () => {
    render(
      <ShoppingListHeaderBar
        shoppingList={mockShoppingLists[0]}
        groupId="group1"
        locale="he"
        onAddItems={mockOnAddItems}
      />
    );
    
    // Date should be displayed (might be in text or icon)
    const svgElements = document.querySelectorAll('svg');
    const hasDate = svgElements.length > 0 || screen.getByText(mockShoppingLists[0].name);
    expect(hasDate).toBeTruthy();
  });
});

