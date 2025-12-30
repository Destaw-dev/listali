'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Send, Edit3, Trash2, Clock, Check, CheckCheck, MessageCircle } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { useAuthStore } from '../../store/authStore';
import { 
  useGroupMessages, 
  useSendMessage, 
  useEditMessage, 
  useDeleteMessage,
  useMarkGroupMessagesAsRead,
  useChatWebSocket,
  useUnreadInfo
} from '../../hooks/useChat';
import { SystemMessage } from './SystemMessage';
import { MenuButton, TextArea } from '../common';

interface Message {
  _id: string;
  content: string;
  sender: {
    _id: string;
    username: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  messageType: 'text' | 'image' | 'system' | 'item_update' | 'list_update';
  metadata?: {
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
  };
  isEdited?: boolean;
  editedAt?: Date;
  isDeleted?: boolean;
  createdAt: Date;
  readBy: string[];
  group: string;
  updatedAt: Date;
}

interface ChatComponentProps {
  groupId: string;
  groupName: string;
}

export function ChatComponent({ groupId, groupName }: ChatComponentProps ) {
  const t = useTranslations('Chat');
  const { user, websocket: { isConnected } } = useAuthStore();
  const [newMessage, setNewMessage] = useState('');
  const [editingMessage, setEditingMessage] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useChatWebSocket(groupId, { isActive: true });

  const { data: messages = [], isLoading } = useGroupMessages(groupId);
const { data: unreadInfo } = useUnreadInfo(groupId, {
  staleTime: 0,
  refetchOnMount: true,
  refetchOnWindowFocus: false
});
  
  const unreadCount = unreadInfo?.unreadCount ?? 0;
  const lastReadMessage = unreadInfo?.lastReadMessage;
  const sendMessageMutation = useSendMessage();
  const editMessageMutation = useEditMessage();
  const deleteMessageMutation = useDeleteMessage();
  const markGroupAsReadMutation = useMarkGroupMessagesAsRead();

  const scrollToLastReadMessage = useCallback(() => {
    if (lastReadMessage?._id) {
      const lastReadElement = document.getElementById(`message-${lastReadMessage._id}`);
      if (lastReadElement) {
        lastReadElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
    }
    scrollToBottom();
  }, [lastReadMessage]);

  useEffect(() => {
    if (groupId && !isLoading && unreadCount > 0 && !markGroupAsReadMutation.isPending) {
      markGroupAsReadMutation.mutate(groupId);
    }
  }, [groupId, isLoading, unreadCount, markGroupAsReadMutation.isPending, markGroupAsReadMutation.mutate]);

  useEffect(() => {
    if (messages.length === 0) return;
    
    if (sendMessageMutation.isSuccess) {
      scrollToBottom();
      return;
    }
    
    if (!lastReadMessage || hasScrolledToBottom) {
      scrollToBottom();
    } else {
      setTimeout(() => {
        scrollToLastReadMessage();
      }, 100);
    }
  }, [messages, sendMessageMutation.isSuccess, lastReadMessage, hasScrolledToBottom, scrollToLastReadMessage]);

  const sendMessage = async () => {
    if (!newMessage.trim() || sendMessageMutation.isPending) return;

    const messageData = {
      groupId,
      content: newMessage.trim(),
      messageType: 'text' as const
    };

    sendMessageMutation.mutate(messageData, {
      onSuccess: () => {
        setNewMessage('');
      }
    });
  };

  const editMessage = async (messageId: string) => {
    if (!editContent.trim()) return;

    editMessageMutation.mutate(
      { messageId, content: editContent.trim(), groupId },
      {
        onSuccess: () => {
          setEditingMessage(null);
          setEditContent('');
        }
      }
    );
  };

  const deleteMessage = async (messageId: string) => {
    if (!confirm(t('deleteConfirm'))) return;

    deleteMessageMutation.mutate({ messageId, groupId });
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setHasScrolledToBottom(true);
  };



  const handleScroll = () => {
    if (!messagesContainerRef.current) return;
    
    const container = messagesContainerRef.current;
    const isAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 100;
    setHasScrolledToBottom(isAtBottom);
    
    if (isAtBottom && unreadCount > 0 && !markGroupAsReadMutation.isPending) {
      markGroupAsReadMutation.mutate(groupId);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!sendMessageMutation.isPending) {
        sendMessage();
      }
    }
  };

  const canEditMessage = (message: Message) => {
    if (!user) return false;
    if(whoIsSender(message) === 'system') return false;
    if (message.sender._id !== user._id) return false;
    
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return new Date(message.createdAt) > oneDayAgo;
  };

  const canDeleteMessage = (message: Message) => {
    if (!user) return false;
    if(whoIsSender(message) === 'system') return false;
    return message.sender._id === user._id;
  };

  const whoIsSender = (message: Message) => {
    if (message.messageType === 'item_update' || message.messageType === 'list_update') return 'system';
    if (message.sender._id === user?._id) return 'me';
    return 'other';
  };

  const getMessageStatus = (message: Message) => {
    if (whoIsSender(message) !== 'me') return null;
    
    if (message._id.startsWith('temp-')) {
      return 'sending';
    }
    
    const readByOthers = message.readBy.filter(id => id !== 'current-user');
    if (readByOthers.length > 0) {
      return 'read';
    }
    
    return 'delivered';
  };

  const getFirstUnreadMessageIndex = () => {
    if (!user || !lastReadMessage) return -1;
    
    return messages.findIndex(message => {
      if (message.messageType === 'system') return false;
      
      if (message.sender?._id === user?._id) return false;
      
      return new Date(message.createdAt) > new Date(lastReadMessage.createdAt);
    });
  };

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case 'sending':
        return <Clock className="w-3 h-3 opacity-50" />;
      case 'delivered':
        return <Check className="w-3 h-3 opacity-70" />;
      case 'read':
        return <CheckCheck className="w-3 h-3 text-blue-500" />;
      default:
        return null;
    }
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('he-IL', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p className="text-gray-500">{t('loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-card rounded-lg overflow-hidden shadow-sm">
      <div className="flex items-center justify-between p-4 bg-card border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primaryT-700 to-primaryT-700 rounded-full flex items-center justify-center">
            <span className="text-white font-medium text-sm">
              {groupName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-text-secondary">{groupName}</h3>
            <p className="text-sm text-text-muted">
              {unreadCount > 0 ? t('unreadMessagesCount', { count: unreadCount }) : t('allMessagesRead')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-xs">
            {isConnected ? (
              <>
                <div className="w-2 h-2 bg-success-500 rounded-full"></div>
                <span className="text-success-600">{t('connected')}</span>
              </>
            ) : (
              <>
                <div className="w-2 h-2 bg-error-500 rounded-full"></div>
                <span className="text-error-600">{t('disconnected')}</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth"
        onScroll={handleScroll}
      >
        {messages.length === 0 ? (
          <div className="text-center text-text-muted py-12 animate-fade-in">
            <div className="w-16 h-16 bg-surface-hover rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-8 h-8 text-text-muted" />
            </div>
            <p className="text-lg font-medium mb-2">{t('noMessages')}</p>
            <p className="text-sm">{t('startConversation')}</p>
          </div>
        ) : (
          messages.map((message, index) => {
            const firstUnreadIndex = getFirstUnreadMessageIndex();
            const showUnreadDivider = index === firstUnreadIndex && firstUnreadIndex !== -1;
            const isMyMessage = whoIsSender(message) === 'me';
            const isSystemMessage = whoIsSender(message) === 'system';
            const isNewMessage = message._id.startsWith('temp-') || 
              new Date(message.createdAt).getTime() > Date.now() - 5000;
            
            return (
              <React.Fragment key={message._id}>
                {showUnreadDivider && (
                  <div className="flex items-center justify-center my-6 animate-fade-in">
                    <div className="flex items-center gap-2 px-4 py-2 bg-primaryT-50 text-primaryT-700 rounded-full text-xs font-medium border border-primaryT-100 shadow-sm">
                      <div className="w-2 h-2 bg-primaryT-700 rounded-full animate-pulse"></div>
                      <span>{t('newMessages')}</span>
                    </div>
                  </div>
                )}
                
                {isSystemMessage ? (
                  <SystemMessage message={message} groupId={groupId} />
                ) : (
                  <div
                    id={`message-${message._id}`}
                    className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'} ${
                      isNewMessage ? 'animate-slide-in' : ''
                    }`}
                  >
                    <div className={`max-w-xs lg:max-w-md ${isMyMessage ? 'order-2' : 'order-1'}`}>
                      {!isMyMessage && (
                        <div className="flex items-center gap-2 mb-1 animate-fade-in">
                          <div className="w-6 h-6 bg-gradient-to-br from-neutral-400 to-neutral-600 rounded-full flex items-center justify-center shadow-sm">
                            <span className="text-white text-xs font-medium">
                              {message.sender.firstName?.[0]}{message.sender.lastName?.[0]}
                            </span>
                          </div>
                          <span className="text-xs text-text-muted font-medium">
                            {message.sender.firstName} {message.sender.lastName}
                          </span>
                        </div>
                      )}
                      
                      <div className={`relative group ${isMyMessage ? 'order-1' : 'order-2'}`}>
                        <div
                          className={`px-4 py-2 rounded-2xl shadow-sm transition-all duration-200 hover:shadow-md ${
                            isMyMessage
                              ? 'bg-gradient-to-r from-primaryT-700 to-primaryT-700 text-white hover:from-primaryT-700 hover:to-primaryT-700'
                              : 'bg-accentT-300 hover:bg-accentT-600'
                          }`}
                        >
                          <p className="text-sm leading-relaxed">{message.content}</p>
                          
                          {(canEditMessage(message) || canDeleteMessage(message)) && (
                            <MenuButton size='sm' variant='ghost' className='absolute top-1 start-0 opacity-0 group-hover:opacity-100 transition-all duration-200 transform scale-90 group-hover:scale-100' options={[
                              {
                                label: t('edit'),
                                onClick: () => {
                                  setEditingMessage(message._id);
                                  setEditContent(message.content);
                                },
                                icon: <Edit3 className="w-3 h-3" />
                              },
                              {
                                label: t('delete'),
                                onClick: () => {
                                  deleteMessage(message._id);
                                },
                                variant: 'danger',
                                icon: <Trash2 className="w-3 h-3" />
                              }
                            ]} align='start' position='top' />
                          )}
                        </div>
                      </div>
                      
                      <div className={`flex items-center gap-2 mt-1 ${isMyMessage ? 'justify-end' : 'justify-start'}`}>
                        <span className="text-xs text-text-muted">
                          {formatTime(new Date(message.createdAt))}
                        </span>
                        {isMyMessage && getStatusIcon(getMessageStatus(message))}
                      </div>
                    </div>
                  </div>
                )}
              </React.Fragment>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-card border-t border-border">
        {editingMessage ? (
          <div className="flex gap-2 items-end">
            <div className='w-full'>
            <span className="text-xs text-text-muted mb-1 block">{t('editingMessage')}</span>
            <TextArea
              value={editContent}
              rows={2}
              onChange={(e) => setEditContent(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && editMessage(editingMessage)}
              placeholder={t('editMessagePlaceholder')}
              fullWidth
            />
            </div>
            <Button variant='primary' size='md' onClick={() => editMessage(editingMessage)} disabled={!editContent.trim() || editMessageMutation.isPending} loading={editMessageMutation.isPending}>{t('save')}</Button>
            <Button variant='ghost' size='md' onClick={() => {
              setEditingMessage(null);
              setEditContent('');
            }}>{t('cancel')}</Button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <TextArea
              value={newMessage}
              rows={2}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={t('typeMessagePlaceholder')}
              disabled={sendMessageMutation.isPending}
              icon={<Send className="w-5 h-5 text-muted" />}
              fullWidth
            />
            <Button variant='primary' size='sm' onClick={sendMessage} disabled={!newMessage.trim() || sendMessageMutation.isPending} loading={sendMessageMutation.isPending}><Send className="w-5 h-5" /></Button>
          </div>
        )}
      </div>
    </div>
  );
}
