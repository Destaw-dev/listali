'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { X, UserPlus, Mail, Bell, Copy, Check } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';


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
  const [inviteResult, setInviteResult] = useState<{
    type: 'in-app' | 'email';
    email: string;
    message: string;
  } | null>(null);
  const t = useTranslations('InviteModal');

  const inviteSchema = z.object({
    email: z.string().email(t('emailInvalid')),
    role: z.enum(['member', 'admin']),
  });
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      email: '',
      role: 'member',
    },
  });

  const selectedRole = watch('role');

  const onSubmit = async (data: InviteFormData) => {
    try {
      setIsLoading(true);
      setInviteResult(null);
      await onInvite(data);
    } catch (error: any) {
      console.error('Error inviting user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    reset();
    setInviteResult(null);
    onClose();
  };

  const handleCopyInviteCode = (code: string) => {
    navigator.clipboard.writeText(code);
    // Show success toast
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-white/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white/90 shadow-2xl rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-accent-400 to-accent-600 rounded-xl">
              <UserPlus className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-primary">{t('inviteFriends')}</h2>
              <p className="text-text-muted text-sm">{t('inviteFriendsToGroup', { groupName })}</p>
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
            <label htmlFor="email" className="block text-sm font-medium text-primary mb-2">
              {t('emailAddress')} *
            </label>
            <input
              {...register('email')}
              type="email"
              id="email"
              placeholder={t('enterEmailAddress')}
              className="w-full px-4 py-3 border border-border rounded-lg bg-surface text-primary placeholder:text-secondary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              dir="ltr"
              autoComplete="email"
            />
            {errors.email && (
              <p className="text-error text-sm mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="role" className="block text-sm font-medium text-primary mb-2">
              {t('role')}
            </label>
            <select
              {...register('role')}
              id="role"
              className="w-full px-4 py-3 border border-border rounded-lg bg-surface text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
            >
              <option value="member">{t('member')}</option>
              <option value="admin">{t('admin')}</option>
            </select>
          </div>

          {/* Role Info */}
          <div className="bg-primary/5 border border-primary/10 rounded-lg p-4">
            <h4 className="font-medium text-primary mb-2">{t('groupRoles')}:</h4>
            <div className="space-y-2 text-sm text-secondary">
              <div className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span><strong>{t('member')}:</strong> {t('memberDescription')}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span><strong>{t('admin')}:</strong> {t('adminDescription')}</span>
              </div>
            </div>
          </div>

          {/* Invite Method Info */}
          <div className="bg-primary/5 border border-primary/10 rounded-lg p-4">
            <h4 className="font-medium text-primary mb-2">{t('howInviteWillBeSent')}</h4>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="bg-primary/10 p-2 rounded-lg">
                  <Bell className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-primary">{t('registeredUser')}</p>
                  <p className="text-secondary">{t('inviteWillBeSentAsNotification')}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-primary/10 p-2 rounded-lg">
                  <Mail className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-primary">{t('unregisteredUser')}</p>
                  <p className="text-secondary">{t('inviteWillBeSentAsEmail')}</p>
                </div>
              </div>
            </div>
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
              className="flex-1 px-4 py-2 bg-accent text-white hover:bg-accent/90 transition-colors rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? t('sendingInvite') : t('sendInvite')}
            </button>
          </div>
        </form>

        {/* Success Result */}
        {inviteResult && (
          <div className="p-6 border-t border-border">
            <div className="text-center">
              <div className="bg-success/10 p-3 rounded-lg mb-4">
                <Check className="w-6 h-6 text-success mx-auto" />
              </div>
              <h3 className="text-lg font-semibold text-primary mb-2">
                {inviteResult.type === 'in-app' ? t('inviteSentSuccessfully') : t('inviteEmailSent')}
              </h3>
              <p className="text-secondary mb-4">
                {inviteResult.type === 'in-app' 
                  ? t('inviteSentToRegisteredUser')
                  : t('inviteEmailSentToUnregisteredUser')
                }
              </p>
              <button
                onClick={handleClose}
                className="btn-primary"
              >
                {t('close')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 