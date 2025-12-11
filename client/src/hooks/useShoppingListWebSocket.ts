"use client";
import { useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { useNotification } from '@/contexts/NotificationContext';
import { useTranslations } from 'next-intl';
import websocketService from '@/services/websocket';
import { IWebSocketEvents } from '@/types';

export function useShoppingListWebSocket(listId: string, groupId: string) {
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
    } catch (err) {
      return false;
    }
  }, []);

  const safeWebSocketHandler = useCallback((eventName: string, handler: (data: any) => void) => {
    try {
      return websocketService.on(eventName as keyof IWebSocketEvents, (data: any) => {
        try {
          handler(data);
        } catch (err) {
          setError(`Failed to handle ${eventName} event`);
        }
      });
    } catch (err) {
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

      const offStarted = safeWebSocketHandler('shopping:started', (e: any) => {
        if (e.listId !== listId) return;
        
        try {
          queryClient.invalidateQueries({ queryKey: ['shopping-lists', 'full-data', listId] });
          if (e.user?.id !== user?._id) {
            showSuccess('shopping.started', { username: e.user?.username || t('user') });
          }
        } catch (err) {
         
        }
      });

      const offStopped = safeWebSocketHandler('shopping:stopped', (e: any) => {
        if (e.listId !== listId) return;
        try {
          queryClient.invalidateQueries({ queryKey: ['shopping-lists', 'full-data', listId] });
          if (e.user?.id !== user?._id) {
            showInfo('shopping.stopped', { username: e.user?.username || t('user') });
          }
        } catch (err) {
         
        }
      });

      const offPaused = safeWebSocketHandler('shopping:paused', (e: any) => {
        if (e.listId !== listId) return;
        
        try {
          queryClient.invalidateQueries({ queryKey: ['shopping-lists', 'full-data', listId] });
          if (e.user?.id !== user?._id) {
            showInfo('shopping.paused', { username: e.user?.username || t('user') });
          }
        } catch (err) {
         
        }
      });

      const offResumed = safeWebSocketHandler('shopping:resumed', (e: any) => {
        if (e.listId !== listId) return;
        
        try {
          queryClient.invalidateQueries({ queryKey: ['shopping-lists', 'full-data', listId] });
          if (e.user?.id !== user?._id) {
            showInfo('shopping.resumed', { username: e.user?.username || t('user') });
          }
        } catch (err) {
         
        }
      });

      const offLocationUpdated = safeWebSocketHandler('shopping:location_updated', (e: any) => {
        if (e.listId !== listId) return;
        
        try {
          queryClient.invalidateQueries({ queryKey: ['shopping-lists', 'full-data', listId] });
        } catch (err) {
         
        }
      });

      const offItemUpdated = safeWebSocketHandler('item:updated', (e: any) => {
        const eventListId = e.listId || e.item?.shoppingList?._id || e.item?.shoppingList;
        if (eventListId !== listId) return;
        
        try {
          queryClient.invalidateQueries({ queryKey: ['shopping-lists', 'full-data', listId] });
          
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
        } catch (err) {
         
        }
      });

      const offListUpdated = safeWebSocketHandler('list:updated', (e: any) => {
        if (e.listId !== listId) return;
        
        try {
          queryClient.invalidateQueries({ queryKey: ['shopping-lists', 'full-data', listId] });
        } catch (err) {
         
        }
      });

      setIsConnected(true);
      setError(null);

      cleanupFunctions = [offStarted, offStopped, offPaused, offResumed, offLocationUpdated, offItemUpdated, offListUpdated];

    } catch (err) {
     
      setError(err instanceof Error ? err.message : 'Failed to set up real-time updates');
    }

    return () => {
      try {
        cleanupFunctions.forEach(cleanup => cleanup?.());
      } catch (err) {
       
      }
    };
  }, [listId, groupId, user?._id]);

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
    } catch (err) {
      setError('Failed to reconnect');
    }
  }, [listId, groupId, checkWebSocketConnection]);


  return {
    isConnected,
    error,
    retryConnection,
  };
}
