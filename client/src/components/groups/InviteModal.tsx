'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { UserPlus, Mail, Bell } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Dropdown, Input, Modal } from '../common';
import { useModalScrollLock } from '../../hooks/useModalScrollLock';
import { createInviteSchema } from '../../lib/schemas';

type InviteFormData = {
  email: string;
  role: 'member' | 'admin';
};
interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInvite: (data: InviteFormData) => Promise<void>;
  groupName: string;
}

export function InviteModal({ isOpen, onClose, onInvite, groupName }: InviteModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const t = useTranslations('InviteModal');

  const inviteSchema = createInviteSchema(t);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      email: '',
      role: 'member',
    },
  });

  const selectedRole = watch('role');

  const onSubmit = async (data: InviteFormData) => {
      setIsLoading(true);
      await onInvite(data);
      setIsLoading(false);
  
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  useModalScrollLock(isOpen);


  if (!isOpen) return null;

  return (
    <Modal title={t('inviteFriends')} onClose={handleClose} iconHeader={ <div className="p-2 bg-gradient-to-br from-accent-400 to-accent-600 rounded-xl">
      <UserPlus className="w-5 h-5 text-text-primary" />
    </div>} subtitle={t('inviteFriendsToGroup', { groupName })} size="md">
       <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
           <Input
              {...register('email')}
              type="email"
              id="email"
              placeholder={t('enterEmailAddress')}
              error={errors.email?.message}
              label={t('emailAddress') + ' *'}
              fullWidth
              icon={<Mail className="w-5 h-5 text-text-muted" />}
            />

          <div>
            <label htmlFor="role" className="block text-sm font-medium text-text-primary mb-2">
              {t('role')}
            </label>

            <Dropdown
              options={[
                { value: 'member', label: t('member') },
                { value: 'admin', label: t('admin') },
              ]}
              value={selectedRole}
              onSelect={(value) => setValue('role', value as 'member' | 'admin', { shouldValidate: true })}
              placeholder={t('role')}
              id="role"
            />
          </div>

          {/* Role Info */}
          <div className="bg-background-50 border border-primary-100 rounded-lg p-4">
            <h4 className="font-medium text-text-primary mb-2">{t('groupRoles')}:</h4>
            <div className="space-y-2 text-sm text-text-secondary">
              <div className="flex items-start gap-2">
                <span className="text-text-primary">•</span>
                <span><strong>{t('member')}:</strong> {t('memberDescription')}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-text-primary">•</span>
                <span><strong>{t('admin')}:</strong> {t('adminDescription')}</span>
              </div>
            </div>
          </div>

          {/* Invite Method Info */}
          <div className="bg-background-50 border border-primary-100 rounded-lg p-4">
            <h4 className="font-medium text-text-primary mb-2">{t('howInviteWillBeSent')}</h4>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="bg-background-100 p-2 rounded-lg">
                  <Bell className="w-4 h-4 text-text-primary" />
                </div>
                <div>
                  <p className="font-medium text-text-primary">{t('registeredUser')}</p>
                  <p className="text-text-secondary">{t('inviteWillBeSentAsNotification')}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-background-100 p-2 rounded-lg">
                  <Mail className="w-4 h-4 text-text-primary" />
                </div>
                <div>
                  <p className="font-medium text-text-primary">{t('unregisteredUser')}</p>
                  <p className="text-text-secondary">{t('inviteWillBeSentAsEmail')}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button variant='outline' size='lg' onClick={handleClose} disabled={isLoading} fullWidth>
              {t('cancel')}
            </Button>
            <Button type='submit' variant='accent' size='lg' loading={isLoading} disabled={isLoading} fullWidth>
              {isLoading ? t('sendingInvite') : t('sendInvite')}
            </Button>
          </div>
        </form>
    </Modal>
  )

} 