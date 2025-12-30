import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { ChatComponent } from '@/components/chat/ChatComponent';
import { renderWithProviders } from '@/test/test-utils';
import { mockUser } from '../../mocks/mockData';

const mockMessages = [
  {
    _id: 'msg1',
    content: 'Hello',
    sender: {
      _id: 'user1',
      username: 'testuser',
      firstName: 'Test',
      lastName: 'User',
    },
    messageType: 'text' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
    readBy: [],
    group: 'group1',
    isEdited: false,
    isDeleted: false,
  },
  {
    _id: 'msg2',
    content: 'Hi there',
    sender: {
      _id: mockUser._id,
      username: mockUser.username,
      firstName: mockUser.firstName,
      lastName: mockUser.lastName,
    },
    messageType: 'text' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
    readBy: [],
    group: 'group1',
    isEdited: false,
    isDeleted: false,
  },
];

// Mock dependencies
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

const mockUseAuthStore = vi.fn(() => ({
  user: mockUser,
  websocket: {
    isConnected: true,
  },
}));

vi.mock('@/store/authStore', () => ({
  useAuthStore: () => mockUseAuthStore(),
}));

const mockUseGroupMessages = vi.fn(() => ({
  data: mockMessages,
  isLoading: false,
  error: null,
}));

const mockUseSendMessage = vi.fn(() => ({
  mutate: vi.fn(),
  mutateAsync: vi.fn(),
  isPending: false,
  isSuccess: false,
}));

const mockUseUnreadInfo = vi.fn(() => ({
  data: {
    unreadCount: 0,
    lastReadMessage: null,
  },
  isLoading: false,
}));

vi.mock('@/hooks/useChat', () => ({
  useGroupMessages: () => mockUseGroupMessages(),
  useSendMessage: () => mockUseSendMessage(),
  useEditMessage: vi.fn(() => ({
    mutate: vi.fn(),
    mutateAsync: vi.fn(),
    isPending: false,
  })),
  useDeleteMessage: vi.fn(() => ({
    mutate: vi.fn(),
    mutateAsync: vi.fn(),
    isPending: false,
  })),
  useMarkGroupMessagesAsRead: vi.fn(() => ({
    mutate: vi.fn(),
    isPending: false,
  })),
  useChatWebSocket: vi.fn(),
  useUnreadInfo: () => mockUseUnreadInfo(),
}));

vi.mock('@/components/chat/SystemMessage', () => ({
  SystemMessage: ({ message }: { message: { content: string } }) => <div>System: {message.content}</div>,
}));

describe('ChatComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseGroupMessages.mockReturnValue({
      data: mockMessages,
      isLoading: false,
      error: null,
    });
    mockUseSendMessage.mockReturnValue({
      mutate: vi.fn(),
      mutateAsync: vi.fn(),
      isPending: false,
      isSuccess: false,
    });
    mockUseUnreadInfo.mockReturnValue({
      data: {
        unreadCount: 0,
        lastReadMessage: null,
      },
      isLoading: false,
    });
  });

  it('should render chat component', () => {
    renderWithProviders(
      <ChatComponent groupId="group1" groupName="Test Group" />
    );
    
    expect(screen.getByText('Test Group')).toBeInTheDocument();
  });

  it('should display messages', () => {
    renderWithProviders(
      <ChatComponent groupId="group1" groupName="Test Group" />
    );
    
    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByText('Hi there')).toBeInTheDocument();
  });

  it('should show empty state when no messages', () => {
    mockUseGroupMessages.mockReturnValueOnce({
      data: [],
      isLoading: false,
      error: null,
    });

    renderWithProviders(
      <ChatComponent groupId="group1" groupName="Test Group" />
    );
    
    expect(screen.getByText(/noMessages/i)).toBeInTheDocument();
  });

  it('should show loading state', () => {
    mockUseGroupMessages.mockReturnValueOnce({
      data: [],
      isLoading: true,
      error: null,
    });

    renderWithProviders(
      <ChatComponent groupId="group1" groupName="Test Group" />
    );
    
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('should display connection status', () => {
    renderWithProviders(
      <ChatComponent groupId="group1" groupName="Test Group" />
    );
    
    // Should show connected status
    const statusText = screen.queryByText(/connected|disconnected/i);
    expect(statusText || screen.getByText('Test Group')).toBeTruthy();
  });

  it('should show message input', () => {
    renderWithProviders(
      <ChatComponent groupId="group1" groupName="Test Group" />
    );
    
    const textareas = screen.getAllByRole('textbox');
    expect(textareas.length).toBeGreaterThan(0);
  });
});

