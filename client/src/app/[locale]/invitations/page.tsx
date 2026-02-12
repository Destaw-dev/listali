"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Check, X, UserPlus, Calendar } from "lucide-react";
import { LoadingSpinner, Button } from "../../../components/common";
import {
  useInvitations,
  useAcceptInvitation,
  useDeclineInvitation,
  useJoinRequests,
} from "../../../hooks/useInvitations";
import { useAuthRedirect } from "../../../hooks/useAuthRedirect";

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
  role: "admin" | "member";
  invitedAt: string;
  status: "pending" | "accepted" | "declined";
  code: string;
}

interface JoinRequest {
  _id: string;
  group: {
    _id: string;
    name: string;
    description?: string;
    avatar?: string;
    membersCount: number;
  };
  inviteCode: string;
  role: "admin" | "member";
  requestedAt: string;
  status: "pending" | "approved" | "rejected";
}

export default function InvitationsPage() {
  const [processingInvitation, setProcessingInvitation] = useState<
    string | null
  >(null);
  const t = useTranslations("Invitations");

  const { data: invitations = [], isLoading: invitationsLoading, error: invitationsError } = useInvitations();
  const { data: joinRequests = [], isLoading: joinRequestsLoading } = useJoinRequests();
  const acceptInvitationMutation = useAcceptInvitation();
  const declineInvitationMutation = useDeclineInvitation();

  const isLoading = invitationsLoading || joinRequestsLoading;
  const error = invitationsError;

  const { safeToShow } = useAuthRedirect({
    redirectTo: '/welcome',
    requireAuth: true,
  });

  const handleAcceptInvitation = async (invitationId: string) => {
    setProcessingInvitation(invitationId);
    await acceptInvitationMutation.mutateAsync(invitationId);
    setProcessingInvitation(null);
  };

  const handleDeclineInvitation = async (invitationId: string) => {
    setProcessingInvitation(invitationId);
    await declineInvitationMutation.mutateAsync(invitationId);
    setProcessingInvitation(null);
  };

  if (!safeToShow) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="text-center">
          <p className="text-error-500 mb-4">{t("errorLoadingInvitations")}</p>
          <Button
            onClick={() => window.location.reload()}
            variant="primary"
            size="lg"
          >
            {t("tryAgain")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-2xl font-bold text-text-primary">
                  {t("invitations")}
                </h1>
                <p className="text-secondary text-sm text-text-muted">
                  {t("manageInvitations")}
                </p>
              </div>
            </div>
          </div>
        </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {joinRequests.length > 0 && (
          <div className="bg-card rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-text-primary mb-4">
              {t("pendingJoinRequests")}
            </h2>
            <div className="space-y-4">
              {joinRequests.map((request: JoinRequest) => (
                <div
                  key={request._id}
                  className="group bg-surface border border-border rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-200"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-full bg-warning-100 flex items-center justify-center text-warning-600 font-bold shrink-0">
                        <UserPlus className="w-6 h-6" />
                      </div>

                      <div className="space-y-1">
                        <h3 className="font-bold text-lg text-text-primary leading-none">
                          {request.group?.name}
                        </h3>
                        <p className="text-text-muted text-sm">
                          {t("waitingForApproval")}
                        </p>

                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <span
                            className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${
                              request.role === "admin"
                                ? "bg-warning-100 text-warning-700 border border-warning-200"
                                : "bg-primary-100 text-primary-700 border border-primary-200"
                            }`}
                          >
                            {request.role === "admin"
                              ? t("admin")
                              : t("member")}
                          </span>

                          <span className="text-xs text-text-muted flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(request.requestedAt).toLocaleDateString(
                              "he-IL"
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-warning-100 text-warning-700 border border-warning-200">
                        {t("pendingApproval")}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-card rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-text-primary mb-4">
            {t("invitations")}
          </h2>
          {invitations.length === 0 ? (
            <div className="text-center py-12 ">
              <UserPlus className="w-16 h-16 mx-auto mb-4 text-text-muted" />
              <h3 className="text-xl font-semibold text-text-primary mb-2">
                {t("noInvitations")}
              </h3>
              <p className="text-secondary text-text-muted">{t("noNewInvitations")}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {invitations.map((invitation: Invitation) => (
              <div
                key={invitation._id}
                className="group bg-card border border-border rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-200"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-full bg-background/10 flex items-center justify-center text-text-primary font-bold shrink-0">
                      {invitation.group?.name?.charAt(0).toUpperCase()}
                    </div>

                    <div className="space-y-1">
                      <h3 className="font-bold text-lg text-text-primary leading-none">
                        {invitation.group?.name}
                      </h3>
                      <p className="text-text-muted text-sm">
                        {t("invitedBy")}:{" "}
                        <span className="font-medium text-text-primary">
                          {invitation.invitedBy?.firstName}{" "}
                          {invitation.invitedBy?.lastName}
                        </span>
                      </p>

                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <span
                          className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${
                            invitation.role === "admin"
                              ? "bg-warning-100 text-warning-700 border border-warning-200"
                              : "bg-primary-100 text-primary-700 border border-primary-200"
                          }`}
                        >
                          {invitation.role === "admin"
                            ? t("admin")
                            : t("member")}
                        </span>

                        <span className="text-xs text-text-muted flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(invitation.invitedAt).toLocaleDateString(
                            "he-IL"
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 sm:self-center">
                    {processingInvitation === invitation._id ? (
                      <div className="flex items-center gap-2 px-4 py-2">
                        <LoadingSpinner size="sm" />
                        <span className="text-sm font-medium animate-pulse">
                          {t("processing")}
                        </span>
                      </div>
                    ) : (
                      <>
                        <Button
                          variant="error"
                          size="sm"
                          onClick={() =>
                            handleDeclineInvitation(invitation._id)
                          }
                          disabled={
                            acceptInvitationMutation.isPending ||
                            declineInvitationMutation.isPending
                          }
                          icon={<X className="w-4 h-4" />}
                        >
                          {t("decline")}
                        </Button>

                        <Button
                          variant="success"
                          size="sm"
                          onClick={() =>
                            handleAcceptInvitation(invitation.code)
                          }
                          disabled={
                            acceptInvitationMutation.isPending ||
                            declineInvitationMutation.isPending
                          }
                          icon={<Check className="w-4 h-4" />}
                        >
                          {t("accept")}
                        </Button>
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
    </div>
  );
}
