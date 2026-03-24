import { Request, Response } from 'express';
import Group from '../models/group';
import ShoppingList from '../models/shoppingList';
import Message from '../models/message';
import Item from '../models/item';
import User from '../models/user';
import { errorResponse, successResponse } from '../middleware/handlers';

interface MemberSummary {
  id: string;
  username: string;
  avatar?: string;
}

interface ActiveList {
  id: string;
  name: string;
  groupId: string;
  groupName: string;
  totalItems: number;
  remainingItems: number;
  members: MemberSummary[];
}

interface GroupSummary {
  id: string;
  name: string;
  activeListsCount: number;
  members: MemberSummary[];
}

interface RecentActivity {
  id: string;
  type: 'item_update' | 'list_update';
  description: string;
  timestamp: Date;
  groupName?: string;
}

interface DashboardData {
  activeLists: ActiveList[];
  groups: GroupSummary[];
  recentActivity: RecentActivity[];
  pendingInvitations: number;
}

export const getDashboardData = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json(errorResponse('Unauthorized'));
      return;
    }

    const groups = await Group.find({
      $or: [{ owner: userId }, { 'members.user': userId }],
    }).populate('members.user', 'username avatar');

    const groupIds = groups.map((g) => g._id);

    const [lists, activityMessages, user] = await Promise.all([
      ShoppingList.find({ group: { $in: groupIds } }),

      Message.find({
        group: { $in: groupIds },
        messageType: { $in: ['item_update', 'list_update'] },
        isDeleted: false,
      })
        .sort({ createdAt: -1 })
        .limit(20),

      User.findById(userId),
    ]);

    // Active lists with detail
    const listIds = lists.map((l) => l._id);
    const items = await Item.find({ shoppingList: { $in: listIds } });

    const activeLists: ActiveList[] = lists
      .filter((list) => list.status === 'active')
      .map((list) => {
        const listItems = items.filter(
          (i) => i.shoppingList.toString() === list._id.toString()
        );
        const group = groups.find(
          (g) => g._id.toString() === list.group.toString()
        );
        const members: MemberSummary[] = ((group?.members || []) as any[])
          .slice(0, 4)
          .map((m: any) => ({
            id: m.user._id.toString(),
            username: m.user.username,
            avatar: m.user.avatar,
          }));
        return {
          id: list._id.toString(),
          name: list.name,
          groupId: group?._id.toString() || '',
          groupName: group?.name || '',
          totalItems: listItems.length,
          remainingItems: listItems.filter((i) => i.status !== 'purchased')
            .length,
          members,
        };
      });

    // Groups summary
    const groupsSummary: GroupSummary[] = groups.map((group) => {
      const members: MemberSummary[] = ((group.members || []) as any[])
        .slice(0, 4)
        .map((m: any) => ({
          id: m.user._id.toString(),
          username: m.user.username,
          avatar: m.user.avatar,
        }));
      return {
        id: group._id.toString(),
        name: group.name,
        activeListsCount: lists.filter(
          (l) =>
            l.group.toString() === group._id.toString() &&
            l.status === 'active'
        ).length,
        members,
      };
    });

    // Activity feed from system messages
    const recentActivity: RecentActivity[] = activityMessages
      .slice(0, 15)
      .map((msg) => ({
        id: msg._id.toString(),
        type: msg.messageType as 'item_update' | 'list_update',
        description: msg.content,
        timestamp: msg.createdAt,
        groupName: groups.find(
          (g) => g._id.toString() === msg.group.toString()
        )?.name,
      }));

    const pendingInvitations =
      user?.pendingInvitations.filter((inv) => inv.status === 'pending')
        .length || 0;

    const dashboardData: DashboardData = {
      activeLists,
      groups: groupsSummary,
      recentActivity,
      pendingInvitations,
    };

    res
      .status(200)
      .json(successResponse(dashboardData, 'Dashboard data retrieved successfully'));
  } catch (error) {
    res.status(500).json(errorResponse('Internal server error'));
  }
};
