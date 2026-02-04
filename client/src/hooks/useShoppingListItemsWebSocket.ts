"use client";
import { useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import { useNotification } from '../contexts/NotificationContext';
import { useTranslations } from 'next-intl';
import websocketService from '../services/websocket';
import { IWebSocketEvents } from '../types';

export function useShoppingListItemsWebSocket(groupId: string, listId: string) {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthStore();
  const { showSuccess, showInfo } = useNotification();
  const t = useTranslations('shopping');
  const queryClient = useQueryClient();

  const checkWebSocketConnection = useCallback(() => {
    try {
      const socket = websocketService.getSocket();
      return socket && socket.connected;
    } catch {
      return false;
    }
  }, []);

  const safeWebSocketHandler = useCallback(<K extends keyof IWebSocketEvents>(
    eventName: K, 
    handler: (data: IWebSocketEvents[K]) => void
  ) => {
    try {
      return websocketService.on(eventName, (data: IWebSocketEvents[K]) => {
        try {
          handler(data);
        } catch {
          setError(`Failed to handle ${eventName} event`);
        }
      });
    } catch {
      setError(`Failed to set up ${eventName} listener`);
      return () => {};
    }
  }, []);

  useEffect(() => {
    if (!listId || !groupId) {
      return;
    }

    if (!user?._id) {
      return;
    }

    let cleanupFunctions: (() => void)[] = [];

    try {
      const isConnected = checkWebSocketConnection();
      setIsConnected(!!isConnected);
      
      if (!isConnected) {
        setError('notifications.websocketError');
      }

      const offItemsBatchUpdated = safeWebSocketHandler('items:batch-updated', (e: IWebSocketEvents['items:batch-updated']) => {
        if (e.listId !== listId) return;
        
        queryClient.invalidateQueries({ queryKey: ['shopping-lists', 'full-data', e.listId] });

        if (e.updatedBy?.id !== user?._id && e.items.length > 0) {
          const listName = e.listName || '';
          if (e.action === 'batch_purchase') {
            showSuccess('shopping.itemsPurchased', { 
              username: e.updatedBy?.username || t('user'), 
              count: String(e.items.length),
              listName: listName ? ` ${t('fromList')} "${listName}"` : ''
            });
          } else if (e.action === 'batch_unpurchase') {
            showInfo('shopping.itemsUnpurchased', { 
              username: e.updatedBy?.username || t('user'), 
              count: String(e.items.length),
              listName: listName ? ` ${t('fromList')} "${listName}"` : ''
            });
          }
        }
      });

      const offItemUpdated = safeWebSocketHandler('item:updated', (e: IWebSocketEvents['item:updated']) => {
        const eventListId = e.listId || (typeof e.item?.shoppingList === 'string' 
          ? e.item.shoppingList 
          : (typeof e.item?.shoppingList === 'object' && e.item.shoppingList !== null && '_id' in e.item.shoppingList
            ? (e.item.shoppingList as { _id: string })._id
            : undefined));
        if (eventListId !== listId) return;
        
        queryClient.invalidateQueries({ queryKey: ['shopping-lists', 'full-data', eventListId] });

        if (e.updatedBy?.id !== user?._id) {
          const itemName = e.item?.name || t('item');
          const listName = e.listName || '';
          if (e.action === 'purchase') {
            showSuccess('shopping.itemPurchased', { 
              username: e.updatedBy?.username || t('user'), 
              itemName,
              listName: listName ? ` ${t('fromList')} "${listName}"` : ''
            });
            
          } else if (e.action === 'unpurchase') {
            showInfo('shopping.itemUnpurchased', { 
              username: e.updatedBy?.username || t('user'), 
              itemName,
              listName: listName ? ` ${t('fromList')} "${listName}"` : ''
            });
          }
        }
      });

      setIsConnected(true);
      setError(null);

      cleanupFunctions = [offItemsBatchUpdated, offItemUpdated];

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set up real-time updates');
    }

    return () => {
      cleanupFunctions.forEach(cleanup => cleanup?.());
    };
  }, [listId, groupId, user?._id, checkWebSocketConnection, safeWebSocketHandler, queryClient, showSuccess, showInfo, t]);

  const retryConnection = useCallback(() => {
    setError(null);
    
    try {
      const isConnected = checkWebSocketConnection();
      setIsConnected(!!isConnected);
      
      if (isConnected) {
        setError(null);
      } else {
        setError('WebSocket connection failed');
      }
    } catch {
      setError('Failed to reconnect');
    }
  }, [checkWebSocketConnection]);

  return {
    isConnected,
    error,
    retryConnection,
  };
}
