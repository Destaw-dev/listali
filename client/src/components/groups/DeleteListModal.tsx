'use client';
import React from 'react';
import { Button } from '../common';
import { useTranslations } from 'next-intl';
import { useModalScrollLock } from '@/hooks/useModalScrollLock';

export function DeleteListModal({ isOpen, onClose, onDelete, isDeleting }: { isOpen: boolean, onClose: () => void, onDelete: () => void, isDeleting: boolean }) {
  const t = useTranslations('DeleteListModal');
  useModalScrollLock(isOpen);
  const handleDelete = () => {
      onDelete();
  };
  return (
    <div className="fixed inset-0 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-surface shadow-2xl rounded-xl p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-4">
      <h1>{t('deleteList')}</h1>
      <p>{t('deleteListDescription')}</p>
      <div className="flex items-center gap-2">

      <Button variant='outline' onClick={() => onClose()}>{t('cancel')}</Button>
        <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>{t('delete')}</Button>
        </div>
      </div>
    </div>
  );
}