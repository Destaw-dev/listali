"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useRouter } from "../../../../../i18n/navigation";
import {
  Settings,
  Trash2,
  UserPlus,
  Edit2,
  Save,
  X,
  Crown,
  Shield,
  User,
  MoreVertical,
  UserMinus,
  Calendar,
  Mail,
  XCircle,
  CheckCircle,
} from "lucide-react";
import {
  LoadingSpinner,
  Button,
  Input,
  TextArea,
  Toggle,
} from "../../../../../components/common";
import {
  useGroup,
  useUpdateGroup,
  useDeleteGroup,
  useRemoveGroupMember,
  useUpdateMemberRole,
  useTransferOwnership,
  useInviteToGroup,
  useCancelGroupInvitation,
  useLeaveGroup,
  useGroupMemberRoleWebSocket,
  useApproveJoinRequest,
  useRejectJoinRequest,
} from "../../../../../hooks/useGroups";
import { useAuthRedirect } from "../../../../../hooks/useAuthRedirect";
import { useAuthStore } from "../../../../../store/authStore";
import { InviteModal } from "../../../../../components/groups/InviteModal";
import { ArrowIcon } from "../../../../../components/common/Arrow";

type MemberRole = "owner" | "admin" | "member";

interface GroupUserObject {
  _id: string;
  firstName?: string;
  lastName?: string;
}

interface GroupMember {
  user: GroupUserObject | string;
  role: MemberRole;
}

interface PendingInvite {
  _id?: string;
  user?: GroupUserObject | string;
  email?: string;
  code: string;
  role: "admin" | "member";
  type: "in-app" | "email";
  invitedAt: string | Date;
}

interface JoinRequest {
  _id?: string;
  user: GroupUserObject | string;
  inviteCode: string;
  role: "admin" | "member";
  requestedAt: string | Date;
  status: "pending" | "approved" | "rejected";
}

interface Group {
  _id: string;
  name: string;
  description?: string | null;
  createdAt: string;
  members?: GroupMember[];
  pendingInvites?: PendingInvite[];
  joinRequests?: JoinRequest[];
  settings?: {
    allowMemberInvite?: boolean;
    requireApproval?: boolean;
    maxMembers?: number;
  };
}

interface MemberActionsDropdownProps {
  children: React.ReactNode;
  memberId: string;
  currentOpenId: string | null;
  setOpenId: (id: string | null) => void;
  memberActionsRef: React.RefObject<HTMLDivElement>;
}

const MemberActionsDropdown: React.FC<MemberActionsDropdownProps> = ({
  children,
  memberId,
  currentOpenId,
  setOpenId,
  memberActionsRef,
}) => {
  const isOpen = currentOpenId === memberId;

  return (
    <div className="relative" ref={isOpen ? memberActionsRef : null}>
      <Button
        variant="ghost"
        size="xs"
        onClick={() => setOpenId(isOpen ? null : memberId)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        <MoreVertical className="w-5 h-5" />
      </Button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-2 bg-card border border-border rounded-lg shadow-sm z-20 min-w-[200px] overflow-hidden">
          <div className="p-1">{children}</div>
        </div>
      )}
    </div>
  );
};

