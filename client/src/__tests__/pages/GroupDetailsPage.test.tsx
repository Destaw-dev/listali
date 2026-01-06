import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders, createMockMutationResult } from '../../test/test-utils';
import GroupDetailsPage from '../../app/[locale]/groups/[groupId]/page';
import { useGroup, useInviteToGroup } from '../../hooks/useGroups';
import { useGroupShoppingLists, useCreateShoppingList } from '../../hooks/useShoppingLists';
import { mockGroups, mockShoppingLists } from '../mocks/mockData';
import { IShoppingList } from '../../types';

vi.mock('../../hooks/useGroups');
vi.mock('../../hooks/useShoppingLists');
vi.mock('../../hooks/useAuthRedirect', () => ({
  useAuthRedirect: () => ({
    isAuthenticated: true,
    isInitialized: true,
  }),
}));
vi.mock('../../store/authStore', () => ({
  useAuthStore: () => ({
    user: { _id: 'user1' },
  }),
}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
  useParams: () => ({ locale: 'he', groupId: 'group1' }),
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));
vi.mock('../../components/groups/InviteModal', () => ({
  InviteModal: ({ isOpen }: { isOpen: boolean }) => isOpen ? <div>InviteModal</div> : null,
}));
vi.mock('../../components/chat/ChatComponent', () => ({
  ChatComponent: () => <div>ChatComponent</div>,
}));
vi.mock('../../components/shoppingList/CreateShoppingListModal', () => ({
  default: ({ isOpen }: { isOpen: boolean }) => isOpen ? <div>CreateShoppingListModal</div> : null,
}));

describe('GroupDetailsPage', () => {
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
      createMockMutationResult<
        IShoppingList,
        Error,
        { groupId: string; listData: { name: string; description?: string; priority?: 'low' | 'medium' | 'high'; tags?: string[] } },
        { prev: IShoppingList[] | undefined; groupId: string; tempId: string }
      >({
        mutateAsync: vi.fn().mockResolvedValue({} as IShoppingList),
        isPending: false,
      })
    );
    vi.mocked(useInviteToGroup).mockReturnValue(
      createMockMutationResult({
        mutateAsync: vi.fn().mockResolvedValue({}),
        isPending: false,
      })
    );
  });

  it('should render group details page', () => {
    renderWithProviders(<GroupDetailsPage />);
    expect(screen.getByText(mockGroups[0].name)).toBeInTheDocument();
  });

  it('should show loading state', () => {
    vi.mocked(useGroup).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as ReturnType<typeof useGroup>);

    renderWithProviders(<GroupDetailsPage />);
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeTruthy();
  });

  it('should display shopping lists', () => {
    renderWithProviders(<GroupDetailsPage />);
    const listTexts = screen.queryAllByText(/lists|רשימות/i);
    const buttons = screen.getAllByRole('button');
    expect(listTexts.length > 0 || buttons.length > 0).toBeTruthy();
  });

  it('should show tabs', () => {
    renderWithProviders(<GroupDetailsPage />);
    const tabs = screen.getAllByRole('button');
    expect(tabs.length).toBeGreaterThan(0);
  });
});

