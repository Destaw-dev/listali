"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "../../../i18n/navigation";
import {
  Users,
  ShoppingCart,
  Plus,
  TrendingUp,
  Bell,
  Sparkles,
  Activity,
  Target,
  Award,
} from "lucide-react";
import { useAuthRedirect } from "../../../hooks/useAuthRedirect";
import { useAuthStore } from "../../../store/authStore";
import { useDashboard } from "../../../hooks/useDashboard";
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  Badge,
  LoadingState,
} from "../../../components/common";
import { ArrowIcon } from "../../../components/common/Arrow";
import { IAchievement } from "../../../types";
import { colorRoleClasses } from "../../../lib/colorRoles";

export default function DashboardPage() {
  const router = useRouter();
  const t = useTranslations("Dashboard");
  const { user } = useAuthStore();

  const { safeToShow } = useAuthRedirect({
    redirectTo: '/welcome',
    requireAuth: true,
  });

  const { data: dashboardData } = useDashboard();


  if (!safeToShow) {
    return <LoadingState variant="page" size="lg" message={t("loading")} />;
  }

  const stats = dashboardData?.stats || {
    groups: 0,
    lists: 0,
    completedLists: 0,
    totalItems: 0,
    purchasedItems: 0,
    remainingItems: 0,
    completedTasks: 0,
    pendingTasks: 0,
  };

  const growth = dashboardData?.growth || {
    groupsGrowth: 0,
    listsGrowth: 0,
    completedTasksGrowth: 0,
  };

  const achievements = dashboardData?.achievements || [];
  const userInfo = dashboardData?.user || {
    lastActive: t("unknown"),
    online: false,
  };

  const quickActions = [
    {
      title: `${t("createGroup")} / ${t("joinGroup")}`,
      description: t("joinGroupDesc"),
      icon: Plus,
      action: () => router.push('/groups'),
      variant: "secondary" as const,
      iconContainer: "bg-[var(--color-icon-secondary-bg)]",
      iconColor: "text-[var(--color-icon-secondary-fg)]",
    },
    {
      title: t("viewInvitations"),
      description: t("viewInvitationsDesc"),
      icon: Bell,
      action: () => router.push('/invitations'),
      variant: "accent" as const,
      iconContainer: "bg-[var(--color-icon-accent-bg)]",
      iconColor: "text-[var(--color-icon-accent-fg)]",
    },
  ];

  const achievementIcons = {
    first_group: Award,
    shopping_master: Target,
    group_player: Users,
  };

  return (
    <div className="min-h-screen bg-surface">
      <div className="container mx-auto px-4 py-8 relative z-10">
        <div className="max-w-7xl mx-auto space-y-8">
          <Card variant="glass" className="shadow-2xl bg-card">
            <CardBody className="p-1 sm:p-8">
              <div className="flex sm:items-center justify-between flex-col md:flex-row gap-3 ">
                <div className="flex items-center sm:gap-6 flex-col sm:flex-row">
                  {user?.avatar && (
                    <div className="">
                      <img
                        src={user.avatar}
                        alt={user.firstName || user.username}
                        width="100%"
                        height={"100%"}
                        loading="lazy"
                        className="w-14 h-14 sm:w-24 sm:h-24 rounded-full border-4 border-border shadow-xl object-cover"
                      />
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-3 mb-3 bg-[var(--color-icon-primary-bg)] rounded-lg p-2">
                      <h1 className="text-4xl font-bold text-[var(--color-icon-primary-fg)]">
                        {t("welcome")}
                      </h1>
                    </div>
                    <p className="text-xl text-text-secondary font-medium mb-1">
                      {user?.username || user?.firstName + " " + user?.lastName}
                    </p>
                    <div className="text-sm text-text-muted flex items-center gap-2">
                      <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
                      {user?.email}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <Badge variant="success" size="lg" dot className="mb-2">
                    {t("online")}
                  </Badge>
                  <p className="text-sm text-text-muted">
                    {t("lastActive")}: {userInfo.lastActive}
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
            <Card hover className="bg-card">
              <CardBody className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-[var(--color-icon-primary-bg)] rounded-2xl shadow-sm">
                    <Users className="w-6 h-6 text-[var(--color-icon-primary-fg)]" />
                  </div>
                  <div className="text-end">
                    <p className="text-sm font-medium text-text-muted">
                      {t("totalGroups")}
                    </p>
                    <p className="text-2xl font-bold text-text-primary">
                      {stats.groups}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-success" />
                  <span className="text-sm font-medium text-success">
                    {growth.groupsGrowth > 0
                      ? `+${growth.groupsGrowth}%`
                      : "0%"}
                  </span>
                  <span className="text-xs text-text-muted">
                    {t("fromLastMonth")}
                  </span>
                </div>
              </CardBody>
            </Card>

            <Card hover className="bg-card">
              <CardBody className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-[var(--color-icon-secondary-bg)] rounded-2xl shadow-sm">
                    <ShoppingCart className="w-6 h-6 text-[var(--color-icon-secondary-fg)]" />
                  </div>
                  <div className="text-end">
                    <p className="text-sm font-medium text-text-muted">
                      {t("totalLists")}
                    </p>
                    <p className="text-2xl font-bold text-secondary">
                      {stats.lists}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-success" />
                  <span className="text-sm font-medium text-success">
                    {growth.listsGrowth > 0 ? `+${growth.listsGrowth}%` : "0%"}
                  </span>
                  <span className="text-xs text-text-muted">
                    {t("fromLastMonth")}
                  </span>
                </div>
              </CardBody>
            </Card>

            <Card hover className="bg-card">
              <CardBody className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-[var(--color-icon-accent-bg)] rounded-2xl shadow-sm">
                    <Target className="w-6 h-6 text-[var(--color-icon-accent-fg)]" />
                  </div>
                  <div className="text-end">
                    <p className="text-sm font-medium text-text-muted">
                      {t("completedLists")}
                    </p>
                    <p className="text-2xl font-bold text-accent">
                      {stats.completedLists}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-success" />
                  <span className="text-sm font-medium text-success">
                    {stats.completedLists > 0
                      ? `${Math.round(
                          (stats.completedLists / stats.lists) * 100
                        )}%`
                      : "0%"}
                  </span>
                  <span className="text-xs text-text-muted">
                    {t("completionPercentage")}
                  </span>
                </div>
              </CardBody>
            </Card>

            <Card hover className="bg-card">
              <CardBody className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-[var(--color-icon-warning-bg)] rounded-2xl shadow-sm">
                    <ShoppingCart className="w-6 h-6 text-[var(--color-icon-warning-fg)]" />
                  </div>
                  <div className="text-end">
                    <p className="text-sm font-medium text-text-muted">
                      {t("purchasedItems")}
                    </p>
                    <p className="text-2xl font-bold text-warning">
                      {stats.purchasedItems}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-success" />
                  <span className="text-sm font-medium text-success">
                    {stats.totalItems > 0
                      ? `${Math.round(
                          (stats.purchasedItems / stats.totalItems) * 100
                        )}%`
                      : "0%"}
                  </span>
                  <span className="text-xs text-text-muted">
                    {t("purchasePercentage")}
                  </span>
                </div>
              </CardBody>
            </Card>

            <Card hover className="bg-card">
              <CardBody className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-[var(--color-icon-success-bg)] rounded-2xl shadow-sm">
                    <Activity className="w-6 h-6 text-[var(--color-icon-success-fg)]" />
                  </div>
                  <div className="text-end">
                    <p className="text-sm font-medium text-text-muted">
                      {t("remainingItems")}
                    </p>
                    <p className="text-2xl font-bold text-success">
                      {stats.remainingItems}
                    </p>
                  </div>
                </div>
                  <div className="w-full bg-border-light rounded-full h-2 mb-2">
                  <div
                    className="bg-success h-2 rounded-full"
                    style={{
                      width: `${
                        stats.totalItems > 0
                          ? Math.round(
                              (stats.remainingItems / stats.totalItems) * 100
                            )
                          : 0
                      }%`,
                    }}
                  ></div>
                </div>
                <p className="text-xs text-text-muted text-center">
                  {t("remainingToBuy")}
                </p>
              </CardBody>
            </Card>

            <Card hover>
              <CardBody className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-[var(--color-icon-info-bg)] rounded-2xl shadow-sm">
                    <ShoppingCart className="w-6 h-6 text-[var(--color-icon-info-fg)]" />
                  </div>
                  <div className="text-end">
                    <p className="text-sm font-medium text-text-muted">
                      {t("totalItems")}
                    </p>
                    <p className="text-2xl font-bold text-info">
                      {stats.totalItems}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-info" />
                  <span className="text-sm font-medium text-info">
                    {t("totalItemsLabel")}
                  </span>
                </div>
              </CardBody>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Card variant="glass" className="bg-surface/80 shadow-2xl">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[var(--color-icon-primary-bg)] rounded-lg">
                      <Sparkles className="w-5 h-5 text-[var(--color-icon-primary-fg)]" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-text-primary">
                        {t("quickActions")}
                      </h2>
                      <p className="text-text-muted">{t("quickActionsDesc")}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardBody>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {quickActions.map((action, index) => {
                      const Icon = action.icon;
                      return (
                        <Card
                          key={index}
                          variant="glass"
                          hover
                          onClick={action.action}
                          className="cursor-pointer  shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                        >
                          <CardBody className="p-6 text-center">
                            <div
                              className={`p-4 rounded-2xl mb-4 inline-block ${action.iconContainer} shadow-sm`}
                            >
                              <Icon className={`w-8 h-8 ${action.iconColor}`} />
                            </div>
                            <h3 className="text-lg font-semibold text-text-primary mb-2">
                              {action.title}
                            </h3>
                            <p className="text-sm text-text-muted mb-4">
                              {action.description}
                            </p>
                            <Button
                              variant={action.variant}
                              size="sm"
                              icon={<ArrowIcon />}
                              className="w-full"
                            >
                              {t("getStarted")}
                            </Button>
                          </CardBody>
                        </Card>
                      );
                    })}
                  </div>
                </CardBody>
              </Card>
            </div>

            <div>
              <Card variant="glass" className="bg-surface/80 shadow-2xl">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[var(--color-icon-warning-bg)] rounded-lg">
                      <Award className="w-5 h-5 text-[var(--color-icon-warning-fg)]" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-text-primary">
                        {t("achievements")}
                      </h2>
                      <p className="text-text-muted">{t("achievementsDesc")}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardBody>
                  <div className="space-y-4">
                    {achievements.map(
                      (achievement: IAchievement, index: number) => {
                        const Icon =
                          achievementIcons[
                            achievement.id as keyof typeof achievementIcons
                          ] || Award;
                        return (
                          <div
                            key={index}
                            className="flex items-center gap-4 p-4 bg-surface rounded-xl"
                          >
                            <div className="p-2 bg-surface-hover rounded-lg">
                              <Icon
                                className={`w-5 h-5 ${
                                  achievement.unlocked
                                    ? "text-warning"
                                    : "text-text-muted"
                                }`}
                              />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-text-primary">
                                {achievement.title}
                              </p>
                              <p className="text-sm text-text-muted">
                                {achievement.description}
                              </p>
                              <div className="mt-2">
                                <div className="w-full bg-border-light rounded-full h-2">
                                  <div
                                    className="bg-warning h-2 rounded-full transition-all duration-300"
                                    style={{
                                      width: `${
                                        (achievement.progress /
                                          achievement.maxProgress) *
                                        100
                                      }%`,
                                    }}
                                  ></div>
                                </div>
                                <p className="text-xs text-text-muted mt-1">
                                  {achievement.progress}/
                                  {achievement.maxProgress}
                                </p>
                              </div>
                            </div>
                            {achievement.unlocked && (
                              <div className="w-3 h-3 bg-warning rounded-full"></div>
                            )}
                          </div>
                        );
                      }
                    )}
                  </div>
                </CardBody>
              </Card>
            </div>
          </div>

          <Card variant="glass" className="bg-surface/80 shadow-2xl">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[var(--color-icon-accent-bg)] rounded-lg">
                  <Activity className="w-5 h-5 text-[var(--color-icon-accent-fg)]" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-text-primary">
                    {t("recentActivity")}
                  </h2>
                  <p className="text-text-muted">{t("recentActivityDesc")}</p>
                </div>
              </div>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                {stats.groups === 0 ? (
                  <div className="text-center py-8">
                    <div className="p-4 bg-[var(--color-icon-primary-bg)] rounded-2xl mx-auto w-fit mb-4">
                      <Users className="w-8 h-8 text-[var(--color-icon-primary-fg)]" />
                    </div>
                    <p className="text-text-muted mb-4">{t("noGroups")}</p>
                    <Button
                      variant="primary"
                      onClick={() => router.push('/groups')}
                      className="mx-auto"
                    >
                      {t("createGroup")}
                    </Button>
                  </div>
                ) : (
                  <>
                    {stats.pendingTasks > 0 && (
                      <div className={`flex items-center gap-4 p-4 ${colorRoleClasses.statusWarningSoft} rounded-xl`}>
                        <div className="p-2 bg-[var(--color-icon-warning-bg)] rounded-lg shadow-sm">
                          <Bell className="w-5 h-5 text-[var(--color-icon-warning-fg)]" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-text-primary">
                            {t("pendingInvitations")}
                          </p>
                          <p className="text-sm text-text-muted">
                            {stats.pendingTasks} {t("invitations")}
                          </p>
                        </div>
                        <div className="text-end">
                          <Button
                            variant="warning"
                            size="sm"
                            onClick={() =>
                              router.push('/invitations')
                            }
                          >
                            {t("viewAll")}
                          </Button>
                        </div>
                      </div>
                    )}

                    {stats.lists > 0 && (
                      <div className={`flex items-center gap-4 p-4 ${colorRoleClasses.statusSuccessSoft} rounded-xl`}>
                        <div className="p-2 bg-[var(--color-icon-success-bg)] rounded-lg shadow-sm">
                          <ShoppingCart className="w-5 h-5 text-[var(--color-icon-success-fg)]" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-text-primary">
                            {t("totalLists")}
                          </p>
                          <p className="text-sm text-text-muted">
                            {stats.lists} {t("lists")}
                          </p>
                        </div>
                        <div className="text-end">
                          <span className="text-sm text-text-muted">
                            {stats.completedLists} {t("completed")}
                          </span>
                        </div>
                      </div>
                    )}

                    {stats.groups > 0 && (
                      <div className={`flex items-center gap-4 p-4 ${colorRoleClasses.statusSecondarySoft} rounded-xl`}>
                        <div className="p-2 bg-[var(--color-icon-secondary-bg)] rounded-lg shadow-sm">
                          <Users className="w-5 h-5 text-[var(--color-icon-secondary-fg)]" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-text-primary">
                            {t("totalGroups")}
                          </p>
                          <p className="text-sm text-text-muted">
                            {stats.groups} {t("groups")}
                          </p>
                        </div>
                        <div className="text-end">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => router.push('/groups')}
                          >
                            {t("manage")}
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