export default function GroupSettingsPage({}) {
  const [isEditing, setIsEditing] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [groupNameError, setGroupNameError] = useState<string | null>(null);
  const [showMemberActions, setShowMemberActions] = useState<string | null>(
    null,
  );
  const [isRemovingMember, setIsRemovingMember] = useState<string | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [isEditingSettings, setIsEditingSettings] = useState(false);
  const [allowMemberInvite, setAllowMemberInvite] = useState(false);
  const [requireApproval, setRequireApproval] = useState(false);
  const [maxMembers, setMaxMembers] = useState(50);
  const [maxMembersError, setMaxMembersError] = useState<string | null>(null);

  const t = useTranslations("groups.settings");

  const router = useRouter();
  const params = useParams();
  const groupId = params.groupId as string;
  const memberActionsRef = useRef<HTMLDivElement>(null);
  const { user } = useAuthStore();

  const { safeToShow } = useAuthRedirect({
    redirectTo: "/welcome",
    requireAuth: true,
  });

  const {
    data: groupRaw,
    isLoading: isGroupLoading,
    error,
  } = useGroup(groupId);

  const group = groupRaw as Group | undefined;

  const updateGroupMutation = useUpdateGroup();
  const deleteGroupMutation = useDeleteGroup();
  const removeMemberMutation = useRemoveGroupMember();
  const updateRoleMutation = useUpdateMemberRole();
  const transferOwnershipMutation = useTransferOwnership();
  const inviteToGroupMutation = useInviteToGroup();
  const cancelInvitationMutation = useCancelGroupInvitation();
  const leaveGroupMutation = useLeaveGroup();
  const approveJoinRequestMutation = useApproveJoinRequest();
  const rejectJoinRequestMutation = useRejectJoinRequest();

  useGroupMemberRoleWebSocket(groupId);

  const getMemberUserId = (member: GroupMember): string => {
    return typeof member.user === "object" ? member.user._id : member.user;
  };

  const getMemberName = (member: GroupMember): string => {
    if (typeof member.user === "object") {
      const fn = member.user.firstName ?? "";
      const ln = member.user.lastName ?? "";
      const full = `${fn} ${ln}`.trim();
      return full || t("unknownUser");
    }
    return t("unknownUser");
  };

  const getRoleIcon = (role: MemberRole) => {
    switch (role) {
      case "owner":
        return <Crown className="w-4 h-4 text-yellow-500" />;
      case "admin":
        return <Shield className="w-4 h-4 text-blue-500" />;
      default:
        return <User className="w-4 h-4 text-gray-500" />;
    }
  };

  const getRoleText = (role: MemberRole) => {
    switch (role) {
      case "owner":
        return t("owner");
      case "admin":
        return t("admin");
      default:
        return t("member");
    }
  };

  const navigateBack = () => router.push(`/groups/${groupId}`);

  const currentUserMembership = useMemo(() => {
    if (!group?.members || !user?._id) return undefined;
    return group.members.find((member) => getMemberUserId(member) === user._id);
  }, [group?.members, user?._id]);

  const hasAdminPermissions = useMemo(
    () =>
      currentUserMembership &&
      (currentUserMembership.role === "admin" ||
        currentUserMembership.role === "owner"),
    [currentUserMembership],
  );

  const canDeleteGroup = useMemo(
    () => currentUserMembership?.role === "owner",
    [currentUserMembership],
  );

  const isMember = useMemo(() => {
    if (!group?.members || !user?._id) return false;
    return group.members.some((member) => getMemberUserId(member) === user._id);
  }, [group?.members, user?._id]);

  const canManageMember = (member: GroupMember) => {
    if (!currentUserMembership) return false;

    const memberUserId = getMemberUserId(member);
    const currentUserId = user?._id;

    if (memberUserId === currentUserId && member.role === "owner") return false;

    if (memberUserId === currentUserId) return true;

    if (member.role === "admin" || member.role === "owner") {
      return currentUserMembership.role === "owner";
    }

    return hasAdminPermissions;
  };

  const canTransferOwnership = () => currentUserMembership?.role === "owner";

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        memberActionsRef.current &&
        !memberActionsRef.current.contains(event.target as Node)
      ) {
        setShowMemberActions(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleEdit = () => {
    if (!group) return;
    setGroupName(group.name);
    setGroupDescription(group.description || "");
    setGroupNameError(null);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setGroupName("");
    setGroupDescription("");
    setGroupNameError(null);
  };

  const handleSave = async () => {
    if (!groupName.trim()) {
      setGroupNameError(t("groupNameRequired"));
      return;
    }

    try {
      await updateGroupMutation.mutateAsync({
        groupId,
        groupData: {
          name: groupName.trim(),
          description: groupDescription.trim(),
        },
      });
      setIsEditing(false);
    } catch (err) {
      console.error("Failed to update group", err);
    }
  };

  const handleDeleteGroup = async () => {
    const confirmed = window.confirm(t("deleteGroupConfirmation"));
    if (!confirmed) return;

    try {
      await deleteGroupMutation.mutateAsync(groupId);
      router.push("/groups");
    } catch (err) {
      console.error("Failed to delete group", err);
    }
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    const confirmed = window.confirm(
      t("removeMemberConfirmation", { memberName }),
    );
    if (!confirmed) return;

    try {
      setIsRemovingMember(memberId);
      await removeMemberMutation.mutateAsync({ groupId, memberId });
      setShowMemberActions(null);
    } catch (err) {
      console.error("Failed to remove member", err);
    } finally {
      setIsRemovingMember(null);
    }
  };

  const handleChangeRole = async (
    memberId: string,
    newRole: Exclude<MemberRole, "owner">,
    memberName: string,
  ) => {
    try {
      await updateRoleMutation.mutateAsync({ groupId, memberId, newRole });
      setShowMemberActions(null);
    } catch (err) {
      console.error(`Failed to change role of ${memberName}`, err);
    }
  };

  const handleTransferOwnership = async (newOwnerId: string) => {
    try {
      await transferOwnershipMutation.mutateAsync({ groupId, newOwnerId });
      setShowMemberActions(null);
    } catch (err) {
      console.error(t("failedToTransferOwnership"), err);
    }
  };

  const handleInviteMembers = () => setShowInviteModal(true);

  const handleInvite = async (data: {
    email: string;
    role: Exclude<MemberRole, "owner">;
  }) => {
    try {
      await inviteToGroupMutation.mutateAsync({ groupId, inviteData: data });
      setShowInviteModal(false);
    } catch (err) {
      console.error(t("failedToInviteMember"), err);
    }
  };

  const handleCancelInvitation = async (inviteCode: string) => {
    const confirmed = window.confirm(t("cancelInvitationConfirm"));
    if (!confirmed) return;

    try {
      await cancelInvitationMutation.mutateAsync({ groupId, inviteCode });
    } catch (err) {
      console.error(t("failedToCancelInvitation"), err);
    }
  };

  const getInviteDisplayName = (invite: PendingInvite): string => {
    if (invite.user) {
      if (typeof invite.user === "object") {
        const fn = invite.user.firstName ?? "";
        const ln = invite.user.lastName ?? "";
        const full = `${fn} ${ln}`.trim();
        return full || t("unknownUser");
      }
      return t("unknownUser");
    }
    return invite.email || t("unknownEmail");
  };

  const getInviteDisplayIcon = (invite: PendingInvite) => {
    if (invite.user) {
      return <User className="w-4 h-4" />;
    }
    return <Mail className="w-4 h-4" />;
  };

  const handleLeaveGroup = async () => {
    try {
      await leaveGroupMutation.mutateAsync({ groupId });
      router.push("/groups");
    } catch (err) {
      console.error(t("failedToLeaveGroup"), err);
    }
  };

  const getJoinRequestUserId = (request: JoinRequest): string => {
    return typeof request.user === "object" ? request.user._id : request.user;
  };

  const getJoinRequestUserName = (request: JoinRequest): string => {
    if (typeof request.user === "object") {
      const fn = request.user.firstName ?? "";
      const ln = request.user.lastName ?? "";
      const full = `${fn} ${ln}`.trim();
      return full || t("unknownUser");
    }
    return t("unknownUser");
  };

  const handleApproveJoinRequest = async (requestId: string) => {
    try {
      await approveJoinRequestMutation.mutateAsync({ groupId, requestId });
    } catch (err) {
      console.error("Failed to approve join request", err);
    }
  };

  const handleRejectJoinRequest = async (requestId: string) => {
    try {
      await rejectJoinRequestMutation.mutateAsync({ groupId, requestId });
    } catch (err) {
      console.error("Failed to reject join request", err);
    }
  };

  useEffect(() => {
    if (group?.settings) {
      setAllowMemberInvite(group.settings.allowMemberInvite ?? false);
      setRequireApproval(group.settings.requireApproval ?? false);
      setMaxMembers(group.settings.maxMembers ?? 50);
    }
  }, [group?.settings]);

  const handleEditSettings = () => {
    if (!group) return;
    setAllowMemberInvite(group.settings?.allowMemberInvite ?? false);
    setRequireApproval(group.settings?.requireApproval ?? false);
    setMaxMembers(group.settings?.maxMembers ?? 50);
    setMaxMembersError(null);
    setIsEditingSettings(true);
  };

  const handleCancelSettings = () => {
    setIsEditingSettings(false);
    if (group?.settings) {
      setAllowMemberInvite(group.settings.allowMemberInvite ?? false);
      setRequireApproval(group.settings.requireApproval ?? false);
      setMaxMembers(group.settings.maxMembers ?? 50);
    }
    setMaxMembersError(null);
  };

  const handleSaveSettings = async () => {
    const currentMembersCount = group?.members?.length || 0;
    
    if (maxMembers < 2 || maxMembers > 100) {
      setMaxMembersError(t("maxMembersRange"));
      return;
    }

    if (maxMembers < currentMembersCount) {
      setMaxMembersError(t("maxMembersMinCurrent", { count: currentMembersCount }));
      return;
    }

    try {
      await updateGroupMutation.mutateAsync({
        groupId,
        groupData: {
          settings: {
            allowMemberInvite,
            requireApproval,
            maxMembers,
          },
        },
      });
      setIsEditingSettings(false);
    } catch (err) {
      console.error("Failed to update group settings", err);
    }
  };

  if (!safeToShow || isGroupLoading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center">
          <p className="text-error-500 mb-4">{t("errorLoadingGroup")}</p>
          <Button
            onClick={navigateBack}
            variant="primary"
            size="md"
            className="px-4 py-2 rounded-lg"
          >
            {t("backToGroups")}
          </Button>
        </div>
      </div>
    );
  }

  if (!isMember) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center">
          <Settings className="w-16 h-16 text-error-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-text-primary mb-2">
            {t("noPermission")}
          </h3>
          <p className="text-secondary mb-6">{t("notAMember")}</p>
          <Button onClick={navigateBack} variant="primary" size="md">
            {t("backToGroup")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface pb-12">
      <div className="border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="xs"
              onClick={navigateBack}
              className="cursor-pointer"
            >
              <ArrowIcon />
            </Button>
            <h1 className="text-xl font-bold text-text-primary">
              {t("groupSettings")}
            </h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="h-16 bg-gradient-to-l from-primary-500 to-primary-600" />

          <div className="px-6 pb-6 relative">
            <div className="flex justify-between items-end -mt-10 mb-4">
              <div className="w-16 h-16 rounded-xl bg-card border border-border p-1 shadow-md">
                <div className="w-full h-full bg-primary-100 rounded-lg flex items-center justify-center text-primary-600 text-xl font-bold">
                  {group.name?.[0] ?? t("defaultGroupAvatar")}
                </div>
              </div>

              {!isEditing && hasAdminPermissions && (
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleEdit}
                  icon={<Edit2 className="w-4 h-4" />}
                >
                  {t("edit")}
                </Button>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-4 pt-2">
                <div>
                  <Input
                    value={groupName}
                    onChange={(e) => {
                      setGroupName(e.target.value);
                      if (groupNameError) setGroupNameError(null);
                    }}
                    onBlur={() =>
                      setGroupNameError(
                        groupName.trim() ? null : t("groupNameRequired"),
                      )
                    }
                    placeholder={t("groupNamePlaceholder")}
                    label={t("groupName")}
                    required
                    error={groupNameError || undefined}
                    status={groupNameError ? "error" : "default"}
                    variant="default"
                  />
                </div>

                <div>
                  <TextArea
                    value={groupDescription}
                    onChange={(e) => setGroupDescription(e.target.value)}
                    rows={2}
                    placeholder={t("groupDescriptionPlaceholder")}
                    label={t("groupDescription")}
                    variant="default"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    variant="ghost"
                    size="md"
                    onClick={handleCancel}
                    disabled={updateGroupMutation.isPending}
                    loading={updateGroupMutation.isPending}
                    icon={<X className="w-4 h-4" />}
                  >
                    {t("cancel")}
                  </Button>
                  <Button
                    variant="primary"
                    size="md"
                    onClick={handleSave}
                    disabled={updateGroupMutation.isPending}
                    loading={updateGroupMutation.isPending}
                    icon={<Save className="w-4 h-4" />}
                  >
                    {t("saveChanges")}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <h1 className="text-2xl font-bold text-text-primary">
                  {group.name}
                </h1>
                {group.description && (
                  <p className="text-text-muted mt-1">{group.description}</p>
                )}

                <div className="flex items-center gap-2 pt-2 text-sm text-text-muted">
                  <Calendar size={14} />
                  <span>
                    {t("createdAt")}
                    {new Date(group.createdAt).toLocaleDateString("he-IL")}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl shadow-sm">
          <div className="p-6 border-b border-border flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-text-primary">
                {t("groupMembers")}
              </h2>
              <p className="text-sm text-text-muted">
                {group.members?.length ?? 0} {t("members")}
              </p>
            </div>

            {hasAdminPermissions && (
              <Button
                variant="primary"
                size="md"
                onClick={handleInviteMembers}
                icon={<UserPlus className="w-4 h-4" />}
                rounded
              >
                {t("inviteMembers")}
              </Button>
            )}
          </div>

          <div className="divide-y divide-gray-100">
            {group.members?.map((member) => {
              const memberUserId = getMemberUserId(member);
              const memberName = getMemberName(member);
              const isCurrentUser = memberUserId === user?._id;
              const canManage = canManageMember(member);
              const currentRole = member.role;

              return (
                <div
                  key={memberUserId}
                  className="p-4 flex items-center justify-between hover:bg-card-hover transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 text-sm font-medium">
                      {memberName[0] ?? "👤"}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-text-primary">
                          {isCurrentUser ? t("you") : memberName}
                        </p>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${
                            currentRole === "owner"
                              ? "bg-warning-100 text-warning-700"
                              : currentRole === "admin"
                                ? "bg-primary-100 text-primary-700"
                                : "bg-card border border-border text-text-muted"
                          }`}
                        >
                          {getRoleIcon(currentRole)}
                          {getRoleText(currentRole)}
                        </span>
                      </div>
                      <span className="text-xs text-text-muted">
                        {currentRole === "owner"
                          ? t("mainManager")
                          : currentRole === "admin"
                            ? t("teamManager")
                            : t("teamMember")}
                      </span>
                    </div>
                  </div>

                  {((isCurrentUser && currentRole !== "owner") ||
                    canManage) && (
                    <MemberActionsDropdown
                      memberId={memberUserId}
                      currentOpenId={showMemberActions}
                      setOpenId={setShowMemberActions}
                      memberActionsRef={
                        memberActionsRef as React.RefObject<HTMLDivElement>
                      }
                    >
                      {!isCurrentUser && canManage && (
                        <>
                          {currentRole === "member" && (
                            <button
                              onClick={() =>
                                handleChangeRole(
                                  memberUserId,
                                  "admin",
                                  memberName,
                                )
                              }
                              disabled={updateRoleMutation.isPending}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-primary-600 hover:bg-primary-50 rounded-lg transition-colors disabled:opacity-50"
                            >
                              <Shield className="w-4 h-4" />
                              {t("makeAdmin")}
                            </button>
                          )}

                          {currentRole === "admin" && (
                            <button
                              onClick={() =>
                                handleChangeRole(
                                  memberUserId,
                                  "member",
                                  memberName,
                                )
                              }
                              disabled={updateRoleMutation.isPending}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-muted hover:bg-card-hover rounded-lg transition-colors disabled:opacity-50"
                            >
                              <User className="w-4 h-4" />
                              {t("makeMember")}
                            </button>
                          )}

                          {canTransferOwnership() &&
                            currentRole !== "owner" && (
                              <button
                                onClick={() =>
                                  handleTransferOwnership(memberUserId)
                                }
                                disabled={transferOwnershipMutation.isPending}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-warning-700 hover:bg-warning-50 rounded-lg transition-colors disabled:opacity-50 border-t border-border mt-1 pt-2"
                              >
                                <Crown className="w-4 h-4" />
                                {t("transferOwnership")}
                              </button>
                            )}

                          <button
                            onClick={() =>
                              handleRemoveMember(memberUserId, memberName)
                            }
                            disabled={
                              removeMemberMutation.isPending ||
                              isRemovingMember === memberUserId
                            }
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-error-600 hover:bg-error-50 rounded-lg transition-colors disabled:opacity-50 border-t border-border mt-1 pt-2"
                          >
                            <UserMinus className="w-4 h-4" />
                            {t("removeFromGroup")}
                          </button>
                        </>
                      )}

                      {isCurrentUser && currentRole !== "owner" && (
                        <button
                          onClick={handleLeaveGroup}
                          disabled={leaveGroupMutation.isPending}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-error-600 hover:bg-error-50 rounded-lg transition-colors disabled:opacity-50"
                        >
                          <UserMinus className="w-4 h-4" />
                          {t("leaveGroup")}
                        </button>
                      )}
                    </MemberActionsDropdown>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {hasAdminPermissions && (
          <div className="bg-card border border-border rounded-xl shadow-sm">
            <div className="p-6 border-b border-border flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-text-primary">
                  {t("sentInvitations")}
                </h2>
                <p className="text-sm text-text-muted">
                  {group.pendingInvites?.length || 0} {t("pendingInvitations")}
                </p>
              </div>
            </div>

            {!group.pendingInvites || group.pendingInvites.length === 0 ? (
              <div className="p-8 text-center">
                <UserPlus className="w-12 h-12 text-text-muted mx-auto mb-3 opacity-50" />
                <p className="text-text-muted">{t("noInvitationsSent")}</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {group.pendingInvites.map((invite, index) => {
                  const displayName = getInviteDisplayName(invite);
                  const inviteIcon = getInviteDisplayIcon(invite);

                  return (
                    <div
                      key={
                        invite.code ??
                        `${invite.type}-${invite.invitedAt ?? index}`
                      }
                      className="p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between hover:bg-card-hover transition-colors"
                    >
                      <div className="flex items-start gap-3 min-w-0 md:items-center md:gap-4">
                        <div className="w-10 h-10 shrink-0 rounded-full bg-primary-100 flex items-center justify-center text-primary-600">
                          {inviteIcon}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-text-primary truncate">
                            {displayName}
                          </p>

                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            <span
                              className={[
                                "text-xs px-2 py-0.5 rounded-full",
                                invite.role === "admin"
                                  ? "bg-warning-100 text-warning-700"
                                  : "bg-primary-100 text-primary-700",
                              ].join(" ")}
                            >
                              {invite.role === "admin"
                                ? t("admin")
                                : t("member")}
                            </span>

                            <span
                              className={[
                                "text-xs px-2 py-0.5 rounded-full bg-card border text-text-muted",
                                invite.type === "in-app"
                                  ? "border-primary-200"
                                  : "border-border",
                              ].join(" ")}
                            >
                              {invite.type === "in-app"
                                ? t("invitationTypeInApp")
                                : t("invitationTypeEmail")}
                            </span>
                          </div>

                          <div className="mt-1 text-xs text-text-muted flex items-center gap-1">
                            <Calendar size={12} className="shrink-0" />
                            <span className="truncate">
                              {t("invitationDate")}:{" "}
                              {invite.invitedAt
                                ? new Date(invite.invitedAt).toLocaleDateString(
                                    "he-IL",
                                  )
                                : "-"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <Button
                        variant="outlineError"
                        size="sm"
                        onClick={() =>
                          invite.code && handleCancelInvitation(invite.code)
                        }
                        disabled={
                          !invite.code || cancelInvitationMutation.isPending
                        }
                        icon={<XCircle className="w-4 h-4 text-error-600" />}
                        className="w-full md:w-auto md:self-center"
                      >
                        {t("cancelInvitation")}
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {hasAdminPermissions && group?.joinRequests && group.joinRequests.filter((req: JoinRequest) => req.status === 'pending').length > 0 && (
          <div className="bg-card border border-border rounded-xl shadow-sm">
            <div className="p-6 border-b border-border">
              <div>
                <h2 className="text-xl font-bold text-text-primary">
                  {t("pendingJoinRequests")}
                </h2>
                <p className="text-sm text-text-muted">
                  {group.joinRequests.filter((req: JoinRequest) => req.status === 'pending').length} {t("pendingRequests")}
                </p>
              </div>
            </div>

            <div className="divide-y divide-gray-100">
              {group.joinRequests
                .filter((req: JoinRequest) => req.status === 'pending')
                .map((request: JoinRequest) => {
                  const requestUserId = getJoinRequestUserId(request);
                  const requestUserName = getJoinRequestUserName(request);
                  const requestId = request._id || requestUserId;

                  return (
                    <div
                      key={requestId}
                      className="p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between hover:bg-card-hover transition-colors"
                    >
                      <div className="flex items-start gap-3 min-w-0 md:items-center md:gap-4">
                        <div className="w-10 h-10 shrink-0 rounded-full bg-warning-100 flex items-center justify-center text-warning-600">
                          <UserPlus className="w-5 h-5" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-text-primary truncate">
                            {requestUserName}
                          </p>

                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            <span
                              className={[
                                "text-xs px-2 py-0.5 rounded-full",
                                request.role === "admin"
                                  ? "bg-warning-100 text-warning-700"
                                  : "bg-primary-100 text-primary-700",
                              ].join(" ")}
                            >
                              {request.role === "admin"
                                ? t("admin")
                                : t("member")}
                            </span>
                          </div>

                          <div className="mt-1 text-xs text-text-muted flex items-center gap-1">
                            <Calendar size={12} className="shrink-0" />
                            <span className="truncate">
                              {t("requestDate")}:{" "}
                              {request.requestedAt
                                ? new Date(request.requestedAt).toLocaleDateString(
                                    "he-IL",
                                  )
                                : "-"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 w-full md:w-auto">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleApproveJoinRequest(requestId)}
                          disabled={
                            approveJoinRequestMutation.isPending ||
                            rejectJoinRequestMutation.isPending
                          }
                          icon={<CheckCircle className="w-4 h-4" />}
                          className="flex-1 md:flex-none"
                        >
                          {t("approve")}
                        </Button>
                        <Button
                          variant="outlineError"
                          size="sm"
                          onClick={() => handleRejectJoinRequest(requestId)}
                          disabled={
                            approveJoinRequestMutation.isPending ||
                            rejectJoinRequestMutation.isPending
                          }
                          icon={<XCircle className="w-4 h-4 text-error-600" />}
                          className="flex-1 md:flex-none"
                        >
                          {t("reject")}
                        </Button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {canDeleteGroup && (
          <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-border">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
                    <Settings className="w-5 h-5 text-primary-600" />
                    {t("groupSettings")}
                  </h2>
                  <p className="text-sm text-text-muted mt-1">
                    {t("manageGroupSettings")}
                  </p>
                </div>

                {!isEditingSettings && (
                  <Button
                    variant="primary"
                    size="md"
                    onClick={handleEditSettings}
                    icon={<Edit2 className="w-4 h-4" />}
                  >
                    {t("edit")}
                  </Button>
                )}
              </div>
            </div>

            {isEditingSettings ? (
              <div className="p-6 space-y-6">
                <div className="bg-primary-50/50 border border-primary-200 rounded-lg p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-text-primary mb-1.5">
                        {t("allowMemberInvite")}
                      </h3>
                      <p className="text-xs text-text-muted leading-relaxed">
                        {t("allowMemberInviteDescription")}
                      </p>
                    </div>
                    <div className="shrink-0">
                      <Toggle
                        isEnabled={allowMemberInvite}
                        onClick={() => setAllowMemberInvite(!allowMemberInvite)}
                        variant="primary"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-primary-50/50 border border-primary-200 rounded-lg p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-text-primary mb-1.5">
                        {t("requireApproval")}
                      </h3>
                      <p className="text-xs text-text-muted leading-relaxed">
                        {t("requireApprovalDescription")}
                      </p>
                    </div>
                    <div className="shrink-0">
                      <Toggle
                        isEnabled={requireApproval}
                        onClick={() => setRequireApproval(!requireApproval)}
                        variant="primary"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-primary-50/50 border border-primary-200 rounded-lg p-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-text-primary mb-1.5">
                          {t("maxMembers")}
                        </h3>
                        <p className="text-xs text-text-muted leading-relaxed">
                          {t("maxMembersDescription")}
                        </p>
                        {group?.members && (
                          <p className="text-xs text-primary-600 mt-1.5 font-medium">
                            {t("currentMembersCount", { count: group.members.length })}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="max-w-[200px]">
                      <Input
                        type="number"
                        value={maxMembers}
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      if (!isNaN(value)) {
                        const currentMembersCount = group?.members?.length || 0;
                        if (value < currentMembersCount) {
                          setMaxMembersError(t("maxMembersMinCurrent", { count: currentMembersCount }));
                        } else {
                          setMaxMembersError(null);
                        }
                        setMaxMembers(value);
                      }
                    }}
                        min={Math.max(2, group?.members?.length || 2)}
                        max={100}
                        label={t("maxMembers")}
                        error={maxMembersError || undefined}
                        status={maxMembersError ? "error" : "default"}
                        variant="default"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-2 border-t border-border">
                  <Button
                    variant="ghost"
                    size="md"
                    onClick={handleCancelSettings}
                    disabled={updateGroupMutation.isPending}
                    loading={updateGroupMutation.isPending}
                    icon={<X className="w-4 h-4" />}
                    className="flex-1"
                  >
                    {t("cancel")}
                  </Button>
                  <Button
                    variant="primary"
                    size="md"
                    onClick={handleSaveSettings}
                    disabled={updateGroupMutation.isPending}
                    loading={updateGroupMutation.isPending}
                    icon={<Save className="w-4 h-4" />}
                    className="flex-1"
                  >
                    {t("saveChanges")}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-6 space-y-4">
                <div className="flex items-start justify-between gap-4 py-3 border-b border-border last:border-0">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-text-primary mb-1">
                      {t("allowMemberInvite")}
                    </h3>
                    <p className="text-xs text-text-muted">
                      {t("allowMemberInviteDescription")}
                    </p>
                  </div>
                  <div className="shrink-0">
                    <span className={`text-sm font-semibold px-3 py-1 rounded-full ${
                      group.settings?.allowMemberInvite 
                        ? "bg-success-100 text-success-700" 
                        : "bg-gray-100 text-gray-600"
                    }`}>
                      {group.settings?.allowMemberInvite ? t("enabled") : t("disabled")}
                    </span>
                  </div>
                </div>

                <div className="flex items-start justify-between gap-4 py-3 border-b border-border last:border-0">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-text-primary mb-1">
                      {t("requireApproval")}
                    </h3>
                    <p className="text-xs text-text-muted">
                      {t("requireApprovalDescription")}
                    </p>
                  </div>
                  <div className="shrink-0">
                    <span className={`text-sm font-semibold px-3 py-1 rounded-full ${
                      group.settings?.requireApproval 
                        ? "bg-success-100 text-success-700" 
                        : "bg-gray-100 text-gray-600"
                    }`}>
                      {group.settings?.requireApproval ? t("enabled") : t("disabled")}
                    </span>
                  </div>
                </div>

                <div className="flex items-start justify-between gap-4 py-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-text-primary mb-1">
                      {t("maxMembers")}
                    </h3>
                    <p className="text-xs text-text-muted">
                      {t("maxMembersDescription")}
                    </p>
                    {group?.members && (
                      <p className="text-xs text-primary-600 mt-1.5 font-medium">
                        {t("currentMembersCount", { count: group.members.length })}
                      </p>
                    )}
                  </div>
                  <div className="shrink-0">
                    <span className="text-sm font-semibold px-3 py-1 bg-primary-100 text-primary-700 rounded-full">
                      {group.settings?.maxMembers ?? 50}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="bg-error-50/50 p-4 border-b border-error-100 flex items-center gap-2 text-error-800">
            <Trash2 size={18} />
            <span className="font-bold text-sm">{t("dangerZone")}</span>
          </div>

          <div className="divide-y divide-border">
            {currentUserMembership &&
              currentUserMembership.role !== "owner" && (
                <div className="p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between hover:bg-card-hover transition-colors">
                  <div>
                    <h3 className="text-sm font-medium text-text-primary">
                      {t("leaveGroup")}
                    </h3>
                    <p className="text-xs text-text-muted mt-0.5">
                      {t("leaveGroupConfirmation")}
                    </p>
                  </div>
                  <Button variant="error" size="md" onClick={handleLeaveGroup} disabled={leaveGroupMutation.isPending}>
                  {leaveGroupMutation.isPending
                      ? t("leavingGroup")
                      : t("leaveGroup")}
                  </Button>
                </div>
              )}

{canDeleteGroup && (
  <div className="p-4 hover:bg-error transition-colors">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <h3 className="text-sm font-medium text-error-600">
          {t("deleteGroup")}
        </h3>
        <p className="text-xs text-error-400 mt-0.5 break-words">
          {t("deleteGroupConfirmation")}
        </p>
      </div>

      <Button variant="error" size="md" onClick={handleDeleteGroup} disabled={deleteGroupMutation.isPending} icon={<Trash2 className="w-4 h-4" />}>
        {deleteGroupMutation.isPending ? t("deletingGroup") : t("deleteGroup")}
      </Button>
    </div>
  </div>
)}

          </div>
        </div>
      </div>

      {showInviteModal && (
        <InviteModal
          isOpen={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          onInvite={handleInvite}
          groupName={group?.name || ""}
        />
      )}
    </div>
  );
}
