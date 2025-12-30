'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { X, Bell, Smartphone, Mail } from 'lucide-react';
import { Card, CardBody, Button } from '../common';
import { useNotification } from '../../contexts/NotificationContext';
import { Toggle } from '../common/Toggle';
import { useModalScrollLock } from '../../hooks/useModalScrollLock';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSettings: {
    pushNotifications: boolean;
    emailNotifications: boolean;
    newMessageNotifications: boolean;
    shoppingListUpdates: boolean;
    groupInvitations: boolean;
  };
  onSave: (settings: {
    pushNotifications: boolean;
    emailNotifications: boolean;
    newMessageNotifications: boolean;
    shoppingListUpdates: boolean;
    groupInvitations: boolean;
  }) => Promise<void>;
  isLoading?: boolean;
}

const notificationTypes = [
  {
    id: 'pushNotifications',
    icon: Smartphone,
    title: 'pushNotifications',
    description: 'pushNotificationsDesc',
  },
  {
    id: 'emailNotifications',
    icon: Mail,
    title: 'emailNotifications',
    description: 'emailNotificationsDesc',
  },
  {
    id: 'newMessageNotifications',
    icon: Bell,
    title: 'newMessageNotifications',
    description: 'newMessageNotificationsDesc',
  },
  {
    id: 'shoppingListUpdates',
    icon: Bell,
    title: 'shoppingListUpdates',
    description: 'shoppingListUpdatesDesc',
  },
  {
    id: 'groupInvitations',
    icon: Bell,
    title: 'groupInvitations',
    description: 'groupInvitationsDesc',
  },
];

export default function NotificationModal({ 
  isOpen, 
  onClose, 
  currentSettings, 
  onSave,
  isLoading: externalIsLoading
}: NotificationModalProps) {
  const t = useTranslations('settings');
  const { handleApiError } = useNotification();
  const [internalIsLoading, setInternalIsLoading] = useState(false);
  const isLoading = externalIsLoading || internalIsLoading;
  const [settings, setSettings] = useState(currentSettings);


  const handleToggle = (key: keyof typeof settings) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
        
    const hasChanges = Object.keys(settings).some(
      key => settings[key as keyof typeof settings] !== currentSettings[key as keyof typeof settings]
    );

    if (!hasChanges) {
      onClose();
      return;
    }

    setInternalIsLoading(true);
    
    try {
      await onSave(settings);
      onClose();
    } catch (error) {
      console.error('Notification settings update error:', error);
      handleApiError(error as Error);
    } finally {
      setInternalIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  useModalScrollLock(isOpen);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 backdrop-blur-lg z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <Card className="bg-surface shadow-2xl max-w-lg w-full animate-in slide-in-from-bottom-4">
        <CardBody className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-accent-400 to-accent-600 rounded-xl">
                <Bell className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-primary">{t('notificationSettings')}</h2>
                <p className="text-text-muted text-sm">{t('controlYourNotifications')}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              onClick={onClose}
              type="button"
            >
              <X className="w-5 h-5" />
            </Button>  
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" onKeyDown={handleKeyDown}>
            <div className="space-y-3">
              {notificationTypes.map((type) => {
                const Icon = type.icon;
                const isEnabled = settings[type.id as keyof typeof settings];
                
                return (
                  <div
                    key={type.id}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                      isEnabled
                        ? 'border-accent bg-accent/10'
                        : 'border-border bg-white/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          isEnabled ? 'bg-accent/20' : 'bg-gray-100'
                        }`}>
                          <Icon className={`w-4 h-4 ${
                            isEnabled ? 'text-accent' : 'text-text-muted'
                          }`} />
                        </div>
                        <div>
                          <h3 className="font-medium text-text-primary">{t(type.title)}</h3>
                          <p className="text-text-muted text-sm">{t(type.description)}</p>
                        </div>
                      </div>
                      <Toggle isEnabled={isEnabled} onClick={() => handleToggle(type.id as keyof typeof settings)}/>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="ghost"
                onClick={onClose}
                type="button"
                disabled={isLoading}
                loading={isLoading}
                className="flex-1"
              >
                {t('cancel')}
              </Button>
              <Button
                variant="accent"
                type="submit"
                disabled={isLoading}
                loading={isLoading}
                className="flex-1"
              >
                {isLoading ? t('saving') : t('save')}
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
