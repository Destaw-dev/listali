"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "../../../i18n/navigation";
import {
  Plus,
  Users,
  UserPlus,
  Search,
  Grid,
  List,
} from "lucide-react";
import { CreateGroupModal } from "../../../components/groups/CreateGroupModal";
import { JoinGroupModal } from "../../../components/groups/JoinGroupModal";
import {
  Card,
  CardBody,
  CardFooter,
  Button,
  Input,
  LoadingState,
  SkeletonCard
} from "../../../components/common";
import { useGroups, useCreateGroup, useJoinGroup } from "../../../hooks/useGroups";
import { useAuthRedirect } from "../../../hooks/useAuthRedirect";
import { IGroup, IGroupMember } from "../../../types";

export default function GroupsPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const router = useRouter();
  const t = useTranslations("Groups");

  const { data: groups = [], isLoading, error } = useGroups();
  const createGroupMutation = useCreateGroup();
  const joinGroupMutation = useJoinGroup();

  const { safeToShow } = useAuthRedirect({
    redirectTo: '/welcome',
    requireAuth: true,
  });

  const handleCreateGroup = async (groupData: {
    name: string;
    description?: string;
  }) => {
    await createGroupMutation.mutateAsync(groupData);
    setShowCreateModal(false);
  };

  const handleJoinGroup = async (inviteCode: string) => {
    await joinGroupMutation.mutateAsync(inviteCode);
    setShowJoinModal(false);
  };

  const navigateToGroup = (groupId: string) => {
    router.push(`/groups/${groupId}`);
  };

  const filteredGroups = groups.filter(
    (group: IGroup) =>
      group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      group.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!safeToShow) {
    return <LoadingState variant="page" />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface">
        <div className="container mx-auto px-4 py-4">
          <div className="max-w-6xl mx-auto space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-surface">
        <Card variant="glass" className="bg-card shadow-2xl max-w-md">
          <CardBody className="p-6 text-center">
            <h3 className="text-lg font-bold text-text-primary mb-2">
              {t("errorLoadingGroups")}
            </h3>
            <Button
              variant="primary"
              onClick={() => window.location.reload()}
              className="w-full"
            >
              {t("tryAgain")}
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      <div className="container mx-auto px-4 py-4">
        <div className="max-w-6xl mx-auto space-y-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[var(--color-icon-primary-bg)] rounded-xl">
                <Users className="w-5 h-5 text-[var(--color-icon-primary-fg)]" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-text-primary">
                  {t("myGroups")}
                </h1>
                <p className="text-xs text-text-muted">
                  {groups.length} {t("totalGroups")}
                </p>
              </div>
            </div>
            <div className="flex gap-2 items-center">
              <Button
                variant="primary"
                onClick={() => setShowCreateModal(true)}
                icon={<Plus className="w-4 h-4" />}
              >
                {t("createNewGroup")}
              </Button>
              <Button
                variant="secondary"
                onClick={() => setShowJoinModal(true)}
                icon={<UserPlus className="w-4 h-4" />}
              >
                {t("joinGroup")}
              </Button>
            </div>
          </div>

          <div className="flex gap-2 items-center justify-between">
            <div className="flex-1">
              <Input
                fullWidth
                placeholder={t("searchGroups")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={<Search className="w-4 h-4" />}
              />
            </div>
            <div className="gap-2 items-center hidden md:flex">

            <Button
              variant={viewMode === "grid" ? "primary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "primary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
            >
              <List className="w-4 h-4" />
            </Button>
            </div>
          </div>

          {filteredGroups.length === 0 ? (
            <Card  className="shadow-2xl">
              <CardBody className="p-8 text-center">
                <Users className="w-12 h-12 text-text-muted mx-auto mb-4" />
                <h3 className="text-lg font-bold text-text-primary mb-2">
                  {searchTerm ? t("noResults") : t("noGroups")}
                </h3>
                <p className="text-text-muted mb-4">
                  {searchTerm ? t("noResultsDesc") : t("createOrJoinGroup")}
                </p>
                <div className="flex gap-2 justify-center">
                  <Button
                    variant="primary"
                    onClick={() => setShowCreateModal(true)}
                    icon={<Plus className="w-4 h-4" />}
                    size="sm"
                  >
                    {t("createGroup")}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setShowJoinModal(true)}
                    icon={<UserPlus className="w-4 h-4" />}
                    size="sm"
                  >
                    {t("joinGroup")}
                  </Button>
                </div>
              </CardBody>
            </Card>
          ) : (
            <div
              className={
                viewMode === "grid"
                  ? "grid gap-6 md:grid-cols-2 lg:grid-cols-3"
                  : "space-y-4"
              }
            >
              {filteredGroups.map((group: IGroup) => (
                <Card
                  key={group._id}
                  hover
                  padding="sm"
                  rounded="xl"
                  shadow="md"
                  border={false}
                  onClick={() => navigateToGroup(group._id)}
                  className="cursor-pointer"
                >

                  <CardBody padding="lg" className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-base md:text-lg font-bold line-clamp-1">
                            {group.name}
                          </h3>
                        </div>

                        {group.description && (
                          <p className="text-xs md:text-sm text-text-muted mb-1 h-5 line-clamp-1">
                            {group.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardBody>

                  <CardFooter
                    padding="sm"
                    className="pt-3 flex items-center justify-between"
                  >
                    <div className="flex -space-x-2 space-x-reverse overflow-hidden">
                      {group.members
                        ?.slice(0, 3)
                        .map((member: IGroupMember, i: number) => (
                          <div
                            key={i}
                            className="h-6 w-6 rounded-full ring-2 ring-accent/20 bg-primary flex items-center justify-center text-[10px] text-text-muted font-medium"
                          >
                            {member.user.firstName?.[0]}
                            {member.user.lastName?.[0]}
                          </div>
                        ))}

                      <div className="h-6 w-6 rounded-full ring-2 ring-accent/20 bg-primary flex items-center justify-center text-[10px] text-text-muted font-medium">
                        +{group.members?.length || 0}
                      </div>
                    </div>

                    <div className="flex items-center text-[11px] md:text-xs font-medium text-text-on-primary bg-primary px-2 py-1 rounded-full">
                      {group.shoppingLists?.length || 0} {t("lists")}
                    </div>
                  </CardFooter>
                </Card>
              ))}
              <Button
                type="button"
                variant="dashed"
                size='xl'
                onClick={() => setShowCreateModal(true)}
              >
                <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center mb-3">
                  <Plus className="h-6 w-6 text-text-primary" />
                </div>
                <span className="text-sm font-medium text-text-primary">{t("createGroup")}</span>
              </Button>
            </div>
          )}
        </div>
      </div>

      <CreateGroupModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreateGroup={handleCreateGroup}
      />

      <JoinGroupModal
        isOpen={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        onJoinGroup={handleJoinGroup}
      />
    </div>
  );
}
