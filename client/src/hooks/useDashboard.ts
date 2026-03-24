import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/api';
import { useAuthStore } from '../store/authStore';

export interface MemberSummary {
  id: string;
  username: string;
  avatar?: string;
}

export interface ActiveList {
  id: string;
  name: string;
  groupId: string;
  groupName: string;
  totalItems: number;
  remainingItems: number;
  members: MemberSummary[];
}

export interface GroupSummary {
  id: string;
  name: string;
  activeListsCount: number;
  members: MemberSummary[];
}

export interface RecentActivity {
  id: string;
  type: 'item_update' | 'list_update';
  description: string;
  timestamp: string;
  groupName?: string;
}

export interface DashboardData {
  activeLists: ActiveList[];
  groups: GroupSummary[];
  recentActivity: RecentActivity[];
  pendingInvitations: number;
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
