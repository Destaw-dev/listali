'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import { X, Calendar, User, Tag, AlertTriangle } from 'lucide-react';
import { useGroup } from '@/hooks/useGroups';
import { useModalScrollLock } from '@/hooks/useModalScrollLock';
import { Button, Input, TextArea } from '../common';

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

export default function CreateShoppingListModal({
  isOpen,
  onClose,
  onSubmit,
  groupId,
  groupName
}: CreateShoppingListModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const t = useTranslations('CreateShoppingListModal');

  const { data: group } = useGroup(groupId);

  const createListSchema = z.object({
    name: z.string().min(2, t('nameMinLength')).max(100, t('nameMaxLength')),
    description: z.string().max(500, t('descriptionMaxLength')).optional(),
    priority: z.enum(['low', 'medium', 'high']).default('medium').optional(),
    dueDate: z.string().optional(),
    tags: z.array(z.string()).optional(),
    // assignedTo: z.string().optional(),
  });



  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch
  } = useForm<CreateListFormData>({
    resolver: zodResolver(createListSchema),
    defaultValues: {
      name: '',
      description: '',
      priority: 'medium',
      dueDate: '',
      // assignedTo: '',
    }
  });

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleFormSubmit = async (data: CreateListFormData) => {
    setIsSubmitting(true);
    try {
      await onSubmit({
        ...data,
        tags: tags.length > 0 ? tags : undefined,
      });
      reset();
      setTags([]);
      setTagInput('');
    } catch (error) {
      // Error handled by parent
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      reset();
      setTags([]);
      setTagInput('');
      onClose();
    }
  };

  // Prevent body scroll when modal is open
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
              <h2 className="text-xl font-bold text-primary">
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
          {/* Name */}
          <div>
            <Input
              {...register('name')}
              type="text"
              placeholder={t('listNamePlaceholder')}
              error={errors.name?.message}
              label={`${t('listName')} *`}
            />
          </div>

          {/* Description */}
          <div>
            <TextArea
              {...register('description')}
              rows={3}
              placeholder={t('descriptionPlaceholder')}
              error={errors.description?.message}
              label={t('description')}
            />
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              {t('priority')}
            </label>
            <select
              {...register('priority')}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="low">{t('priorityLow')}</option>
              <option value="medium">{t('priorityMedium')}</option>
              <option value="high">{t('priorityHigh')}</option>
            </select>
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              {t('dueDate')}
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary w-4 h-4" />
              <input
                {...register('dueDate')}
                type="date"
                className="w-full pl-10 pr-3 py-2 border border-border rounded-lg bg-background text-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              {t('tags')}
            </label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary w-4 h-4" />
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={t('addTagPlaceholder')}
                    className="w-full pl-10 pr-20 py-2 border border-border rounded-lg bg-background text-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                >
                  {t('add')}
                </button>
              </div>
              
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-lg text-sm"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="text-primary hover:text-primary/70"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 text-text-muted hover:text-text-primary transition-colors rounded-lg hover:bg-white/50 border border-border/30 disabled:opacity-50"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? t('creating') : t('createList')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 