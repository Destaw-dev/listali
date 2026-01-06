'use client';
import React from 'react';
import { Button, Modal } from '../common';
import { useTranslations } from 'next-intl';
import { useModalScrollLock } from '../../hooks/useModalScrollLock';
import { Trash } from 'lucide-react';

export function DeleteListModal({ isOpen, onClose, onDelete, isDeleting, listName }: { isOpen: boolean, onClose: () => void, onDelete: () => void, isDeleting: boolean, listName: string }) {
  const t = useTranslations('DeleteListModal');
  useModalScrollLock(isOpen);
  const handleDelete = () => {
      onDelete();
  };
  return (
    <Modal title={t('deleteList')} onClose={onClose} iconHeader={<div className="p-2 bg-gradient-to-br from-error-400 to-error-600 rounded-xl">
      <Trash className="w-5 h-5 text-text-primary" />
    </div>} subtitle={listName} size="md" isLoading={isDeleting}>
      <p>{t('deleteListDescription')}</p>
      <div className="flex items-center gap-2 mt-5">
        <Button variant='outline' onClick={() => onClose()}>{t('cancel')}</Button>
        <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>{t('delete')}</Button>
      </div>
    </Modal>
  );
}