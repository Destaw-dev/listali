import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../test/test-utils';
import ShoppingListPage from '../../app/[locale]/groups/[groupId]/[listId]/page';
import { useShoppingListData } from '../../hooks/useShoppingListData';
import { useGroup } from '../../hooks/useGroups';
import { useAvailableCategories } from '../../hooks/useItems';
import { mockShoppingLists, mockItems, mockGroups, mockCategories } from '../mocks/mockData';

vi.mock('../../hooks/useShoppingListData');
vi.mock('../../hooks/useShoppingListWebSocket', () => ({
  useShoppingListWebSocket: vi.fn(),
}));
vi.mock('../../hooks/useGroups');
vi.mock('../../hooks/useItems', () => ({
  useAvailableCategories: vi.fn(),
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
  useCreateMultipleItems: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: false,
  })),
}));
vi.mock('../../hooks/useAuthRedirect', () => ({
  useAuthRedirect: () => ({
    isAuthenticated: true,
    isReady: true,
    safeToShow: true,
  }),
}));
vi.mock('../../store/authStore', () => ({
  useAuthStore: () => ({
    user: { _id: 'user1' },
  }),
}));
vi.mock('next/navigation', () => ({
  useParams: () => ({ locale: 'he', groupId: 'group1', listId: 'list1' }),
  useRouter: () => ({
    push: vi.fn(),
  }),
}));
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));
vi.mock('../../components/shoppingList/AddItemsModal', () => ({
  default: ({ isOpen }: { isOpen: boolean }) => isOpen ? <div>AddItemsModal</div> : null,
}));

describe('ShoppingListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useShoppingListData).mockReturnValue({
      shoppingList: mockShoppingLists[0],
      items: mockItems,
      shoppingSession: null,
      isLoading: false,
      error: null,
      purchasedItems: 1,
      totalItems: mockItems.length,
    });
    vi.mocked(useGroup).mockReturnValue({
      data: mockGroups[0],
      isLoading: false,
      error: null,
    } as ReturnType<typeof useGroup>);
    vi.mocked(useAvailableCategories).mockReturnValue({
      data: mockCategories,
      isLoading: false,
      error: null,
    } as ReturnType<typeof useGroup>);
  });

  it('should render shopping list page', () => {
    renderWithProviders(<ShoppingListPage />);
    expect(screen.getByText(mockShoppingLists[0].name)).toBeInTheDocument();
  });

  it('should display shopping list items', () => {
    renderWithProviders(<ShoppingListPage />);
    expect(screen.getByText(mockItems[0].name)).toBeInTheDocument();
  });

  it('should show loading state', () => {
    vi.mocked(useShoppingListData).mockReturnValue({
      shoppingList: null,
      items: [],
      shoppingSession: null,
      isLoading: true,
      error: null,
      purchasedItems: 0,
      totalItems: 0,
    });

    renderWithProviders(<ShoppingListPage />);
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeTruthy();
  });

  it('should display stats', () => {
    renderWithProviders(<ShoppingListPage />);
    const statsTexts = screen.queryAllByText(/1/) || screen.queryAllByText(/3/);
    expect(statsTexts.length).toBeGreaterThan(0);
  });
});

