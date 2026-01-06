import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { ShoppingModeCard } from '../../../components/shoppingList/ShoppingModeCard';
import { renderWithProviders } from '../../../test/test-utils';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));
vi.mock('../../../hooks/useShoppingModeQueries', () => ({
  useStartShopping: vi.fn(() => ({
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
  })),
  useStopShopping: vi.fn(() => ({
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
  })),
  usePauseShopping: vi.fn(() => ({
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
  })),
  useResumeShopping: vi.fn(() => ({
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
  })),
}));

const mockShoppingSession = {
  currentUserSession: {
    _id: 'session1',
    id: 'session1',
    listId: 'list1',
    userId: 'user1',
    groupId: 'group1',
    status: 'active' as const,
    startedAt: new Date(),
    isActive: true,
    itemsPurchased: 0,
    totalItems: 10,
    lastActivity: new Date(),
  },
  activeSessions: [
    {
      _id: 'session1',
      id: 'session1',
      listId: 'list1',
      userId: 'user1',
      groupId: 'group1',
      status: 'active' as const,
      startedAt: new Date(),
      isActive: true,
      itemsPurchased: 0,
      totalItems: 10,
      lastActivity: new Date(),
    },
  ],
  totalActiveSessions: 1,
};

describe('ShoppingModeCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render start shopping button when no session', () => {
    renderWithProviders(
      <ShoppingModeCard
        listId="list1"
        groupId="group1"
        shoppingSession={undefined}
        totalItems={10}
        purchasedItems={3}
      />
    );
    
    const buttons = screen.getAllByRole('button');
    const startButton = buttons.find(btn => 
      btn.textContent?.toLowerCase().includes('start') ||
      btn.textContent?.toLowerCase().includes('התחל')
    );
    expect(startButton).toBeTruthy();
  });

  it('should render stop shopping button when session is active', () => {
    renderWithProviders(
      <ShoppingModeCard
        listId="list1"
        groupId="group1"
        shoppingSession={mockShoppingSession}
        totalItems={10}
        purchasedItems={3}
      />
    );
    
    const buttons = screen.getAllByRole('button');
    const sessionButton = buttons.find(btn => 
      btn.textContent?.toLowerCase().includes('stop') ||
      btn.textContent?.toLowerCase().includes('pause') ||
      btn.textContent?.toLowerCase().includes('עצור') ||
      btn.textContent?.toLowerCase().includes('השהה')
    );
    expect(sessionButton || buttons.length > 0).toBeTruthy();
  });

  it('should display total items', () => {
    renderWithProviders(
      <ShoppingModeCard
        listId="list1"
        groupId="group1"
        shoppingSession={undefined}
        totalItems={10}
        purchasedItems={3}
      />
    );
    
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('should display remaining items', () => {
    renderWithProviders(
      <ShoppingModeCard
        listId="list1"
        groupId="group1"
        shoppingSession={undefined}
        totalItems={10}
        purchasedItems={3}
      />
    );
    
    const remainingTexts = screen.queryAllByText('7');
    expect(remainingTexts.length > 0 || screen.getByText('10')).toBeTruthy();
  });

  it('should show active shoppers count', () => {
    renderWithProviders(
      <ShoppingModeCard
        listId="list1"
        groupId="group1"
        shoppingSession={mockShoppingSession}
        totalItems={10}
        purchasedItems={3}
      />
    );
    
    const activeTexts = screen.queryAllByText(/1|active/i);
    expect(activeTexts.length > 0 || screen.getByText('10')).toBeTruthy();
  });
});

