'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { X, Users, Group } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useModalScrollLock } from '@/hooks/useModalScrollLock';
import { Button, Input, TextArea } from '../common';
import { createGroupSchema } from '@/lib/schemas';

type CreateGroupFormData = {
  name: string;
  description?: string;
};

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateGroup: (data: CreateGroupFormData) => Promise<void>;
}

export function CreateGroupModal({ isOpen, onClose, onCreateGroup }: CreateGroupModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const t = useTranslations('CreateGroupModal');
  
  const groupSchema = createGroupSchema(t);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateGroupFormData>({
    resolver: zodResolver(groupSchema),
  });

  const onSubmit = async (data: CreateGroupFormData) => {
    try {
      setIsLoading(true);
      await onCreateGroup(data);
      reset();
    } catch (error) {
      console.error('Error creating group:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  useModalScrollLock(isOpen);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && handleClose()}>
      <div className="bg-card shadow-2xl rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-4">
        <div className="flex items-center justify-between p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-primary">{t('createNewGroup')}</h2>
              <p className="text-text-muted text-sm">{t('createNewGroupDescription')}</p>
            </div>
          </div>
          <Button variant='ghost' size='sm' onClick={handleClose} rounded={true}><X className="w-4 h-4" /></Button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <Input
            label={t('groupName') + ' *'}
            error={errors.name?.message}
            {...register('name')}
            type="text"
            id="name"
            placeholder={t('groupNamePlaceholder')}
            icon={<Group className="w-5 h-5 text-muted" />}
          />

          <TextArea
            label={t('description') + ' (' + t('optional') + ')'}
            error={errors.description?.message}
            {...register('description')}
            rows={3}
            placeholder={t('descriptionPlaceholder')}
            fullWidth
          />

          <div className="bg-primary/5 border border-primary/10 rounded-lg p-4">
            <h4 className="font-medium text-primary mb-2">{t('whatHappensAfter')}</h4>
            <ul className="text-sm text-secondary space-y-1">
              <li>• {t('youWillGetInviteCode')}</li>
              <li>• {t('youCanCreateLists')}</li>
              <li>• {t('friendsCanJoinWithCode')}</li>
              <li>• {t('youCanManageGroup')}</li>
            </ul>
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant='ghost' type="button" fullWidth onClick={handleClose} disabled={isLoading}>{t('cancel')}</Button>
            <Button variant='primary' type="submit" fullWidth disabled={isLoading} loading={isLoading}>{isLoading ? t('creatingGroup') : t('createGroup')}</Button>
          </div>
        </form>
      </div>
    </div>
  );
} 