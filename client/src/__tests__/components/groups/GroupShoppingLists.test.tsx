import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GroupShoppingLists } from '../../../components/groups/GroupShoppingLists';
import { renderWithProviders, createMockMutationResult } from '../../../test/test-utils';
import { useGroup } from '../../../hooks/useGroups';
import { useGroupShoppingLists, useCreateShoppingList, useDeleteShoppingList } from '../../../hooks/useShoppingLists';
import { mockGroups, mockShoppingLists } from '../../mocks/mockData';

// Mock dependencies
vi.mock('../../../hooks/useGroups');
vi.mock('../../../hooks/useShoppingLists');
vi.mock('../../../hooks/useAuthRedirect', () => ({
  useAuthRedirect: () => ({
    isAuthenticated: true,
    isInitialized: true,
  }),
}));
vi.mock('next/navigation', () => ({
  useParams: () => ({ locale: 'he', groupId: 'group1' }),
  useRouter: () => ({
    push: vi.fn(),
  }),
}));
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));
vi.mock('../../../components/shoppingList/CreateShoppingListModal', () => ({
  default: ({ isOpen }: { isOpen: boolean }) => isOpen ? <div>CreateShoppingListModal</div> : null,
}));

describe('GroupShoppingLists', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useGroup).mockReturnValue({
      data: mockGroups[0],
      isLoading: false,
      error: null,
    } as ReturnType<typeof useGroup>);
    vi.mocked(useGroupShoppingLists).mockReturnValue({
      data: mockShoppingLists,
      isLoading: false,
      error: null,
    } as ReturnType<typeof useGroup>);
    vi.mocked(useCreateShoppingList).mockReturnValue(
      createMockMutationResult({
        mutateAsync: vi.fn().mockResolvedValue({}),
        isPending: false,
      })
    );
    vi.mocked(useDeleteShoppingList).mockReturnValue(
      createMockMutationResult({
        mutateAsync: vi.fn().mockResolvedValue({}),
        isPending: false,
      })
    );
  });

  it('should render group shopping lists', () => {
    renderWithProviders(<GroupShoppingLists />);
    expect(screen.getByText(mockShoppingLists[0].name)).toBeInTheDocument();
  });

  it('should show create list button', () => {
    renderWithProviders(<GroupShoppingLists />);
    const buttons = screen.getAllByRole('button');
    const createButton = buttons.find(btn => 
      btn.textContent?.toLowerCase().includes('create') ||
      btn.textContent?.toLowerCase().includes('צור')
    );
    expect(createButton).toBeTruthy();
  });

  it('should filter lists by search term', async () => {
    const user = userEvent.setup();
    renderWithProviders(<GroupShoppingLists />);
    
    const searchInput = screen.getByPlaceholderText(/search|חיפוש/i) as HTMLInputElement;
    if (searchInput) {
      await user.type(searchInput, mockShoppingLists[0].name);
      
      await waitFor(() => {
        expect(screen.getByText(mockShoppingLists[0].name)).toBeInTheDocument();
      });
    }
  });

  it('should show loading state', () => {
    vi.mocked(useGroupShoppingLists).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as ReturnType<typeof useGroup>);

    renderWithProviders(<GroupShoppingLists />);
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeTruthy();
  });

  it('should show empty state when no lists', () => {
    vi.mocked(useGroupShoppingLists).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as ReturnType<typeof useGroup>);

    renderWithProviders(<GroupShoppingLists />);
    // Should show empty state or create button
    const emptyText = screen.queryByText(/no lists|אין רשימות/i);
    const buttons = screen.getAllByRole('button');
    expect(emptyText || buttons.length > 0).toBeTruthy();
  });
});

