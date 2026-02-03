'use client';

import { useTranslations } from 'next-intl';
import { AlertTriangle, X } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useStorageMonitor } from '../../hooks/useStorageMonitor';

interface StorageWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function StorageWarningModal({ isOpen, onClose }: StorageWarningModalProps) {
  const t = useTranslations('StorageWarning');
  const { storageInfo, formatBytes } = useStorageMonitor();

  if (!isOpen) return null;

  const percentageUsed = Math.round(storageInfo.percentageUsed * 100);
  const percentageRemaining = Math.round((1 - storageInfo.percentageUsed) * 100);

  return (
    <Modal
      onClose={onClose}
      title={t('title') || 'אזהרת אחסון'}
      iconHeader={<AlertTriangle className="w-5 h-5 text-warning" />}
      subtitle={t('subtitle') || 'נשאר מעט מקום ב-localStorage'}
      size="md"
    >
      <div className="p-6 space-y-4" dir="rtl">
        <div className="bg-warning-50 border border-warning-200 rounded-lg p-4">
          <p className="text-sm text-text-primary mb-2">
            {t('description') || 'נשאר פחות מ-20% מקום פנוי ב-localStorage. כדי להמשיך להשתמש באפליקציה, נא למחוק רשימות ישנות או להתחבר כדי לסנכרן לענן.'}
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-text-muted">{t('used') || 'משומש'}:</span>
            <span className="text-text-primary font-medium">
              {formatBytes(storageInfo.used)} ({percentageUsed}%)
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-text-muted">{t('available') || 'פנוי'}:</span>
            <span className="text-text-primary font-medium">
              {formatBytes(storageInfo.available)} ({percentageRemaining}%)
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-text-muted">{t('total') || 'סה"כ'}:</span>
            <span className="text-text-primary font-medium">
              {formatBytes(storageInfo.total)}
            </span>
          </div>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-2.5 mt-4">
          <div
            className={`h-2.5 rounded-full transition-all ${
              percentageUsed >= 80 ? 'bg-error' : 
              percentageUsed >= 60 ? 'bg-warning' : 
              'bg-primary'
            }`}
            style={{ width: `${percentageUsed}%` }}
          />
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            variant="primary"
            onClick={onClose}
            fullWidth
          >
            {t('understood') || 'הבנתי'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
