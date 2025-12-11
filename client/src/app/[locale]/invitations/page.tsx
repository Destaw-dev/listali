'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, useParams } from 'next/navigation';
import { Users, Check, X, Clock, UserPlus } from 'lucide-react';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useInvitations, useAcceptInvitation, useDeclineInvitation } from '@/hooks/useInvitations';
import { useAuthRedirect } from '@/hooks/useAuthRedirect';
import { ArrowIcon } from '@/components/common/Arrow';

interface Invitation {
  _id: string;
  group: {
    _id: string;
    name: string;
    description?: string;
    avatar?: string;
    membersCount: number;
  };
  invitedBy: {
    _id: string;
    username: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  role: 'admin' | 'member';
  invitedAt: string;
  status: 'pending' | 'accepted' | 'declined';
}

export default function InvitationsPage() {
  const [processingInvitation, setProcessingInvitation] = useState<string | null>(null);
  const router = useRouter();
  const params = useParams();
  const t = useTranslations('Invitations');
  const locale = params?.locale as string || 'he';

  // React Query hooks
  const { data: invitations = [], isLoading, error } = useInvitations();
  const acceptInvitationMutation = useAcceptInvitation();
  const declineInvitationMutation = useDeclineInvitation();

  // Use custom hook for auth redirect
  const { isAuthenticated, isInitialized } = useAuthRedirect({
    redirectTo: `/${locale}/welcome`,
    requireAuth: true
  });

  const handleAcceptInvitation = async (invitationId: string) => {
    try {
      setProcessingInvitation(invitationId);
      await acceptInvitationMutation.mutateAsync(invitationId);
    } catch (error) {
      // Error is handled by the mutation
    } finally {
      setProcessingInvitation(null);
    }
  };

  const handleDeclineInvitation = async (invitationId: string) => {
    try {
      setProcessingInvitation(invitationId);
      await declineInvitationMutation.mutateAsync(invitationId);
    } catch (error) {
      // Error is handled by the mutation
    } finally {
      setProcessingInvitation(null);
    }
  };

  const navigateBack = () => {
    router.push(`/${locale}/groups`);
  };

  // Show loading while auth is initializing
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // Show loading while fetching data
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{t('errorLoadingInvitations')}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-white rounded-lg"
          >
            {t('tryAgain')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-surface border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={navigateBack}
                className="p-2 text-secondary hover:text-primary transition-colors"
              >
                <ArrowIcon className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-primary">{t('invitations')}</h1>
                <p className="text-secondary text-sm">{t('manageInvitations')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6">
        {invitations.length === 0 ? (
          <div className="text-center py-12">
            <UserPlus className="w-16 h-16 text-muted mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-primary mb-2">{t('noInvitations')}</h3>
            <p className="text-secondary">{t('noNewInvitations')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {invitations.map((invitation: any) => (
              <div
                key={invitation._id}
                className="bg-surface border border-border rounded-lg p-4"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-primary mb-1">
                      {t('invitationToGroup')}: {invitation.group?.name}
                    </h3>
                    <p className="text-secondary text-sm">
                      {t('invitedBy')}: {invitation.invitedBy?.firstName} {invitation.invitedBy?.lastName}
                    </p>
                    <p className="text-secondary text-sm">
                      {t('role')}: {invitation.role === 'admin' ? t('admin') : t('member')}
                    </p>
                    <p className="text-secondary text-sm">
                      {t('date')}: {new Date(invitation.invitedAt).toLocaleDateString('he-IL')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {processingInvitation === invitation._id ? (
                      <div className="flex items-center gap-2">
                        <LoadingSpinner size="sm" />
                        <span className="text-sm text-secondary">{t('processing')}</span>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => handleAcceptInvitation(invitation.code)}
                          disabled={acceptInvitationMutation.isPending || declineInvitationMutation.isPending}
                          className="flex items-center gap-1 px-3 py-1 bg-success text-white rounded-lg hover:bg-success/90 transition-colors disabled:opacity-50"
                        >
                          <Check className="w-4 h-4" />
                          {t('accept')}
                        </button>
                        <button
                          onClick={() => handleDeclineInvitation(invitation._id)}
                          disabled={acceptInvitationMutation.isPending || declineInvitationMutation.isPending}
                          className="flex items-center gap-1 px-3 py-1 bg-error text-white rounded-lg hover:bg-error/90 transition-colors disabled:opacity-50"
                        >
                          <X className="w-4 h-4" />
                          {t('decline')}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 