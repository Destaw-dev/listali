"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useRouter, useParams } from "next/navigation";
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
} from "lucide-react";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import {
  useGroup,
  useUpdateGroup,
  useDeleteGroup,
  useRemoveGroupMember,
  useUpdateMemberRole,
  useTransferOwnership,
  useInviteToGroup,
  useLeaveGroup,
  useGroupMemberRoleWebSocket,
} from "@/hooks/useGroups";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { useAuthStore } from "@/store/authStore";
import { InviteModal } from "@/components/groups/InviteModal";
import { ArrowIcon } from "@/components/common/Arrow";
import { Button, Input, TextArea } from "@/components/common";

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

interface Group {
  _id: string;
  name: string;
  description?: string | null;
  createdAt: string;
  members?: GroupMember[];
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
        <div className="absolute left-0 top-full mt-2 bg-white rounded-lg shadow-xl border border-gray-100 z-20 min-w-[200px] overflow-hidden">
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
    null
  );
  const [isRemovingMember, setIsRemovingMember] = useState<string | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);

  const t = useTranslations("groups.settings");

  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const groupId = params.groupId as string;
  const memberActionsRef = useRef<HTMLDivElement>(null);
  const { user } = useAuthStore();

  const { isInitialized } = useAuthRedirect({
    redirectTo: `/${locale}/welcome`,
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
  const leaveGroupMutation = useLeaveGroup();

  useGroupMemberRoleWebSocket(groupId);

  const getMemberUserId = (member: GroupMember): string => {
    return typeof member.user === "object" ? member.user._id : member.user;
  };

  const getMemberName = (member: GroupMember): string => {
    if (typeof member.user === "object") {
      const fn = member.user.firstName ?? "";
      const ln = member.user.lastName ?? "";
      const full = `${fn} ${ln}`.trim();
      return full || t('unknownUser');
    }
    return t('unknownUser');
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
        return t('owner');
      case "admin":
        return t('admin');
      default:
        return t('member');
    }
  };

  const navigateBack = () => router.push(`/${locale}/groups/${groupId}`);

  const currentUserMembership = useMemo(() => {
    if (!group?.members || !user?._id) return undefined;
    return group.members.find((member) => getMemberUserId(member) === user._id);
  }, [group?.members, user?._id]);

  const hasAdminPermissions = useMemo(
    () =>
      currentUserMembership &&
      (currentUserMembership.role === "admin" ||
        currentUserMembership.role === "owner"),
    [currentUserMembership]
  );

  const canDeleteGroup = useMemo(
    () => currentUserMembership?.role === "owner",
    [currentUserMembership]
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
      setGroupNameError(t('groupNameRequired'));
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
    const confirmed = window.confirm(
      t('deleteGroupConfirmation')
    );
    if (!confirmed) return;

    try {
      await deleteGroupMutation.mutateAsync(groupId);
      router.push(`/${locale}/groups`);
    } catch (err) {
      console.error("Failed to delete group", err);
    }
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    const confirmed = window.confirm(
      t('removeMemberConfirmation', { memberName })
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
    memberName: string
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
      console.error(t('failedToTransferOwnership'), err);
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
      console.error(t('failedToInviteMember'), err);
    }
  };

  const handleLeaveGroup = async () => {
    try {
      await leaveGroupMutation.mutateAsync({ groupId });
      router.push(`/${locale}/groups`);
    } catch (err) {
      console.error(t('failedToLeaveGroup'), err);
    }
  };


  if (!isInitialized || isGroupLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{t('errorLoadingGroup')}</p>
          <Button
            onClick={navigateBack}
            variant="primary"
            size="md"
            className="px-4 py-2 rounded-lg"
          >
            {t('backToGroups')}
          </Button>
        </div>
      </div>
    );
  }

  if (!isMember) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Settings className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-primary mb-2">{t('noPermission')}</h3>
          <p className="text-secondary mb-6">{t('notAMember')}</p>
          <Button onClick={navigateBack} variant="primary" size="md">
            {t('backToGroup')}
          </Button>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-surface pb-12" dir="rtl">
      <div className="border-b border-gray-200">
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
            <h1 className="text-xl font-bold">{t('groupSettings')}</h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <div className="bg-surface rounded-2xl shadow-lg overflow-hidden">
          <div className="h-16 bg-gradient-to-l from-primaryT-500 to-primaryT-600" />

          <div className="px-6 pb-6 relative">
            <div className="flex justify-between items-end -mt-10 mb-4">
              <div className="w-16 h-16 rounded-xl bg-surface p-1 shadow-md">
                <div className="w-full h-full bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 text-xl font-bold">
                  {group.name?.[0] ?? t('defaultGroupAvatar')}
                </div>
              </div>

              {!isEditing && hasAdminPermissions && (
                <Button variant='primary' size="md" onClick={handleEdit} icon={<Edit2 className="w-4 h-4" />}>
                  {t('edit')}
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
                        groupName.trim() ? null : t('groupNameRequired')
                      )
                    }
                    placeholder={t('groupNamePlaceholder')}
                    label={t('groupName')}
                    required
                    error={groupNameError || undefined}
                    status={groupNameError ? "error" : "default"}
                    variant='default'
                  />
                </div>

                <div>
                  <TextArea
                    value={groupDescription}
                    onChange={(e) => setGroupDescription(e.target.value)}
                    rows={2}
                    placeholder={t('groupDescriptionPlaceholder')}
                    label={t('groupDescription')}
                    variant='default'
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <Button variant='ghost' size="md" onClick={handleCancel} disabled={updateGroupMutation.isPending} loading={updateGroupMutation.isPending} icon={<X className="w-4 h-4" />}>
                    {t('cancel')}
                  </Button>
                  <Button variant='primary' size="md" onClick={handleSave} disabled={updateGroupMutation.isPending} loading={updateGroupMutation.isPending} icon={<Save className="w-4 h-4" />}>
                    {t('saveChanges')}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <h1 className="text-2xl font-bold text-gray-900">
                  {group.name}
                </h1>
                {group.description && (
                  <p className="text-gray-600 mt-1">{group.description}</p>
                )}

                <div className="flex items-center gap-2 pt-2 text-sm text-gray-500">
                  <Calendar size={14} />
                  <span>
                    {t('createdAt')}{new Date(group.createdAt).toLocaleDateString("he-IL")}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{t('groupMembers')}</h2>
              <p className="text-sm text-gray-500">
                {group.members?.length ?? 0} {t('members')}
              </p>
            </div>

            {hasAdminPermissions && (
              <Button variant='primary' size="md" onClick={handleInviteMembers} icon={<UserPlus className="w-4 h-4" />} rounded>
                {t('inviteMembers')}
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
                  className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-sm font-medium">
                      {memberName[0] ?? "👤"}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900">
                          {isCurrentUser ? t('you') : memberName}
                        </p>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${
                            currentRole === "owner"
                              ? "bg-yellow-100 text-yellow-700"
                              : currentRole === "admin"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {getRoleIcon(currentRole)}
                          {getRoleText(currentRole)}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {currentRole === "owner"
                          ? t('mainManager')
                          : currentRole === "admin"
                          ? t('teamManager')
                          : t('teamMember')}
                      </span>
                    </div>
                  </div>

                  {(isCurrentUser || canManage) && (
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
                                  memberName
                                )
                              }
                              disabled={updateRoleMutation.isPending}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                            >
                              <Shield className="w-4 h-4" />
                              {t('makeAdmin')}
                            </button>
                          )}

                          {currentRole === "admin" && (
                            <button
                              onClick={() =>
                                handleChangeRole(
                                  memberUserId,
                                  "member",
                                  memberName
                                )
                              }
                              disabled={updateRoleMutation.isPending}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-50"
                            >
                              <User className="w-4 h-4" />
                              {t('makeMember')}
                            </button>

                          )}

                          {canTransferOwnership() &&
                            currentRole !== "owner" && (
                              <button
                                onClick={() =>
                                  handleTransferOwnership(memberUserId)
                                }
                                disabled={transferOwnershipMutation.isPending}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-yellow-700 hover:bg-yellow-50 rounded-lg transition-colors disabled:opacity-50 border-t border-gray-100 mt-1 pt-2"
                              >
                                <Crown className="w-4 h-4" />
                                {t('transferOwnership')}
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
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 border-t border-gray-100 mt-1 pt-2"
                          >
                            <UserMinus className="w-4 h-4" />
                            {t('removeFromGroup')}
                          </button>
                        </>
                      )}

                      {isCurrentUser && currentRole !== "owner" && (
                        <button
                          onClick={handleLeaveGroup}
                          disabled={leaveGroupMutation.isPending}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        >
                          <UserMinus className="w-4 h-4" />
                          {t('leaveGroup')}
                        </button>
                      )}
                    </MemberActionsDropdown>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-red-200 overflow-hidden">
          <div className="bg-red-50/50 p-4 border-b border-red-100 flex items-center gap-2 text-red-800">
            <Trash2 size={18} />
            <span className="font-bold text-sm">{t('dangerZone')}</span>
          </div>

          <div className="divide-y divide-gray-100">
            {currentUserMembership &&
              currentUserMembership.role !== "owner" && (
                <div className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div>
                    <h3 className="text-sm font-medium text-gray-700">
                      {t('leaveGroup')}
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {t('leaveGroupConfirmation')}
                    </p>
                  </div>
                  <button
                    onClick={handleLeaveGroup}
                    disabled={leaveGroupMutation.isPending}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-transparent hover:border-red-100"
                  >
                    {leaveGroupMutation.isPending ? t('leavingGroup') : t('leaveGroup')}
                  </button>
                </div>
              )}

            {canDeleteGroup && (
              <div className="p-4 flex items-center justify-between hover:bg-red-50/30 transition-colors">
                <div>
                  <h3 className="text-sm font-medium text-red-600">
                    {t('deleteGroup')}
                  </h3>
                  <p className="text-xs text-red-400 mt-0.5">
                    {t('deleteGroupConfirmation')}
                  </p>
                </div>
                <button
                  onClick={handleDeleteGroup}
                  disabled={deleteGroupMutation.isPending}
                  className="bg-red-600 border border-red-600 text-white hover:bg-red-700 px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-md shadow-red-200"
                >
                  {deleteGroupMutation.isPending ? t('deletingGroup') : t('deleteGroup')}
                </button>
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
