'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Bell, Smartphone, Mail } from 'lucide-react';
import { Button, Modal } from '../common';
import { useNotification } from '../../contexts/NotificationContext';
import { Toggle } from '../common/Toggle';
import { useModalScrollLock } from '../../hooks/useModalScrollLock';
import { usePushNotifications } from '../../hooks/usePushNotifications';

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
  const { subscribe, isSubscribed, isSupported, checkSubscription } = usePushNotifications();
  const [internalIsLoading, setInternalIsLoading] = useState(false);
  const [isRegisteringPush, setIsRegisteringPush] = useState(false);
  const isLoading = externalIsLoading || internalIsLoading;
  const [settings, setSettings] = useState(currentSettings);

  console.log("VAPID exists?", !!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY);
  console.log("VAPID key length:", process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.length);
  console.log("VAPID key:", process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY);


  const pushOnButNotRegistered = settings.pushNotifications && !isSubscribed && isSupported;


  const handleToggle = async (key: keyof typeof settings) => {
    const newValue = !settings[key];
    
    if (key === 'pushNotifications' && newValue && !isSubscribed) {
      if (!isSupported) {
        handleApiError(new Error('Push notifications are not supported in this browser'));
        return;
      }
      
      try {
        await subscribe();
        setSettings(prev => ({
          ...prev,
          [key]: true
        }));
      } catch (error) {
        handleApiError(error as Error);
        return;
      }
    } else {
      setSettings(prev => ({
        ...prev,
        [key]: newValue
      }));
    }
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
      // if (settings.pushNotifications && !currentSettings.pushNotifications && !isSubscribed) {
      //   if (isSupported) {
      //     try {
      //       await subscribe();
      //     } catch (error) {
      //       setSettings(prev => ({
      //         ...prev,
      //         pushNotifications: false
      //       }));
      //       throw error;
      //     }
      //   } else {
      //     setSettings(prev => ({
      //       ...prev,
      //       pushNotifications: false
      //     }));
      //     handleApiError(new Error('Push notifications are not supported in this browser'));
      //     return;
      //   }
      // }
      
      if (!settings.pushNotifications && currentSettings.pushNotifications && isSubscribed) {
        // ה-unsubscribe יעשה אוטומטית דרך ה-hook
      }
      
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
      isLoading={isLoading}
    >
       <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-3">
              {notificationTypes.map((type) => {
                const Icon = type.icon;
                const isEnabled = settings[type.id as keyof typeof settings];
                const isPushType = type.id === 'pushNotifications';
                
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
                    {/* כשהתראות דחיפה מופעלות אבל אין subscription - כפתור רישום מכשיר */}
                    {isPushType && pushOnButNotRegistered && (
                      <div className="mt-3 pt-3 border-t border-border">
                        <p className="text-text-muted text-sm mb-2">{t('registerDeviceForPushDesc')}</p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={isRegisteringPush}
                          onClick={async () => {
                            setIsRegisteringPush(true);
                            try {
                              await subscribe();
                              await checkSubscription();
                            } catch (e) {
                              handleApiError(e as Error);
                            } finally {
                              setIsRegisteringPush(false);
                            }
                          }}
                        >
                          {isRegisteringPush ? t('saving') : t('registerDeviceForPush')}
                        </Button>
                      </div>
                    )}
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
                fullWidth
              >
                {isLoading ? t('saving') : t('save')}
              </Button>
            </div>
          </form>
      
    </Modal>
  )
}
