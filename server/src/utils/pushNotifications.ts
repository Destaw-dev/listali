import webpush from 'web-push';
import User from '../models/user';
import Group from '../models/group';
import { IGroupMember } from '../types';
import { pushNotificationTranslations } from './translations';

if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY && process.env.VAPID_EMAIL) {
  webpush.setVapidDetails(
    process.env.VAPID_EMAIL,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

export type Locale = 'he' | 'en';

export type PushNotificationKey = 
  | 'itemsPurchased' 
  | 'itemsUnpurchased' 
  | 'itemPurchased' 
  | 'itemUnpurchased'
  | 'itemCreated'
  | 'itemUpdated'
  | 'itemDeleted'
  | 'started' 
  | 'stopped' 
  | 'paused' 
  | 'resumed'
  | 'newMessage'
  | 'groupInvited'
  | 'groupJoined'
  | 'groupLeft'
  | 'listCreated'
  | 'test';

export interface PushVars {
  username?: string;
  count?: number;
  itemName?: string;
  listName?: string;
  messagePreview?: string;
  groupName?: string;
}

export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

export interface LocalizedPushOptions {
  key: PushNotificationKey;
  vars: PushVars;
  url?: string;
  title?: string;
  icon?: string;
  badge?: string;
  image?: string;
  data?: Record<string, unknown>;
  tag?: string;
  renotify?: boolean;
  requireInteraction?: boolean;
  actions?: NotificationAction[];
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  data?: Record<string, unknown>;
  tag?: string;
  renotify?: boolean;
  requireInteraction?: boolean;
  actions?: NotificationAction[];
}

/**
 * Get user locale from preferences, fallback to 'en'
 */
export function getUserLocale(user: { preferences?: { language?: string } }): Locale {
  const lang = user.preferences?.language;
  return (lang === 'he' || lang === 'en') ? lang : 'en';
}

/**
 * Get item word (singular/plural) based on count and locale
 */
export function getItemWord(locale: Locale, count: number): string {
  const translations = pushNotificationTranslations[locale];
  return count === 1 ? translations.itemSingular : translations.itemPlural;
}

/**
 * Format template string by replacing {key} placeholders with values from vars
 */
export function formatTemplate(template: string, vars: Record<string, string | number | undefined>): string {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    const value = vars[key];
    return value !== undefined ? String(value) : match;
  });
}

/**
 * Build formatted listName string with locale-specific prefix
 */
function formatListName(locale: Locale, listName?: string): string {
  if (!listName) return '';
  const translations = pushNotificationTranslations[locale];
  return locale === 'he' 
    ? `${translations.fromList} ${listName}`
    : `${translations.fromList} ${listName}`;
}

/**
 * Build push notification body from template key and variables
 */
export function buildPushBody(user: { preferences?: { language?: string } }, key: PushNotificationKey, vars: PushVars): string {
  const locale = getUserLocale(user);
  const translations = pushNotificationTranslations[locale];
  const template = translations[key];
  
  if (!template) {
    console.warn(`Missing translation key: ${key} for locale: ${locale}`);
    return '';
  }

  const templateVars: Record<string, string | number> = {
    username: vars.username || translations.user,
    ...vars
  };

  if (vars.count !== undefined) {
    templateVars.itemWord = getItemWord(locale, vars.count);
  }

  if (vars.listName !== undefined) {
    templateVars.listName = formatListName(locale, vars.listName);
  } else {
    templateVars.listName = '';
  }

  if (vars.messagePreview !== undefined) {
    const maxLength = locale === 'he' ? 50 : 60;
    templateVars.messagePreview = vars.messagePreview.length > maxLength 
      ? vars.messagePreview.substring(0, maxLength) + '...'
      : vars.messagePreview;
  }

  return formatTemplate(template, templateVars).trim();
}

/**
 * Build localized URL with locale prefix
 */
