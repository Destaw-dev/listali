'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Bell, Smartphone, Mail } from 'lucide-react';
import { Button, Modal } from '../common';
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

  useModalScrollLock(isOpen);

  if (!isOpen) return null;

  return (
    <Modal
      title={t("notificationSettings")}
      onClose={onClose}
      iconHeader={<div className=" p-2 bg-accent-500 rounded-full">
        <Bell className="w-5 h-5 text-text-primary" />
      </div>}
      subtitle={t("controlYourNotifications")}
      size="md"
    >
       <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-3">
              {notificationTypes.map((type) => {
                const Icon = type.icon;
                const isEnabled = settings[type.id as keyof typeof settings];
                
                return (
                  <div
                    key={type.id}
                    className={`p-4 rounded-xl border-1 transition-all duration-200 ${
                      isEnabled
                        ? 'border-border '
                        : 'border-border bg-background-hover'
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
                fullWidth
              >
                {t('cancel')}
              </Button>
              <Button
                variant="accent"
                type="submit"
                disabled={isLoading}
                loading={isLoading}
                fullWidth
              >
                {isLoading ? t('saving') : t('save')}
              </Button>
            </div>
          </form>
      
    </Modal>
  )
}
