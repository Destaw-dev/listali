import React from 'react';
import { useTranslations } from 'next-intl';
import { Link as IntlLink } from '../../i18n/navigation';

interface SystemMessageProps {
  message: {
    content: string;
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
  };
  groupId: string;
}

export function SystemMessage({ message, groupId }: SystemMessageProps) {
  const t = useTranslations('Chat');
  const renderContent = () => {
    switch (message.messageType) {
      case 'item_update':
        return (
          <div className="flex items-center gap-2 flex-wrap justify-center">
            <span>{message.content}</span>
            <span className="font-medium text-primaryT-700 bg-primaryT-50 px-2 py-1 rounded">
              {message.metadata?.itemId?.displayName}
            </span>
            <span>{t('toList')}</span>
            <IntlLink 
              href={`/groups/${groupId}/${message.metadata?.listId?._id}`} 
              className="font-bold text-primaryT-700 hover:text-primaryT-700 hover:underline bg-primaryT-50 px-2 py-1 rounded"
            >
              {message.metadata?.listId?.name}
            </IntlLink>
          </div>
        );
      
      case 'list_update':
        return (
          <div className="flex items-center gap-2 flex-wrap justify-center">
            <span>{message.content}</span>
            <IntlLink 
              href={`/groups/${groupId}/${message.metadata?.listId?._id}`} 
              className="font-bold text-primaryT-700 hover:text-primaryT-700 hover:underline bg-primaryT-50 px-2 py-1 rounded"
            >
              {message.metadata?.listId?.name}
            </IntlLink>
          </div>
        );
      
      case 'system':
        return <span>{message.content}</span>;
      
      default:
        return <span>{message.content}</span>;
    }
  };

  return (
    <div className="flex justify-center animate-fade-in">
      <div className="bg-surface-hover text-text-muted text-sm px-4 py-2 rounded-full shadow-sm max-w-md">
        {renderContent()}
      </div>
    </div>
  );
}
