'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { X, Calendar } from 'lucide-react';
import { useModalScrollLock } from '../../hooks/useModalScrollLock';
import { Button, Dropdown, Input, TextArea } from '../common';
import { createListSchema } from '../../lib/schemas';

type CreateListFormData = {
  name: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high';
  dueDate?: string;
  tags?: string[];
};

interface CreateShoppingListModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateListFormData) => Promise<void>;
  groupId: string;
  groupName?: string;
}

export function CreateShoppingListModal({
  isOpen,
  onClose,
  onSubmit,
  groupName
}: CreateShoppingListModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const t = useTranslations('CreateShoppingListModal');
  const listSchema = createListSchema(t);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch
  } = useForm<CreateListFormData>({
    resolver: zodResolver(listSchema),
    defaultValues: {
      name: '',
      description: '',
      priority: 'medium',
      dueDate: '',
    }
  });



  const handleFormSubmit = async (data: CreateListFormData) => {
    setIsSubmitting(true);
    try {
      await onSubmit({
        ...data,
        tags: tags.length > 0 ? tags : undefined,
      });
      reset();
      setTags([]);
    } catch {
      // Error handled by parent
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      reset();
      setTags([]);
      onClose();
    }
  };

  useModalScrollLock(isOpen);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && handleClose()}>
      <div className="bg-surface shadow-2xl rounded-xl p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl">
              <Calendar className="w-5 h-5 " />
            </div>
            <div>
              <h2 className="text-xl font-bold text-text-primary">
                {t('newShoppingList')}
              </h2>
              <p className="text-text-muted text-sm">{t('willBeCreatedForGroup')}: {groupName}</p>
            </div>
          </div>
          <Button variant="ghost" size="md" icon={<X className="w-5 h-5" />} onClick={handleClose} disabled={isSubmitting} rounded={true}/>
        </div>

        {groupName && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              {t('willBeCreatedForGroup')}: <strong>{groupName}</strong>
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div>
            <Input
              {...register('name')}
              type="text"
              placeholder={t('listNamePlaceholder')}
              error={errors.name?.message}
              label={`${t('listName')} *`}
            />
          </div>

          <div>
            <TextArea
              {...register('description')}
              rows={3}
              placeholder={t('descriptionPlaceholder')}
              error={errors.description?.message}
              label={t('description')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              {t('priority')}
            </label>
            <Dropdown
              placeholder={t('priority')}
              variant="default"
              size="md"
              fullWidth
              error={errors.priority?.message}
              options={[
                { value: 'low', label: t('priorityLow') },
                { value: 'medium', label: t('priorityMedium') },
                { value: 'high', label: t('priorityHigh') },
              ]}
              value={watch('priority')}
              onSelect={(value) => register('priority').onChange({ target: { value: value as 'low' | 'medium' | 'high' } })}
            />
          </div>

          <div>
            <Input
              {...register('dueDate')}
              type="date"
              error={errors.dueDate?.message}
              label={t('dueDate')}
              variant="outlined"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" size="lg" fullWidth onClick={handleClose} disabled={isSubmitting}>{t('cancel')}</Button>
            <Button type="submit" variant="primary" size="lg" disabled={isSubmitting} fullWidth>{isSubmitting ? t('creating') : t('createList')}</Button>

          </div>
        </form>
      </div>
    </div>
  );
} 