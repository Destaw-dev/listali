'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { X, UserPlus, Copy, Check } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useModalScrollLock } from '@/hooks/useModalScrollLock';


type JoinGroupFormData = {
  inviteCode: string;
};

interface JoinGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoinGroup: (inviteCode: string) => Promise<void>;
}

export function JoinGroupModal({ isOpen, onClose, onJoinGroup }: JoinGroupModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const t = useTranslations('JoinGroupModal');
  
  const joinGroupSchema = z.object({
    inviteCode: z.string().min(6, t('inviteCodeMinLength')).max(10, t('inviteCodeMaxLength')),
  });
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<JoinGroupFormData>({
    resolver: zodResolver(joinGroupSchema),
  });

  const onSubmit = async (data: JoinGroupFormData) => {
    try {
      setIsLoading(true);
      await onJoinGroup(data.inviteCode);
      reset();
    } catch (error) {
      console.error('Error joining group:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleCopyInviteCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
            <div className="p-2 bg-gradient-to-br from-secondary-400 to-secondary-600 rounded-xl">
              <UserPlus className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-primary">{t('joinGroup')}</h2>
              <p className="text-text-muted text-sm">{t('joinGroupDescription')}</p>
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
            <label htmlFor="inviteCode" className="block text-sm font-medium text-primary mb-2">
              {t('inviteCode')} *
            </label>
            <input
              {...register('inviteCode')}
              type="text"
              id="inviteCode"
              placeholder={t('enterInviteCode')}
              className="w-full px-4 py-3 border border-border rounded-lg bg-surface text-primary placeholder:text-secondary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors text-center text-lg font-mono tracking-wider"
              dir="ltr"
              autoComplete="off"
            />
            {errors.inviteCode && (
              <p className="text-error text-sm mt-1">{errors.inviteCode.message}</p>
            )}
          </div>

          {/* Info */}
          <div className="bg-primary/5 border border-primary/10 rounded-lg p-4">
            <h4 className="font-medium text-primary mb-2">{t('howToJoinGroup')}</h4>
            <ul className="text-sm text-secondary space-y-1">
              <li>• {t('getInviteCodeFromManager')}</li>
              <li>• {t('codeCanComeFromEmail')}</li>
              <li>• {t('enterCodeInFieldAbove')}</li>
              <li>• {t('clickJoinGroup')}</li>
              <li>• {t('youWillSeeGroupInList')}</li>
            </ul>
          </div>

          {/* Example Invite Code */}
          <div className="bg-surface border border-border rounded-lg p-4">
            <h4 className="font-medium text-primary mb-2">{t('exampleInviteCode')}:</h4>
            <div className="flex items-center justify-between bg-card border border-border rounded-lg p-3">
              <span className="font-mono text-lg tracking-wider text-primary">ABC12345</span>
              <button
                type="button"
                onClick={() => handleCopyInviteCode('ABC12345')}
                className="text-secondary hover:text-primary transition-colors"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-secondary mt-2">{t('clickIconToCopy')}</p>
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
              className="flex-1 px-4 py-2 bg-secondary text-white hover:bg-secondary/90 transition-colors rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? t('joiningGroup') : t('joinGroup')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 