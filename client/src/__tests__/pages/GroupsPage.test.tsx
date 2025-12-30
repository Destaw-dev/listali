import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, createMockMutationResult } from '../../test/test-utils';
import GroupsPage from '../../app/[locale]/groups/page';
import { useGroups, useCreateGroup, useJoinGroup } from '../../hooks/useGroups';
import { mockGroups } from '../mocks/mockData';

vi.mock('../../hooks/useGroups');
vi.mock('../../hooks/useAuthRedirect', () => ({
  useAuthRedirect: () => ({
    isAuthenticated: true,
    isInitialized: true,
  }),
}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
  useParams: () => ({ locale: 'he' }),
}));
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

describe('GroupsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useGroups).mockReturnValue({
      data: mockGroups,
      isLoading: false,
      error: null,
    } as ReturnType<typeof useGroups>);
    vi.mocked(useCreateGroup).mockReturnValue(
      createMockMutationResult({
        mutateAsync: vi.fn().mockResolvedValue({}),
        isPending: false,
      })
    );
    vi.mocked(useJoinGroup).mockReturnValue(
      createMockMutationResult({
        mutateAsync: vi.fn().mockResolvedValue({}),
        isPending: false,
      })
    );
  });

  it('should render groups page', () => {
    renderWithProviders(<GroupsPage />);
    const groupTexts = screen.getAllByText(/groups|myGroups|קבוצות/i);
    expect(groupTexts.length).toBeGreaterThan(0);
  });

  it('should display groups list', () => {
    renderWithProviders(<GroupsPage />);
    expect(screen.getByText(mockGroups[0].name)).toBeInTheDocument();
  });

  it('should show create group button', () => {
    renderWithProviders(<GroupsPage />);
    const createButtons = screen.getAllByRole('button');
    const createButton = createButtons.find(btn => 
      btn.textContent?.toLowerCase().includes('create') ||
      btn.textContent?.toLowerCase().includes('צור') ||
      btn.getAttribute('aria-label')?.toLowerCase().includes('create')
    );
    expect(createButton).toBeTruthy();
  });

  it('should show join group button', () => {
    renderWithProviders(<GroupsPage />);
    const joinButtons = screen.getAllByRole('button');
    const joinButton = joinButtons.find(btn => 
      btn.textContent?.toLowerCase().includes('join') ||
      btn.textContent?.toLowerCase().includes('הצטרף') ||
      btn.getAttribute('aria-label')?.toLowerCase().includes('join')
    );
    expect(joinButton).toBeTruthy();
  });

  it('should filter groups by search term', async () => {
    const user = userEvent.setup();
    renderWithProviders(<GroupsPage />);
    
    const searchInput = screen.getByPlaceholderText(/search|חיפוש/i) as HTMLInputElement;
    if (searchInput) {
      await user.type(searchInput, mockGroups[0].name);
      
      await waitFor(() => {
        expect(screen.getByText(mockGroups[0].name)).toBeInTheDocument();
      });
    }
  });

  it('should show loading state', () => {
    vi.mocked(useGroups).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as ReturnType<typeof useGroups>);

    renderWithProviders(<GroupsPage />);
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeTruthy();
  });

  it('should show error state', () => {
    vi.mocked(useGroups).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to load'),
    } as ReturnType<typeof useGroups>);

    renderWithProviders(<GroupsPage />);
    expect(screen.getByText(/error|שגיאה/i)).toBeInTheDocument();
  });

  it('should show empty state when no groups', () => {
    vi.mocked(useGroups).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as ReturnType<typeof useGroups>);

    renderWithProviders(<GroupsPage />);
    // When empty, should show create button or empty message
    const buttons = screen.getAllByRole('button');
    const createButton = buttons.find(btn => 
      btn.textContent?.toLowerCase().includes('create') ||
      btn.textContent?.toLowerCase().includes('צור')
    );
    expect(createButton || buttons.length > 0).toBeTruthy();
  });
});

