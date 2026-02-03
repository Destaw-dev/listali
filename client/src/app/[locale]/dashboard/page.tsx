"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
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
import { useGuestListsStore } from "../../../store/guestListsStore";
import { useDashboard } from "../../../hooks/useDashboard";
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  Badge,
} from "../../../components/common";
import { ArrowIcon } from "../../../components/common/Arrow";
import { IAchievement } from "../../../types";
import { useRequireAuth } from "../../../hooks/useRequireAuth";
import { CreateGuestListModal } from "../../../components/guestList/CreateGuestListModal";
import { StorageWarningModal } from "../../../components/guestList/StorageWarningModal";
import { useStorageMonitor } from "../../../hooks/useStorageMonitor";

export default function DashboardPage() {
  const router = useRouter();
  const params = useParams();
  const t = useTranslations("Dashboard");
  const locale = (params?.locale as string) || "he";
  const { user, isGuest } = useAuthStore();
  const { lists: guestLists } = useGuestListsStore();
  const { requireAuth, RequireAuthModal } = useRequireAuth();
  const [showCreateGuestListModal, setShowCreateGuestListModal] =
    useState(false);
  const { shouldWarn, checkStorage } = useStorageMonitor();
  const [showStorageWarning, setShowStorageWarning] = useState(false);

  const { isInitialized } = useAuthRedirect({
    redirectTo: `/${locale}/welcome`,
    requireAuth: true,
  });

  const { data: dashboardData } = useDashboard();

  useEffect(() => {
    if (shouldWarn && !showStorageWarning) {
      setShowStorageWarning(true);
    }
  }, [shouldWarn, showStorageWarning]);

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-secondary-50 to-accent-50  flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent mx-auto mb-6"></div>
            <div className="absolute inset-0 rounded-full border-4 border-secondary/30 animate-pulse"></div>
          </div>
          <p className="text-lg font-medium text-text-primary animate-pulse">
            {t("loading")}
          </p>
        </div>
      </div>
    );
  }

  if (isGuest()) {
    const totalGuestItems = guestLists.reduce(
      (sum, list) => sum + list.items.length,
      0
    );
    const checkedGuestItems = guestLists.reduce(
      (sum, list) => sum + list.items.filter((item) => item.checked).length,
      0
    );

    return (
      <div className="min-h-screen bg-surface">
        {RequireAuthModal}
        <CreateGuestListModal
          isOpen={showCreateGuestListModal}
          onClose={() => setShowCreateGuestListModal(false)}
        />
        <StorageWarningModal
          isOpen={showStorageWarning}
          onClose={() => {
            setShowStorageWarning(false);
            checkStorage();
          }}
        />
        <div className="container mx-auto px-4 py-8 relative z-10">
          <div className="max-w-7xl mx-auto space-y-8">
            <Card variant="glass" className="shadow-2xl bg-card">
              <CardBody className="p-1 sm:p-8">
                <div className="flex sm:items-center justify-between flex-col md:flex-row gap-3">
                  <div>
                    <h1 className="text-4xl font-bold text-text-primary mb-2">
                      {t("welcome")} 🎉
                    </h1>
                    <p className="text-xl text-secondary font-medium mb-1">
                      {t("guestMode") || "מצב אורח"}
                    </p>
                    <p className="text-sm text-text-muted">
                      {t("guestModeDesc") ||
                        "רשימות מקומיות - התחבר כדי לשמור ולשתף"}
                    </p>
                  </div>
                  <Button
                    variant="primary"
                    onClick={() => {
                      if (!requireAuth("login")) {
                      }
                    }}
                  >
                    {t("login") || "התחבר"}
                  </Button>
                </div>
              </CardBody>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card hover className="bg-card">
                <CardBody className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-gradient-to-br from-secondary-700 to-secondary-700 rounded-2xl shadow-lg">
                      <ShoppingCart className="w-6 h-6 text-text-primary" />
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-text-muted">
                        {t("totalLists")}
                      </p>
                      <p className="text-2xl font-bold text-secondary">
                        {guestLists.length}
                      </p>
                    </div>
                  </div>
                </CardBody>
              </Card>

              <Card hover className="bg-card">
                <CardBody className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-gradient-to-br from-success-400 to-success-600 rounded-2xl shadow-lg">
                      <Activity className="w-6 h-6 text-text-primary" />
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-text-muted">
                        {t("checkedItems") || "פריטים מסומנים"}
                      </p>
                      <p className="text-2xl font-bold text-success">
                        {checkedGuestItems}
                      </p>
                    </div>
                  </div>
                </CardBody>
              </Card>

              <Card hover className="bg-card">
                <CardBody className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-gradient-to-br from-info-400 to-info-600 rounded-2xl shadow-lg">
                      <ShoppingCart className="w-6 h-6 text-text-primary" />
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-text-muted">
                        {t("totalItems")}
                      </p>
                      <p className="text-2xl font-bold text-info-600">
                        {totalGuestItems}
                      </p>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </div>

            <Card variant="glass" className="bg-surface/80 shadow-2xl">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-lg">
                    <ShoppingCart className="w-5 h-5 text-text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-text-primary">
                      {t("myLists") || "הרשימות שלי"}
                    </h2>
                    <p className="text-text-muted">
                      {t("guestListsDesc") ||
                        "רשימות מקומיות - יישמרו רק במכשיר זה"}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardBody>
                {guestLists.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="p-4 bg-gradient-to-br from-primary-100 to-primary-200 rounded-2xl mx-auto w-fit mb-4">
                      <ShoppingCart className="w-8 h-8 text-primary-600" />
                    </div>
                    <p className="text-text-muted mb-4">
                      {t("noGuestLists") ||
                        "אין לך רשימות מקומיות. התחבר כדי ליצור רשימות משותפות!"}
                    </p>
                    <Button
                      variant="primary"
                      onClick={() => setShowCreateGuestListModal(true)}
                      className="mx-auto"
                    >
                      {t("createList") || "צור רשימה"}
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {guestLists.map((list) => (
                      <Card
                        key={list.id}
                        variant="glass"
                        hover
                        className="cursor-pointer shadow-lg hover:shadow-xl transition-all duration-300"
                        onClick={() =>
                          router.push(`/${locale}/guest-lists/${list.id}`)
                        }
                      >
                        <CardBody className="p-4">
                          <h3 className="text-lg font-semibold text-text-primary mb-2">
                            {list.title}
                          </h3>
                          <p className="text-sm text-text-muted mb-4">
                            {list.items.length} {t("items") || "פריטים"}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-text-muted">
                              {list.items.filter((i) => i.checked).length}/
                              {list.items.length} {t("checked") || "מסומן"}
                            </span>
                            <Badge variant="secondary" size="sm">
                              {t("local") || "מקומי"}
                            </Badge>
                          </div>
                        </CardBody>
                      </Card>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    );
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
    lastActive: "לא ידוע",
    online: false,
  };

  const quickActions = [
    // {
    //   title: t('createGroup'),
    //   description: t('createGroupDesc'),
    //   icon: Users,
    //   action: () => router.push(`/${locale}/groups`),
    //   variant: 'primary' as const,
    //   gradient: 'from-primary-500 to-primary-600',
    //   bgGradient: 'from-primary-50 to-primary-100'
    // },
    {
      title: `צור/${t("joinGroup")}`,
      description: t("joinGroupDesc"),
      icon: Plus,
      action: () => router.push(`/${locale}/groups`),
      variant: "secondary" as const,
      gradient: "from-secondary-500 to-secondary-600",
      bgGradient: "from-secondary-300 to-secondary-400",
    },
    {
      title: t("viewInvitations"),
      description: t("viewInvitationsDesc"),
      icon: Bell,
      action: () => router.push(`/${locale}/invitations`),
      variant: "accent" as const,
      gradient: "from-accent-500 to-accent-600",
      bgGradient: "from-accent-300 to-accent-400",
    },
  ];

  const achievementIcons = {
    first_group: Award,
    shopping_master: Target,
    group_player: Users,
  };

  return (
    <div className="min-h-screen  bg-surface">
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
                        className="w-14 h-14 sm:w-24 sm:h-24 rounded-full border-4 border-white shadow-xl object-cover"
                      />
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-3 mb-3 bg-gradient-to-br from-primary-600 to-secondary-600 rounded-lg p-2">
                      <h1 className="text-4xl font-bold  text-text-primary">
                        {t("welcome")} 🎉
                      </h1>
                    </div>
                    <p className="text-xl text-secondary font-medium mb-1">
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
                  <div className="p-3 bg-gradient-to-br from-primary-400 to-primary-600 rounded-2xl shadow-lg">
                    <Users className="w-6 h-6 text-text-primary" />
                  </div>
                  <div className="text-right">
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
                  <div className="p-3 bg-gradient-to-br from-secondary-700 to-secondary-700 rounded-2xl shadow-lg">
                    <ShoppingCart className="w-6 h-6 text-text-primary" />
                  </div>
                  <div className="text-right">
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
                  <div className="p-3 bg-gradient-to-br from-accent-700 to-accent-700 rounded-2xl shadow-lg">
                    <Target className="w-6 h-6 text-text-primary" />
                  </div>
                  <div className="text-right">
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
                  <div className="p-3 bg-gradient-to-br from-warning-400 to-warning-600 rounded-2xl shadow-lg">
                    <ShoppingCart className="w-6 h-6 text-text-primary" />
                  </div>
                  <div className="text-right">
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
                  <div className="p-3 bg-gradient-to-br from-success-400 to-success-600 rounded-2xl shadow-lg">
                    <Activity className="w-6 h-6 text-text-primary" />
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-text-muted">
                      {t("remainingItems")}
                    </p>
                    <p className="text-2xl font-bold text-success">
                      {stats.remainingItems}
                    </p>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div
                    className="bg-gradient-to-r from-success-400 to-success-600 h-2 rounded-full"
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
                  <div className="p-3 bg-gradient-to-br from-info-400 to-info-600 rounded-2xl shadow-lg">
                    <ShoppingCart className="w-6 h-6 text-text-primary" />
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-text-muted">
                      {t("totalItems")}
                    </p>
                    <p className="text-2xl font-bold text-info-600">
                      {stats.totalItems}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-info-600" />
                  <span className="text-sm font-medium text-info-600">
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
                    <div className="p-2 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-lg">
                      <Sparkles className="w-5 h-5 text-text-primary" />
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
                              className={`p-4 rounded-2xl mb-4 inline-block bg-gradient-to-br ${action.bgGradient} shadow-lg`}
                            >
                              <Icon className={`w-8 h-8 text-text-primary`} />
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
                    <div className="p-2 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg">
                      <Award className="w-5 h-5 text-text-primary" />
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
                            className="flex items-center gap-4 p-4 bg-gradient-to-r from-surface/50 to-surface/30 rounded-xl"
                          >
                            <div className="p-2 bg-surface-50 rounded-lg">
                              <Icon
                                className={`w-5 h-5 ${
                                  achievement.unlocked
                                    ? "text-warning-500"
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
                                <div className="w-full bg-info-100 rounded-full h-2">
                                  <div
                                    className="bg-gradient-to-r from-yellow-400 to-orange-400 h-2 rounded-full transition-all duration-300"
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
                              <div className="w-3 h-3 bg-gradient-to-r from-warning-500 to-warning-600 rounded-full"></div>
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

          <Card variant="glass" className="bg-white/80 shadow-2xl">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-accent-500 to-purple-500 rounded-lg">
                  <Activity className="w-5 h-5 text-text-primary" />
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
                    <div className="p-4 bg-gradient-to-br from-primary-100 to-primary-200 rounded-2xl mx-auto w-fit mb-4">
                      <Users className="w-8 h-8 text-text-primary-600" />
                    </div>
                    <p className="text-text-muted mb-4">{t("noGroups")}</p>
                    <Button
                      variant="primary"
                      onClick={() => router.push(`/${locale}/groups`)}
                      className="mx-auto"
                    >
                      {t("createGroup")}
                    </Button>
                  </div>
                ) : (
                  <>
                    {stats.pendingTasks > 0 && (
                      <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-warning-50/50 to-warning-100/30 rounded-xl">
                        <div className="p-2 bg-gradient-to-br from-warning-400 to-warning-600 rounded-lg shadow-lg">
                          <Bell className="w-5 h-5 text-text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-text-primary">
                            {t("pendingInvitations")}
                          </p>
                          <p className="text-sm text-text-muted">
                            {stats.pendingTasks} {t("invitations")}
                          </p>
                        </div>
                        <div className="text-right">
                          <Button
                            variant="warning"
                            size="sm"
                            onClick={() =>
                              router.push(`/${locale}/invitations`)
                            }
                          >
                            {t("viewAll")}
                          </Button>
                        </div>
                      </div>
                    )}

                    {stats.lists > 0 && (
                      <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-success-50/50 to-success-100/30 rounded-xl">
                        <div className="p-2 bg-gradient-to-br from-success-400 to-success-600 rounded-lg shadow-lg">
                          <ShoppingCart className="w-5 h-5 text-text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-text-primary">
                            {t("totalLists")}
                          </p>
                          <p className="text-sm text-text-muted">
                            {stats.lists} {t("lists")}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-sm text-text-muted">
                            {stats.completedLists} {t("completed")}
                          </span>
                        </div>
                      </div>
                    )}

                    {stats.groups > 0 && (
                      <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-secondary-50/50 to-secondary-100/30 rounded-xl">
                        <div className="p-2 bg-gradient-to-br from-secondary-400 to-secondary-600 rounded-lg shadow-lg">
                          <Users className="w-5 h-5 text-text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-text-primary">
                            {t("totalGroups")}
                          </p>
                          <p className="text-sm text-text-muted">
                            {stats.groups} {t("groups")}
                          </p>
                        </div>
                        <div className="text-right">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => router.push(`/${locale}/groups`)}
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
