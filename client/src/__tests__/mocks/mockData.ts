import { IUser, IGroup, IItem, IProduct, ICategory, IShoppingList, IChatMessage } from '@/types';

// Mock Users
export const mockUser: IUser = {
  _id: 'user1',
  username: 'testuser',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  avatar: 'https://example.com/avatar.jpg',
  isActive: true,
  lastSeen: new Date(),
  preferences: {
    pushNotifications: true,
    emailNotifications: true,
    newMessageNotifications: true,
    shoppingListUpdates: true,
    groupInvitations: true,
    darkMode: false,
    language: 'he',
  },
  groups: ['group1'],
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const mockUsers: IUser[] = [
  mockUser,
  {
    ...mockUser,
    _id: 'user2',
    username: 'user2',
    email: 'user2@example.com',
    firstName: 'Second',
    lastName: 'User',
  },
];

// Mock Categories
export const mockCategory: ICategory = {
  _id: 'cat1',
  name: 'פירות וירקות',
  nameEn: 'Fruits & Vegetables',
  icon: '🍎',
  color: '#4CAF50',
  sortOrder: 1,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const mockCategories: ICategory[] = [
  mockCategory,
  {
    ...mockCategory,
    _id: 'cat2',
    name: 'מוצרי חלב',
    nameEn: 'Dairy',
    icon: '🥛',
    color: '#2196F3',
  },
];

// Mock Products
export const mockProduct: IProduct = {
  _id: 'prod1',
  name: 'חלב 3%',
  categoryId: 'cat2',
  subCategoryId: 'subcat1',
  defaultUnit: 'ליטר',
  units: ['ליטר', 'מ״ל'],
  image: 'https://example.com/milk.jpg',
  averagePrice: 5.90,
  tags: ['חלב', 'דיאט'],
  isActive: true,
  kosher: true,
  organic: false,
  glutenFree: true,
  brand: 'תנובה',
  category: mockCategories[1],
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const mockProducts: IProduct[] = [
  mockProduct,
  {
    ...mockProduct,
    _id: 'prod2',
    name: 'לחם לבן',
    categoryId: 'cat3',
    defaultUnit: 'יחידה',
    units: ['יחידה'],
  },
];

// Mock Items
export const mockItem: IItem = {
  _id: 'item1',
  id: 'item1',
  name: 'חלב 3%',
  quantity: 2,
  unit: 'l',
  category: 'cat2',
  status: 'pending',
  isPurchased: false,
  addedBy: 'user1',
  shoppingList: 'list1',
  priority: 'medium',
  product: 'prod1',
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const mockItems: IItem[] = [
  mockItem,
  {
    ...mockItem,
    _id: 'item2',
    id: 'item2',
    name: 'לחם לבן',
    quantity: 1,
    unit: 'piece',
    category: 'cat3',
    status: 'purchased',
    isPurchased: true,
    purchasedBy: 'user1',
    purchasedAt: new Date(),
  },
  {
    ...mockItem,
    _id: 'item3',
    id: 'item3',
    name: 'ביצים',
    quantity: 12,
    unit: 'piece',
    status: 'pending',
  },
];

// Mock Groups
export const mockGroup: IGroup = {
  _id: 'group1',
  name: 'משפחה',
  description: 'רשימת קניות משפחתית',
  avatar: 'https://example.com/group.jpg',
  members: [
    {
      id: 'member1',
      userId: 'user1',
      groupId: 'group1',
      role: 'owner',
      joinedAt: new Date(),
      user: {
        id: 'user1',
        username: 'testuser',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
      },
      permissions: {
        canCreateLists: true,
        canEditLists: true,
        canDeleteLists: true,
        canInviteMembers: true,
        canManageMembers: true,
      },
    },
  ],
  owner: 'user1',
  createdBy: 'user1',
  settings: {
    allowMemberInvite: true,
    requireApproval: false,
    maxMembers: 10,
  },
  inviteCode: 'ABC123',
  isActive: true,
  shoppingLists: ['list1'],
  pendingInvites: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const mockGroups: IGroup[] = [mockGroup];

// Mock Shopping Lists
export const mockShoppingList: IShoppingList = {
  _id: 'list1',
  name: 'קניות שבועיות',
  description: 'רשימת קניות לשבוע הקרוב',
  group: 'group1',
  groupId: 'group1',
  createdBy: 'user1',
  status: 'active',
  isActive: true,
  isCompleted: false,
  items: ['item1', 'item2', 'item3'],
  priority: 'medium',
  tags: [],
  metadata: {
    itemsCount: 3,
    completedItemsCount: 1,
  },
  shoppingSessions: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const mockShoppingLists: IShoppingList[] = [mockShoppingList];

// Mock Chat Messages
export const mockChatMessage: IChatMessage = {
  id: 'msg1',
  content: 'היי, מה שלומכם?',
  senderId: 'user1',
  senderName: 'Test User',
  senderAvatar: 'https://example.com/avatar.jpg',
  timestamp: new Date().toISOString(),
  type: 'text',
  status: 'sent',
};

export const mockChatMessages: IChatMessage[] = [
  mockChatMessage,
  {
    ...mockChatMessage,
    id: 'msg2',
    content: 'אני אקנה את החלב',
    senderId: 'user2',
    senderName: 'Second User',
  },
];

// Mock API Responses
export const mockApiResponse = <T>(data: T) => ({
  success: true,
  data,
});

export const mockApiError = (message: string, statusCode = 400) => ({
  success: false,
  error: message,
  details: {
    name: 'Error',
    statusCode,
    isOperational: true,
  },
});

// Mock Dashboard Data
export const mockDashboardData = {
  stats: {
    groups: 3,
    lists: 10,
    completedLists: 2,
    totalItems: 50,
    purchasedItems: 20,
    remainingItems: 30,
    completedTasks: 15,
    pendingTasks: 5,
  },
  growth: {
    groupsGrowth: 10,
    listsGrowth: 20,
    completedTasksGrowth: 15,
  },
  recentActivity: [
    {
      id: 'act1',
      type: 'message' as const,
      title: 'New message',
      description: 'Test User sent a message',
      timestamp: new Date().toISOString(),
      groupName: 'Test Group',
    },
  ],
  achievements: [
    {
      id: 'ach1',
      title: 'First List',
      description: 'Created your first shopping list',
      unlocked: true,
      progress: 100,
      maxProgress: 100,
    },
  ],
  user: {
    lastActive: new Date().toISOString(),
    online: true,
  },
};

