import { useEffect, useCallback, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import websocketService from '@/services/websocket';
import { useAuthStore } from '@/store/authStore';
import { useNotification } from '@/contexts/NotificationContext';


export type MessageType = 'text' | 'image' | 'system' | 'item_update' | 'list_update';

export interface MessageSender {
  _id: string;
  username: string;
  firstName: string;
  lastName: string;
  avatar?: string;
}

export interface MessageMetadata {
  itemId?: {
    _id: string;
    displayName: string;
  };
  listId?: {
    _id: string;
    name: string;
  };
  imageUrl?: string;
  fileName?: string;
  fileSize?: number;
  [k: string]: unknown;
}

export interface Message {
  _id: string;
  content: string;
  sender: MessageSender;
  messageType: MessageType;
  metadata?: MessageMetadata;
  isEdited?: boolean;
  editedAt?: Date;
  isDeleted?: boolean;
  createdAt: Date;
  updatedAt: Date;
  readBy: string[]; // user ids
  group: string; // group id
}

export interface SendMessageData {
  groupId: string;
  content: string;
  messageType?: MessageType;
  metadata?: MessageMetadata;
}

export interface EditMessageData {
  messageId: string;
  content: string;
  groupId: string;
}


export const QK = {
  messages: (groupId: string, page?: number) => page ? ['chat', 'messages', groupId, page] : ['chat', 'messages', groupId] as const,
  unread: (groupId: string) => ['chat', 'unread-count', groupId] as const,
  lastRead: (groupId: string) => ['chat', 'last-read', groupId] as const,
  unreadInfo: (groupId: string) => ['chat', 'unread-info', groupId] as const,
} as const;


const uniq = <T,>(arr: T[]) => Array.from(new Set(arr));

const toDate = (v: unknown): Date => (v instanceof Date ? v : new Date(String(v)));

const normalizeMessage = (m: any): Message => ({
  _id: String(m._id ?? m.id),
  content: String(m.content ?? ''),
  sender: {
    _id: String(m.sender?._id ?? m.senderId ?? 'system'),
    username: String(m.sender?.username ?? m.senderName ?? 'system'),
    firstName:
      String(m.sender?.firstName ?? m.senderName?.split?.(' ')?.[0] ?? m.senderName ?? 'system'),
    lastName:
      String(m.sender?.lastName ?? m.senderName?.split?.(' ')?.slice(1)?.join(' ') ?? ''),
    avatar: m.sender?.avatar ?? m.senderAvatar,
  },
  messageType: (m.messageType ?? m.type ?? 'text') as MessageType,
  metadata: m.metadata,
  isEdited: Boolean(m.isEdited),
  editedAt: m.editedAt ? toDate(m.editedAt) : undefined,
  isDeleted: Boolean(m.isDeleted),
  createdAt: toDate(m.createdAt ?? m.timestamp ?? Date.now()),
  updatedAt: toDate(m.updatedAt ?? m.timestamp ?? Date.now()),
  readBy: Array.isArray(m.readBy) ? m.readBy.map(String) : [],
  group: String(m.group ?? m.groupId ?? ''),
});

const normalizeMany = (arr: any[]): Message[] => arr.map(normalizeMessage);

function upsertMessage(list: Message[] | undefined, incoming: Message): Message[] {
  if (!list) return [incoming];
  const idx = list.findIndex((m) => m._id === incoming._id);
  if (idx !== -1) {
    const merged: Message = {
      ...list[idx],
      ...incoming,
      readBy: uniq([...(list[idx].readBy ?? []), ...(incoming.readBy ?? [])]),
    };
    const next = list.slice();
    next[idx] = merged;
    return next;
  }
  return [...list, incoming];
}

function replaceTempMessage(list: Message[] | undefined, tempId: string, real: Message) {
  if (!list) return [real];
  const idx = list.findIndex((m) => m._id === tempId);
  if (idx === -1) return upsertMessage(list, real);
  const next = list.slice();
  next[idx] = real;
  return next;
}


export function useGroupMessages(groupId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: QK.messages(groupId),
    queryFn: async () => {
      const { data } = await apiClient.get(`/messages/group/${groupId}`);
      const messages = normalizeMany(data?.data?.messages ?? []);
      return [...messages].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    },
    enabled: options?.enabled !== false && Boolean(groupId),
    staleTime: 30_000,
    gcTime: 10 * 60_000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 2,
    retryDelay: (i) => Math.min(1000 * 2 ** i, 30_000),
  });
}



