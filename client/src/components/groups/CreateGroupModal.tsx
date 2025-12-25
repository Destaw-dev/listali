'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { X, Users } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useModalScrollLock } from '@/hooks/useModalScrollLock';

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
  
  const createGroupSchema = z.object({
    name: z.string().min(2, t('nameMinLength')).max(50, t('nameMaxLength')),
    description: z.string().max(200, t('descriptionMaxLength')).optional(),
  });


  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateGroupFormData>({
    resolver: zodResolver(createGroupSchema),
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

  // Prevent body scroll when modal is open
  useModalScrollLock(isOpen);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && handleClose()}>
      <div className="bg-card shadow-2xl rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-4">
        {/* Header */}
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
          <button
            onClick={handleClose}
            className="p-2 text-text-muted hover:text-text-primary transition-colors rounded-lg hover:bg-white/50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-primary mb-2">
              {t('groupName')} *
            </label>
            <input
              {...register('name')}
              type="text"
              id="name"
              placeholder={t('groupNamePlaceholder')}
              className="w-full px-4 py-3 border border-border rounded-lg bg-surface text-primary placeholder:text-secondary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              dir="rtl"
            />
            {errors.name && (
              <p className="text-error text-sm mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-primary mb-2">
              {t('description')} ({t('optional')})
            </label>
            <textarea
              {...register('description')}
              id="description"
              rows={3}
              placeholder={t('descriptionPlaceholder')}
              className="w-full px-4 py-3 border border-border rounded-lg bg-surface text-primary placeholder:text-secondary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors resize-none"
              dir="rtl"
            />
            {errors.description && (
              <p className="text-error text-sm mt-1">{errors.description.message}</p>
            )}
          </div>

          {/* Info */}
          <div className="bg-primary/5 border border-primary/10 rounded-lg p-4">
            <h4 className="font-medium text-primary mb-2">{t('whatHappensAfter')}</h4>
            <ul className="text-sm text-secondary space-y-1">
              <li>• {t('youWillGetInviteCode')}</li>
              <li>• {t('youCanCreateLists')}</li>
              <li>• {t('friendsCanJoinWithCode')}</li>
              <li>• {t('youCanManageGroup')}</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 text-text-muted hover:text-text-primary transition-colors rounded-lg hover:bg-white/50 border border-border/30"
              disabled={isLoading}
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-primary text-white hover:bg-primary/90 transition-colors rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? t('creatingGroup') : t('createGroup')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 