function buildLocalizedUrl(locale: Locale, url?: string): string {
  if (!url) {
    return `/${locale}/dashboard`;
  }
  
  if (url.startsWith('/he/') || url.startsWith('/en/')) {
    return url;
  }
  
  if (url.startsWith('/')) {
    return `/${locale}${url}`;
  }
  
  return `/${locale}/${url}`;
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
  const userLanguage = user.preferences.language || 'he';
  const translation = pushNotificationTranslations[userLanguage as keyof typeof pushNotificationTranslations];

  const notificationPayload = JSON.stringify({
    title: payload.title,
    body: translation[payload.body as keyof typeof translation],
    icon: payload.icon || '/icon.svg',
    badge: payload.badge || '/icon.svg',
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

/**
 * Send localized push notification to a single user
 */
export async function sendLocalizedPushToUser(
  userId: string,
  options: LocalizedPushOptions
): Promise<void> {
  const user = await User.findById(userId).select('pushSubscriptions preferences');
  
  if (!user) {
    throw new Error('User not found');
  }

  const locale = getUserLocale(user);
  const body = buildPushBody(user, options.key, options.vars);
  const url = buildLocalizedUrl(locale, options.url);

  let title = options.title;
  if (!title) {
    switch (options.key) {
      case 'test':
        title = locale === 'he' ? '🧪 בדיקת התראה' : '🧪 Test Notification';
        break;
      case 'itemPurchased':
      case 'itemsPurchased':
        title = locale === 'he' ? 'פריט נרכש' : 'Item Purchased';
        break;
      case 'itemUnpurchased':
      case 'itemsUnpurchased':
        title = locale === 'he' ? 'פריט בוטל' : 'Item Unpurchased';
        break;
      case 'itemCreated':
        title = locale === 'he' ? 'פריט חדש' : 'New Item';
        break;
      case 'itemUpdated':
        title = locale === 'he' ? 'פריט עודכן' : 'Item Updated';
        break;
      case 'itemDeleted':
        title = locale === 'he' ? 'פריט נמחק' : 'Item Deleted';
        break;
      case 'newMessage':
        title = locale === 'he' ? 'הודעה חדשה' : 'New Message';
        break;
      case 'groupInvited':
        title = locale === 'he' ? 'הזמנה לקבוצה' : 'Group Invitation';
        break;
      case 'groupJoined':
        title = locale === 'he' ? 'הצטרפות לקבוצה' : 'Member Joined';
        break;
      case 'groupLeft':
        title = locale === 'he' ? 'עזיבת קבוצה' : 'Member Left';
        break;
      case 'listCreated':
        title = locale === 'he' ? 'רשימה חדשה' : 'New List';
        break;
      default:
        title = locale === 'he' ? 'רשימות קניות' : 'Shopping Lists';
    }
  }

  const payload: PushNotificationPayload = {
    title,
    body,
    icon: options.icon || '/icon-192.svg',
    badge: options.badge || '/icon-192.svg',
    ...(options.image && { image: options.image }),
    data: {
      ...options.data,
      url,
      locale
    },
    tag: options.tag || `default-${userId}`,
    renotify: options.renotify !== undefined ? options.renotify : (options.tag ? true : false),
    requireInteraction: options.requireInteraction || false,
    ...(options.actions && options.actions.length > 0 && { actions: options.actions })
  };

  await sendPushNotificationToUser(userId, payload);
}

/**
 * Send localized push notification to all group members except one user
 */
export async function sendLocalizedPushToGroupExceptUser(
  groupId: string,
  excludeUserId: string,
  options: LocalizedPushOptions
): Promise<void> {
  const group = await Group.findById(groupId).select('members');
  const userIds = group?.members
    .map((member: IGroupMember) => member.user.toString())
    .filter((userId: string) => userId !== excludeUserId) || [];
  
  if (userIds.length > 0) {
    const promises = userIds.map(userId => 
      sendLocalizedPushToUser(userId, options).catch(error => {
        console.error(`Error sending localized push notification to user ${userId}:`, error);
      })
    );
    
    await Promise.allSettled(promises);
  }
}

/**
 * Send localized push notification to group members with specific preference enabled
 */
export async function sendLocalizedPushToGroupExceptUserWithPreference(
  groupId: string,
  excludeUserId: string,
  options: LocalizedPushOptions,
  preferenceKey: 'newMessageNotifications' | 'shoppingListUpdates' | 'groupInvitations'
): Promise<void> {
  const group = await Group.findById(groupId).select('members');
  const userIds = group?.members
    .map((member: IGroupMember) => member.user.toString())
    .filter((userId: string) => userId !== excludeUserId) || [];
  
  if (userIds.length === 0) return;

  const users = await User.find({ _id: { $in: userIds } }).select('preferences');
  
  const eligibleUserIds = users
    .filter(user => user.preferences[preferenceKey] === true)
    .map(user => user._id.toString());

  if (eligibleUserIds.length > 0) {
    const promises = eligibleUserIds.map(userId => 
      sendLocalizedPushToUser(userId, options).catch(error => {
        console.error(`Error sending localized push notification to user ${userId}:`, error);
      })
    );
    
    await Promise.allSettled(promises);
  }
}