export function useUnreadInfo(groupId: string, options?: { 
  enabled?: boolean;
  staleTime?: number;
  refetchOnMount?: boolean;
  refetchOnWindowFocus?: boolean;
}) {
  return useQuery({
    queryKey: QK.unreadInfo(groupId),
    queryFn: async ({ signal }) => {
      const { data } = await apiClient.get(`/messages/group/${groupId}/unread-info`, { signal });
      return {
        unreadCount: Number(data?.data?.unreadCount ?? 0),
        lastReadMessage: data?.data?.lastReadMessage
          ? normalizeMessage(data.data.lastReadMessage)
          : null,
      };
    },
    enabled: options?.enabled !== false && !!groupId,
    staleTime: options?.staleTime ?? 30_000,
    gcTime: 10 * 60_000,
    refetchOnWindowFocus: options?.refetchOnWindowFocus ?? false,
    refetchOnMount: options?.refetchOnMount ?? false,
    retry: 3,
    retryDelay: i => Math.min(1000 * 2 ** i, 30_000),
  });
}


export function useMessages(groupId: string, options?: { 
  enabled?: boolean;
  page?: number;
  limit?: number;
  before?: string;
  after?: string;
}) {
  const { page = 1, limit = 50, before, after } = options || {};
  
  return useQuery({
    queryKey: QK.messages(groupId, page),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (page > 1) params.append('page', page.toString());
      if (limit !== 50) params.append('limit', limit.toString());
      if (before) params.append('before', before);
      if (after) params.append('after', after);
      
      const { data } = await apiClient.get(`/messages/group/${groupId}?${params.toString()}`);
      return {
        messages: normalizeMany(data?.data?.messages ?? []),
        hasMore: data?.data?.hasMore ?? false
      };
    },
    enabled: options?.enabled !== false && Boolean(groupId),
    staleTime: 30_000,
    gcTime: 10 * 60_000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 3,
    retryDelay: (i) => Math.min(1000 * 2 ** i, 30_000),
  });
}

/**
 * ---------------------------
 * Mutations
 * ---------------------------
 */
export function useSendMessage() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { showSuccess, handleApiError } = useNotification();

  return useMutation({
    mutationFn: async (payload: SendMessageData) => {
      const { data } = await apiClient.post('/messages', payload);
      return normalizeMessage(data?.data);
    },
    onMutate: async (variables) => {
      const tempId = `temp-${Date.now()}`;
      await queryClient.cancelQueries({ queryKey: QK.messages(variables.groupId) });
      const previous = queryClient.getQueryData<any>(QK.messages(variables.groupId));

      const optimistic: Message = {
        _id: tempId,
        content: variables.content,
        sender: {
          _id: user?._id ?? 'current-user',
          username: user?.username ?? 'You',
          firstName: user?.firstName ?? 'You',
          lastName: user?.lastName ?? '',
          avatar: user?.avatar,
        },
        messageType: variables.messageType ?? 'text',
        metadata: variables.metadata,
        isEdited: false,
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        readBy: user?._id ? [user._id] : ['current-user'],
        group: variables.groupId,
      };

      queryClient.setQueryData<Message[]>(QK.messages(variables.groupId), (old) =>
        old ? [...old, optimistic] : [optimistic]
      );

      return { previous, tempId, groupId: variables.groupId } as const;
    },
    onSuccess: (real, _vars, ctx) => {
      if (!ctx) return;
      const realNormalized = normalizeMessage(real);

      queryClient.setQueryData<Message[]>(QK.messages(ctx.groupId), (old) => {
        if (!old) return [realNormalized];
        const exists = old.some((m) => m._id === realNormalized._id);
        if (exists) return old;
        return replaceTempMessage(old, ctx.tempId, realNormalized);
      });

      // Update unread info cache
      queryClient.setQueryData(QK.unreadInfo(ctx.groupId), (old: any) => {
        if (!old) return { unreadCount: 0, lastReadMessage: realNormalized };
        return {
          ...old,
          lastReadMessage: realNormalized
        };
      });
      
      showSuccess('chat.messageSent');
    },
    onError: (err, vars, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(QK.messages(ctx.groupId), ctx.previous);
      }
      handleApiError(err);
    },
  });
}

export function useEditMessage() {
  const queryClient = useQueryClient();
  const { showSuccess, handleApiError } = useNotification();

  return useMutation({
    mutationFn: async (data: EditMessageData) => {
      const res = await apiClient.put(`/messages/${data.messageId}`, {
        content: data.content,
        groupId: data.groupId,
      });
      return normalizeMessage(res.data?.data);
    },
    onSuccess: (updated, vars) => {
      queryClient.setQueryData<Message[]>(QK.messages(vars.groupId), (old) =>
        old?.map((m) => (m._id === vars.messageId ? { ...m, ...updated } : m)) ?? [updated]
      );
      showSuccess('chat.messageEdited');
    },
    onError: (e) => {
      handleApiError(e);
    },
  });
}

