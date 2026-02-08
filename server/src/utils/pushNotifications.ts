import webpush from 'web-push';
import User from '../models/user';
import Group from '@/models/group';
import { IGroupMember } from '@/types';

if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY && process.env.VAPID_EMAIL) {
  webpush.setVapidDetails(
    process.env.VAPID_EMAIL,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: Record<string, unknown>;
  tag?: string;
  requireInteraction?: boolean;
}

export async function sendPushNotificationToUser(
  userId: string,
  payload: PushNotificationPayload
): Promise<void> {
  const user = await User.findById(userId).select('pushSubscriptions preferences');
  
  if (!user) {
    throw new Error('User not found');
  }

  if (!user.preferences.pushNotifications) {
    return;
  }

  if (!user.pushSubscriptions || user.pushSubscriptions.length === 0) {
    return;
  }

  const notificationPayload = JSON.stringify({
    title: payload.title,
    body: payload.body,
    icon: payload.icon || '/icon-192.svg',
    badge: payload.badge || '/icon-192.svg',
    data: payload.data || {},
    tag: payload.tag,
    requireInteraction: payload.requireInteraction || false
  });

  const promises = user.pushSubscriptions.map(async (subscription: {
    endpoint: string;
    keys: { p256dh: string; auth: string };
  }) => {
    try {
      await webpush.sendNotification(
        {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.keys.p256dh,
            auth: subscription.keys.auth
          }
        },
        notificationPayload
      );
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'statusCode' in error) {
        const statusCode = error.statusCode as number;
        if (statusCode === 410 || statusCode === 404) {
          user.pushSubscriptions = user.pushSubscriptions.filter(
            (sub: { endpoint: string }) => sub.endpoint !== subscription.endpoint
          );
          await user.save();
        }
      }
      console.error('Error sending push notification:', error);
    }
  });

  await Promise.allSettled(promises);
}

export async function sendPushNotificationToUsers(
  userIds: string[],
  payload: PushNotificationPayload
): Promise<void> {
  const promises = userIds.map(userId => 
    sendPushNotificationToUser(userId, payload).catch(error => {
      console.error(`Error sending push notification to user ${userId}:`, error);
    })
  );
  
  await Promise.allSettled(promises);
}


export async function sendPushNotificationToGroupExceptUser(
  groupId: string,
  excludeUserId: string,
  payload: PushNotificationPayload
): Promise<void> {
  const group = await Group.findById(groupId).select('members');
  const userIds = group?.members.map((member: IGroupMember) => member.user.toString()).filter((userId: string) => userId !== excludeUserId) || [];
  if (userIds.length > 0) {
    await sendPushNotificationToUsers(userIds, payload);
  }
}