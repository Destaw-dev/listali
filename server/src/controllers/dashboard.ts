import { Request, Response } from 'express';
import Group from '../models/group';
import ShoppingList  from '../models/shoppingList';
import  Message  from '../models/message';
import Item  from '../models/item';
import User from '../models/user';
import { errorResponse, successResponse } from '@/middleware/errorHandler';

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
  timestamp: Date;
  groupName?: string | undefined;
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

function calculateGrowth(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

function getPreviousMonthRange(): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const end = new Date(now.getFullYear(), now.getMonth(), 0);
  return { start, end };
}

export const getDashboardData = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json(errorResponse('Unauthorized'));
      return;
    }

    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const { start: prevMonthStart, end: prevMonthEnd } = getPreviousMonthRange();

    const groups = await Group.find({
      $or: [
        { owner: userId },
        { 'members.user': userId }
      ]
    });

    const groupIds = groups.map(group => group._id);

    const lists = await ShoppingList.find({
      group: { $in: groupIds }
    });

    const listIds = lists.map(list => list._id);

    const [
      messages,
      items,
      user
    ] = await Promise.all([
      Message.find({
        group: { $in: groupIds }
      }),
      
      Item.find({
        shoppingList: { $in: listIds }
      }),
      
      User.findById(userId)
    ]);

    const currentMonthGroups = groups.filter(group => 
      group.createdAt >= currentMonthStart && group.createdAt <= currentMonthEnd
    ).length;

    const currentMonthLists = lists.filter(list => 
      list.createdAt >= currentMonthStart && list.createdAt <= currentMonthEnd
    ).length;

    const previousMonthGroups = groups.filter(group => 
      group.createdAt >= prevMonthStart && group.createdAt <= prevMonthEnd
    ).length;

    const previousMonthLists = lists.filter(list => 
      list.createdAt >= prevMonthStart && list.createdAt <= prevMonthEnd
    ).length;

    const previousMonthCompletedTasks = items.filter(item => 
      item.status === 'purchased' && 
      item.purchasedAt && 
      item.purchasedAt >= prevMonthStart && 
      item.purchasedAt <= prevMonthEnd
    ).length;

    // Calculate additional stats
    const totalItems = items.length;
    const purchasedItems = items.filter(item => item.status === 'purchased').length;
    const remainingItems = totalItems - purchasedItems;
    const completedLists = lists.filter(list => {
      const listItems = items.filter(item => item.shoppingList.toString() === list._id.toString());
      return listItems.length > 0 && listItems.every(item => item.status === 'purchased');
    }).length;
    
    const completedTasks = items.filter(item => 
      item.status === 'purchased' && 
      item.purchasedAt && 
      item.purchasedAt >= currentMonthStart && 
      item.purchasedAt <= currentMonthEnd
    ).length;
    
    const pendingInvitations = user?.pendingInvitations.filter(inv => inv.status === 'pending').length || 0;
    
    const pendingTasks = pendingInvitations;                    
  

    const growth: GrowthStats = {
      groupsGrowth: calculateGrowth(currentMonthGroups, previousMonthGroups),
      listsGrowth: calculateGrowth(currentMonthLists, previousMonthLists),
      completedTasksGrowth: calculateGrowth(previousMonthCompletedTasks, completedTasks)
    };

    const stats: DashboardStats = {
      groups: groups.length,
      lists: lists.length,
      completedLists,
      totalItems,
      purchasedItems,
      remainingItems,
      completedTasks,
      pendingTasks
    };

    const recentActivity: RecentActivity[] = [
      ...messages
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, 3)
        .map(message => ({
          id: message._id.toString(),
          type: 'message' as const,
          title: 'הודעה חדשה בקבוצה',
          description: message.content.substring(0, 50) + '...',
          timestamp: message.createdAt,
          groupName: groups.find(g => g._id.toString() === message.group.toString())?.name
        })),
      
      ...items
        .filter(item => item.status === 'purchased')
        .sort((a, b) => (b.updatedAt || b.createdAt).getTime() - (a.updatedAt || a.createdAt).getTime())
        .slice(0, 2)
        .map(item => ({
          id: item._id.toString(),
          type: 'item_purchased' as const,
          title: 'פריט נרכש',
          description: `${item.name} נרכש בהצלחה`,
          timestamp: item.updatedAt || item.createdAt
        }))
    ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 5);

    const achievements: Achievement[] = [
      {
        id: 'first_group',
        title: 'קבוצה ראשונה נוצרה',
        description: 'יצרת את קבוצת הקניות הראשונה שלך',
        unlocked: groups.length > 0,
        progress: Math.min(groups.length, 1),
        maxProgress: 1
      },
      {
        id: 'shopping_master',
        title: 'אמן הקניות',
        description: 'השלמת 10 רשימות קניות',
        unlocked: completedLists >= 10,
        progress: Math.min(completedLists, 10),
        maxProgress: 10
      },
      {
        id: 'group_player',
        title: 'שחקן קבוצה',
        description: 'הצטרפת ל-5 קבוצות שונות',
        unlocked: groups.length >= 5,
        progress: Math.min(groups.length, 5),
        maxProgress: 5
      }
    ];

    const userInfo = {
      lastActive: user?.updatedAt ? user.updatedAt.toLocaleTimeString('he-IL', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }) : 'לא ידוע',
      online: true
    };

    const dashboardData: DashboardData = {
      stats,
      growth,
      recentActivity,
      achievements,
      user: userInfo
    };

    res.status(200).json(successResponse(dashboardData, 'Dashboard data retrieved successfully'));

  } catch (error) {
    console.error('Dashboard data error:', error);
    res.status(500).json(errorResponse('Internal server error'));
  }
};
