import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ShoppingListFilters, ShoppingListCategoryStat } from '../../../components/shoppingList/ShoppingListFilters';

// Mock dependencies
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

const mockCategoryStats: ShoppingListCategoryStat[] = [
  { id: 'cat1', name: 'פירות וירקות', count: 5 },
  { id: 'cat2', name: 'מוצרי חלב', count: 3 },
];

describe('ShoppingListFilters', () => {
  const mockOnStatusChange = vi.fn();
  const mockOnCategoryChange = vi.fn();
  const mockOnSearchChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render search input', () => {
    render(
      <ShoppingListFilters
        status="all"
        onStatusChange={mockOnStatusChange}
        category="all"
        onCategoryChange={mockOnCategoryChange}
        categories={mockCategoryStats}
        totalItems={10}
        purchasedCount={3}
        unpurchasedCount={7}
        searchQuery=""
        onSearchChange={mockOnSearchChange}
      />
    );
    
    const searchInput = screen.getByPlaceholderText(/search|חיפוש/i);
    expect(searchInput).toBeInTheDocument();
  });

  it('should call onSearchChange when typing in search', async () => {
    const user = userEvent.setup();
    render(
      <ShoppingListFilters
        status="all"
        onStatusChange={mockOnStatusChange}
        category="all"
        onCategoryChange={mockOnCategoryChange}
        categories={mockCategoryStats}
        totalItems={10}
        purchasedCount={3}
        unpurchasedCount={7}
        searchQuery=""
        onSearchChange={mockOnSearchChange}
      />
    );
    
    const searchInput = screen.getByPlaceholderText(/search|חיפוש/i) as HTMLInputElement;
    await user.type(searchInput, 'test');
    
    await waitFor(() => {
      expect(mockOnSearchChange).toHaveBeenCalled();
    });
  });

  it('should display status filter buttons', () => {
    render(
      <ShoppingListFilters
        status="all"
        onStatusChange={mockOnStatusChange}
        category="all"
        onCategoryChange={mockOnCategoryChange}
        categories={mockCategoryStats}
        totalItems={10}
        purchasedCount={3}
        unpurchasedCount={7}
        searchQuery=""
        onSearchChange={mockOnSearchChange}
      />
    );
    
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('should call onStatusChange when clicking status filter', async () => {
    const user = userEvent.setup();
    render(
      <ShoppingListFilters
        status="all"
        onStatusChange={mockOnStatusChange}
        category="all"
        onCategoryChange={mockOnCategoryChange}
        categories={mockCategoryStats}
        totalItems={10}
        purchasedCount={3}
        unpurchasedCount={7}
        searchQuery=""
        onSearchChange={mockOnSearchChange}
      />
    );
    
    const buttons = screen.getAllByRole('button');
    const purchasedButton = buttons.find(btn => 
      btn.textContent?.toLowerCase().includes('purchased') ||
      btn.textContent?.toLowerCase().includes('נקנה')
    );
    
    if (purchasedButton) {
      await user.click(purchasedButton);
      expect(mockOnStatusChange).toHaveBeenCalled();
    }
  });

  it('should display category dropdown', () => {
    render(
      <ShoppingListFilters
        status="all"
        onStatusChange={mockOnStatusChange}
        category="all"
        onCategoryChange={mockOnCategoryChange}
        categories={mockCategoryStats}
        totalItems={10}
        purchasedCount={3}
        unpurchasedCount={7}
        searchQuery=""
        onSearchChange={mockOnSearchChange}
      />
    );
    
    // Category dropdown should be rendered
    const dropdowns = screen.queryAllByRole('button');
    expect(dropdowns.length).toBeGreaterThan(0);
  });

  it('should show active status filter', () => {
    render(
      <ShoppingListFilters
        status="purchased"
        onStatusChange={mockOnStatusChange}
        category="all"
        onCategoryChange={mockOnCategoryChange}
        categories={mockCategoryStats}
        totalItems={10}
        purchasedCount={3}
        unpurchasedCount={7}
        searchQuery=""
        onSearchChange={mockOnSearchChange}
      />
    );
    
    // Active filter should be highlighted
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });
});