export function useDeleteMessage() {
  const queryClient = useQueryClient();
  const { showSuccess, handleApiError } = useNotification();

  return useMutation({
    mutationFn: async ({ messageId, groupId }: { messageId: string; groupId: string }) => {
      await apiClient.delete(`/messages/${messageId}`);
      return { messageId, groupId } as const;
    },
    onSuccess: ({ messageId, groupId }) => {
      queryClient.setQueryData<Message[]>(QK.messages(groupId), (old) =>
        old?.map((m) =>
          m._id === messageId
            ? { ...m, isDeleted: true, content: 'הודעה זו נמחקה' }
            : m
        ) ?? []
      );
      showSuccess('chat.messageDeleted');
    },
    onError: (e) => {
      handleApiError(e);
    },
  });
}

export function useMarkMessagesAsRead() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: async (groupId: string) => {
      const res = await apiClient.post(`/messages/group/${groupId}/mark-read`);
      return { groupId, server: res.data?.data } as const;
    },
    onSuccess: (_data, groupId) => {
      queryClient.setQueryData(QK.unread(groupId), 0);
      queryClient.setQueryData<Message[]>(QK.messages(groupId), (old) => {
        if (!old) return [];
        const uid = user?._id ?? 'current-user';
        return old.map((m) => ({ ...m, readBy: uniq([...(m.readBy ?? []), uid]) }));
      });
    },
    onError: (e) => {
      // Silent error - not critical for UX
    },
  });
}

export function useMarkGroupMessagesAsRead() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  return useMutation({
    mutationFn: async (groupId: string) => {
      // Clear existing timeout
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      // Return a promise that resolves after debounce
      return new Promise<{ groupId: string; server: any }>((resolve) => {
        debounceRef.current = setTimeout(async () => {
          try {
            const res = await apiClient.post(`/messages/group/${groupId}/mark-read`);
            resolve({ groupId, server: res.data?.data });
          } catch (error) {
            // Silent error - not critical for UX
            resolve({ groupId, server: null });
          }
        }, 1000); // 1 second debounce
      });
    },
    onSuccess: (_data, groupId) => {
      // Update unread info cache
      queryClient.setQueryData(QK.unreadInfo(groupId), (old: any) => {
        if (!old) return { unreadCount: 0, lastReadMessage: null };
        return {
          ...old,
          unreadCount: 0
        };
      });
      
      // Update messages cache for all pages
      queryClient.setQueriesData(
        { queryKey: ['chat', 'messages', groupId] },
        (old: any) => {
          if (!old) return old;
          const uid = user?._id ?? 'current-user';
          return old.map((m: Message) => ({ 
            ...m, 
            readBy: uniq([...(m.readBy ?? []), uid]) 
          }));
        }
      );
    },
    onError: (e) => {
      // Silent error - not critical for UX
    },
  });
}

export function useChatWebSocket(
  groupId: string,
  options?: { isActive?: boolean }
) {
  const queryClient = useQueryClient();
  const processedIds = useRef<Set<string>>(new Set());
  const { user } = useAuthStore();
  const uid = user?._id;

  const handleNewMessage = useCallback(
    (data: { groupId: string; message: any }) => {
      if (data.groupId !== groupId) return;
      const incomingId: string = data.message._id ?? data.message.id;
      if (!incomingId) return;
      if (processedIds.current.has(incomingId)) return;
      if (uid && (data.message.senderId === uid || data.message.sender?._id === uid)) return;

      const newMsg = normalizeMessage({ ...data.message, groupId });

      queryClient.setQueryData<Message[]>(QK.messages(groupId), (old) => {
        const tempIdx = old?.findIndex(
          (m) =>
            m._id.startsWith?.('temp-') &&
            m.content === newMsg.content &&
            (m.sender?._id === newMsg.sender._id || m.sender?.username === newMsg.sender.username)
        );
        if (typeof tempIdx === 'number' && tempIdx > -1 && old) {
          const next = old.slice();
          next[tempIdx] = newMsg;
          processedIds.current.add(newMsg._id);
          return next;
        }
        processedIds.current.add(newMsg._id);
        return upsertMessage(old, newMsg);
      });

      // Update unread count when new message arrives and chat is not active
      if (!options?.isActive) {
        queryClient.setQueryData(QK.unreadInfo(groupId), (old: any) => {
          if (!old) return { unreadCount: 1, lastReadMessage: null };
          return {
            ...old,
            unreadCount: (old.unreadCount || 0) + 1
          };
        });
      }
    },
    [groupId, queryClient, uid, options?.isActive]
  );

  useEffect(() => {
    websocketService.connect();
    const offNewMessage = websocketService.on('chat:message', handleNewMessage);
    const offTyping = websocketService.on('chat:typing', (data: { groupId: string; user: { username: string } }) => {
      if (data.groupId === groupId) {
        // typing indicator externally
      }
    });
    return () => {
      offNewMessage();
      offTyping();
    };
  }, [groupId, handleNewMessage]);
}

// REMOVED: Direct WebSocket emission
// All events should now be sent only from the backend after proper processing
// The client should use REST API calls instead of direct WebSocket emissions
