import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

interface DashboardStats {
  groups: number;
  lists: number;
  completedLists: number;
  totalItems: number;
  purchasedItems: number;
  remainingItems: number;
  completedTasks: number;
  pendingTasks: number;
}

interface GrowthStats {
  groupsGrowth: number;
  listsGrowth: number;
  completedTasksGrowth: number;
}

interface RecentActivity {
  id: string;
  type: 'message' | 'item_purchased' | 'list_created' | 'group_joined';
  title: string;
  description: string;
  timestamp: string;
  groupName?: string;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
  progress: number;
  maxProgress: number;
}

interface DashboardData {
  stats: DashboardStats;
  growth: GrowthStats;
  recentActivity: RecentActivity[];
  achievements: Achievement[];
  user: {
    lastActive: string;
    online: boolean;
  };
}

export const useDashboard = () => {
  const { isAuthenticated } = useAuthStore();
  
  return useQuery<DashboardData>({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const response = await apiClient.get('/dashboard');
      return response.data.data;
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};
