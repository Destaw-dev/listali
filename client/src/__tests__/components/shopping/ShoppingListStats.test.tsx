import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ShoppingListStats } from '@/components/shoppingList/ShoppingListStats';

// Mock dependencies
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

describe('ShoppingListStats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render stats with correct values', () => {
    render(
      <ShoppingListStats
        totalItems={10}
        purchasedItems={3}
        activeShoppers={2}
      />
    );
    
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument(); // remaining
    expect(screen.getByText('2')).toBeInTheDocument(); // active shoppers
  });

  it('should calculate progress correctly', () => {
    render(
      <ShoppingListStats
        totalItems={10}
        purchasedItems={5}
        activeShoppers={1}
      />
    );
    
    // Progress should be 50%
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('should show 0% progress when no items', () => {
    render(
      <ShoppingListStats
        totalItems={0}
        purchasedItems={0}
        activeShoppers={0}
      />
    );
    
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('should show 100% progress when all items purchased', () => {
    render(
      <ShoppingListStats
        totalItems={10}
        purchasedItems={10}
        activeShoppers={0}
      />
    );
    
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('should display purchased items count', () => {
    render(
      <ShoppingListStats
        totalItems={10}
        purchasedItems={3}
        activeShoppers={1}
      />
    );
    
    const purchasedTexts = screen.getAllByText('3');
    expect(purchasedTexts.length).toBeGreaterThan(0);
  });

  it('should display remaining items count', () => {
    render(
      <ShoppingListStats
        totalItems={10}
        purchasedItems={3}
        activeShoppers={1}
      />
    );
    
    // Remaining = 10 - 3 = 7
    const remainingTexts = screen.getAllByText('7');
    expect(remainingTexts.length).toBeGreaterThan(0);
  });

  it('should display active shoppers count', () => {
    render(
      <ShoppingListStats
        totalItems={10}
        purchasedItems={3}
        activeShoppers={2}
      />
    );
    
    const shoppersTexts = screen.getAllByText('2');
    expect(shoppersTexts.length).toBeGreaterThan(0);
  });
});

