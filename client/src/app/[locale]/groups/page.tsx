"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter, useParams } from "next/navigation";
import {
  Plus,
  Users,
  ShoppingCart,
  Settings,
  UserPlus,
  Search,
  Grid,
  List,
  MoreHorizontal,
} from "lucide-react";
import { CreateGroupModal } from "@/components/groups/CreateGroupModal";
import { JoinGroupModal } from "@/components/groups/JoinGroupModal";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import {
  Card,
  CardBody,
  CardFooter,
  CardHeader,
} from "@/components/common/Card";
import { Button } from "@/components/common/Button";
import { Badge } from "@/components/common/Badge";
import { Input } from "@/components/common/Input";
import { useGroups, useCreateGroup, useJoinGroup } from "@/hooks/useGroups";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";

export default function GroupsPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const router = useRouter();
  const params = useParams();
  const t = useTranslations("Groups");
  const locale = (params?.locale as string) || "he";

  const { data: groups = [], isLoading, error } = useGroups();
  const createGroupMutation = useCreateGroup();
  const joinGroupMutation = useJoinGroup();

  const { isAuthenticated, isInitialized } = useAuthRedirect({
    redirectTo: `/${locale}/welcome`,
    requireAuth: true,
  });

  //   const groups = [
  //   { id: 1, name: 'דסטאו', description: 'קניות אישיות', itemsCount: 2, members: 3, color: 'bg-blue-500' },
  //   { id: 2, name: 'על האש - יום העצמאות', description: 'רשימה משותפת למשרד', itemsCount: 12, members: 8, color: 'bg-orange-500' },
  //   { id: 3, name: 'קניות לבית', description: 'פירות, ירקות ומוצרי ניקוי', itemsCount: 5, members: 2, color: 'bg-green-500' },
  // ];

  const handleCreateGroup = async (groupData: {
    name: string;
    description?: string;
  }) => {
    try {
      await createGroupMutation.mutateAsync(groupData);
      setShowCreateModal(false);
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const handleJoinGroup = async (inviteCode: string) => {
    try {
      await joinGroupMutation.mutateAsync(inviteCode);
      setShowJoinModal(false);
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const navigateToGroup = (groupId: string) => {
    router.push(`/${locale}/groups/${groupId}`);
  };

  const navigateToInvitations = () => {
    router.push(`/${locale}/invitations`);
  };

  // Filter groups based on search term
  const filteredGroups = groups.filter(
    (group: any) =>
      group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      group.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Show loading while auth is initializing
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-secondary-50 to-accent-50 safe-area-inset flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // Show loading while fetching data
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-secondary-50 to-accent-50 safe-area-inset flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-secondary-50 to-accent-50 safe-area-inset flex items-center justify-center p-4">
        <Card variant="glass" className="bg-white/80 shadow-2xl max-w-md">
          <CardBody className="p-6 text-center">
            <h3 className="text-lg font-bold text-primary mb-2">
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
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-secondary-50 to-accent-50 safe-area-inset">
      <div className="container mx-auto px-4 py-4">
        <div className="max-w-6xl mx-auto space-y-4">
          {/* Compact Header */}
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-primary">
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
              <Button
                variant="accent"
                size="sm"
                onClick={navigateToInvitations}
                icon={<UserPlus className="w-4 h-4" />}
              >
                {t("invitations")}
              </Button>
            </div>
          </div>

          {/* Search */}
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

          {/* Groups List */}
          {filteredGroups.length === 0 ? (
            <Card variant="glass" className="bg-surface shadow-lg">
              <CardBody className="p-8 text-center">
                <Users className="w-12 h-12 text-muted mx-auto mb-4" />
                <h3 className="text-lg font-bold text-primary mb-2">
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
              {filteredGroups.map((group: any) => (
                <Card
                  key={group._id}
                  variant="glass"
                  hover
                  padding="sm"
                  rounded="xl"
                  shadow="sm"
                  border={false}
                  onClick={() => navigateToGroup(group._id)}
                  className="overflow-hidden group cursor-pointer"
                  borderTopColor="border-t-info-100 border-t-8"
                >

                  <CardBody padding="lg" className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-base md:text-lg font-bold line-clamp-1">
                            {group.name}
                          </h3>
                          {group.role === "owner" && (
                            <Badge variant="success" size="sm">
                              {t("owner")}
                            </Badge>
                          )}
                        </div>

                        {group.description && (
                          <p className="text-xs md:text-sm text-gray-500 mb-1 h-5 line-clamp-1">
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
                        .map((member: any, i: number) => (
                          <div
                            key={i}
                            className="h-6 w-6 rounded-full ring-2 ring-accentT-50 bg-gray-300 flex items-center justify-center text-[10px] text-gray-600 font-medium"
                          >
                            {member.user.firstName?.[0]}
                            {member.user.lastName?.[0]}
                          </div>
                        ))}

                      <div className="h-6 w-6 rounded-full ring-2 ring-accentT-50 bg-gray-100 flex items-center justify-center text-[10px] text-gray-500 font-medium">
                        +{group.members?.length || 0}
                      </div>
                    </div>

                    <div className="flex items-center text-[11px] md:text-xs font-medium text-primaryT-600 bg-primaryT-50 px-2 py-1 rounded-full">
                      {group.shoppingLists?.length || 0} {t("lists")}
                    </div>
                  </CardFooter>
                </Card>
              ))}

              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center text-gray-400 hover:border-primary-400 hover:text-primary-500 hover:bg-gray-50 transition-all"
              >
                <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                  <Plus className="h-6 w-6" />
                </div>
                <span className="text-sm font-medium">{t("createGroup")}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
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
