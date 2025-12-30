"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { Check, X, UserPlus, Calendar } from "lucide-react";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import {
  useInvitations,
  useAcceptInvitation,
  useDeclineInvitation,
} from "@/hooks/useInvitations";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { Button } from "@/components/common";

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

export default function InvitationsPage() {
  const [processingInvitation, setProcessingInvitation] = useState<
    string | null
  >(null);
  const params = useParams();
  const t = useTranslations("Invitations");
  const locale = (params?.locale as string) || "he";

  const { data: invitations = [], isLoading, error } = useInvitations();
  const acceptInvitationMutation = useAcceptInvitation();
  const declineInvitationMutation = useDeclineInvitation();

  const { isInitialized } = useAuthRedirect({
    redirectTo: `/${locale}/welcome`,
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

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{t("errorLoadingInvitations")}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-white rounded-lg"
          >
            {t("tryAgain")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      <div className="bg-surface">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-2xl font-bold text-primary">
                  {t("invitations")}
                </h1>
                <p className="text-secondary text-sm">
                  {t("manageInvitations")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 bg-card rounded-lg shadow-lg">
        {invitations.length === 0 ? (
          <div className="text-center py-12 ">
            <UserPlus className="w-16 h-16 text-muted mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-primary mb-2">
              {t("noInvitations")}
            </h3>
            <p className="text-secondary">{t("noNewInvitations")}</p>
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
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">
                      {invitation.group?.name?.charAt(0).toUpperCase()}
                    </div>

                    <div className="space-y-1">
                      <h3 className="font-bold text-lg text-foreground leading-none">
                        {invitation.group?.name}
                      </h3>
                      <p className="text-muted-foreground text-sm">
                        {t("invitedBy")}:{" "}
                        <span className="font-medium text-foreground">
                          {invitation.invitedBy?.firstName}{" "}
                          {invitation.invitedBy?.lastName}
                        </span>
                      </p>

                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <span
                          className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${
                            invitation.role === "admin"
                              ? "bg-amber-100 text-amber-700 border border-amber-200"
                              : "bg-blue-100 text-blue-700 border border-blue-200"
                          }`}
                        >
                          {invitation.role === "admin"
                            ? t("admin")
                            : t("member")}
                        </span>

                        <span className="text-xs text-muted-foreground flex items-center gap-1">
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
  );
}
