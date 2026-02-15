import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { AlertTriangle, Info, AlertCircle } from 'lucide-react';
import { iconSizes } from '../../lib/iconSizes';
import { useModalScrollLock } from '@/hooks/useModalScrollLock';

export interface ConfirmDialogProps {
  /**
   * Whether the dialog is open
   */
  isOpen: boolean;

  /**
   * Callback when dialog is closed (via backdrop, X button, or Cancel)
   */
  onClose: () => void;

  /**
   * Callback when user confirms the action
   */
  onConfirm: () => void;

  /**
   * Dialog title
   */
  title: string;

  /**
   * Dialog message/description
   */
  message: string;

  /**
   * Text for confirm button
   * @default 'Confirm'
   */
  confirmText?: string;

  /**
   * Text for cancel button
   * @default 'Cancel'
   */
  cancelText?: string;

  /**
   * Visual variant affects icon and confirm button styling
   * @default 'danger'
   */
  variant?: 'danger' | 'warning' | 'info';

  /**
   * Whether the confirm action is currently loading
   * @default false
   */
  isLoading?: boolean;
}

/**
 * ConfirmDialog component for confirming destructive or important actions
 *
 * @example
 * ```tsx
 * const [showDialog, setShowDialog] = useState(false);
 * const deleteMutation = useDeleteItem();
 *
 * <ConfirmDialog
 *   isOpen={showDialog}
 *   onClose={() => setShowDialog(false)}
 *   onConfirm={async () => {
 *     await deleteMutation.mutateAsync(itemId);
 *     setShowDialog(false);
 *   }}
 *   title="Delete Item"
 *   message="Are you sure you want to delete this item? This action cannot be undone."
 *   variant="danger"
 *   isLoading={deleteMutation.isPending}
 * />
 * ```
 */
export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  isLoading = false,
}: ConfirmDialogProps) {
  const variantConfig = {
    danger: {
      icon: AlertTriangle,
      iconBg: 'bg-[var(--color-status-error-soft)]',
      iconColor: 'text-error',
      buttonVariant: 'destructive' as const,
    },
    warning: {
      icon: AlertCircle,
      iconBg: 'bg-[var(--color-status-warning-soft)]',
      iconColor: 'text-warning',
      buttonVariant: 'warning' as const,
    },
    info: {
      icon: Info,
      iconBg: 'bg-[var(--color-icon-primary-bg)]',
      iconColor: 'text-text-primary',
      buttonVariant: 'primary' as const,
    },
  };

  const config = variantConfig[variant];
  const Icon = config.icon;

  const handleConfirm = () => {
    onConfirm();
  };

    useModalScrollLock(isOpen);
  
    if (!isOpen) return null;

  return (
    <Modal onClose={onClose} size="sm" title={title} isLoading={isLoading} iconHeader={<Icon className={`${iconSizes.lg} ${config.iconColor}`} />}>
      <div className="space-y-4">
        {/* Icon and Title */}
        <div className="flex items-start gap-4">
          <div className="flex-1 pt-1">
            <p className="text-sm text-text-muted leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end pt-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            size="md"
          >
            {cancelText}
          </Button>
          <Button
            variant={config.buttonVariant}
            onClick={handleConfirm}
            loading={isLoading}
            disabled={isLoading}
            size="md"
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
