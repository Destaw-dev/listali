"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "../../../i18n/navigation";
import {
  ShoppingCart,
  ClipboardList,
  Users,
  Bell,
  Plus,
  ShoppingBag,
  Activity,
} from "lucide-react";
import { useAuthRedirect } from "../../../hooks/useAuthRedirect";
import { useAuthStore } from "../../../store/authStore";
import {
  useDashboard,
  MemberSummary,
  ActiveList,
  GroupSummary,
  RecentActivity,
} from "../../../hooks/useDashboard";
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  LoadingState,
} from "../../../components/common";

// ── helpers ──────────────────────────────────────────────────────────────────

type TFn = ReturnType<typeof useTranslations<"Dashboard">>;

function timeAgo(timestamp: string, t: TFn): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return t("justNow");
  if (minutes < 60) return t("timeAgoMinutes", { count: minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t("timeAgoHours", { count: hours });
  const days = Math.floor(hours / 24);
  return t("timeAgoDays", { count: days });
}

function AvatarStack({ members }: { members: MemberSummary[] }) {
  if (!members.length) return null;
  return (
    <div className="flex -space-x-2 rtl:space-x-reverse">
      {members.slice(0, 4).map((m) => (
        <div
          key={m.id}
          title={m.username}
          className="w-7 h-7 rounded-full border-2 border-card bg-[var(--color-icon-primary-bg)] flex items-center justify-center text-[10px] font-bold text-[var(--color-icon-primary-fg)]"
        >
          {m.username.charAt(0).toUpperCase()}
        </div>
      ))}
    </div>
  );
}

// ── sub-sections ─────────────────────────────────────────────────────────────

function ActiveListCard({
  list,
  onClick,
}: {
  list: ActiveList;
  onClick: () => void;
}) {
  const progress =
    list.totalItems > 0
      ? Math.round(
          ((list.totalItems - list.remainingItems) / list.totalItems) * 100
        )
      : 0;

  const t = useTranslations("Dashboard");
  const progressColor = progress >= 70 ? "bg-green-400" : "bg-primary-400";
  console.log({progressColor, progress, list});

  return (
    <Card
      hover
      onClick={onClick}
      className="cursor-pointer bg-card transition-all duration-200 border-s-[3px] border-s-primary"
    >
      <CardBody className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="min-w-0 flex-1">
            <p className="font-bold text-text-primary text-base truncate">
              {list.name}
            </p>
            <p className="text-sm text-text-muted truncate">{list.groupName}</p>
          </div>
          <div className="p-2 bg-[var(--color-icon-primary-bg)] rounded-xl ms-3 shrink-0">
            <ShoppingBag className="w-4 h-4 text-[var(--color-icon-primary-fg)]" />
          </div>
        </div>

        {/* Progress */}
        <div className="mb-3">
          <div className="flex justify-between text-xs text-text-muted mb-1.5">
            <span>{list.remainingItems} {t("remaining")}</span>
            <span className="font-medium">{progress}%</span>
          </div>
          <div className="w-full bg-border-light rounded-full h-2">
            <div
              className={`${progressColor} h-2 rounded-full transition-all duration-500`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <AvatarStack members={list.members} />
          <span className="text-xs text-text-muted">
            {list.totalItems} {t("items")}
          </span>
        </div>
      </CardBody>
    </Card>
  );
}

function ActivityItem({ activity }: { activity: RecentActivity }) {
  const t = useTranslations("Dashboard");
  const isItemUpdate = activity.type === "item_update";
  const Icon = isItemUpdate ? ShoppingCart : ClipboardList;

  return (
    <div className="flex items-start gap-3 py-3 border-b border-border-light last:border-0">
      <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${isItemUpdate ? "bg-[var(--color-icon-primary-bg)]" : "bg-[var(--color-icon-secondary-bg)]"}`}>
        <Icon className={`w-4 h-4 ${isItemUpdate ? "text-[var(--color-icon-primary-fg)]" : "text-[var(--color-icon-secondary-fg)]"}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-text-primary leading-snug">
          {activity.description}
        </p>
        <p className="text-xs text-text-muted mt-0.5">
          {activity.groupName && (
            <span className="font-medium">{activity.groupName} · </span>
          )}
          {timeAgo(activity.timestamp, t)}
        </p>
      </div>
    </div>
  );
}

function GroupItem({
  group,
  onManage,
}: {
  group: GroupSummary;
  onManage: () => void;
}) {
  const t = useTranslations("Dashboard");
  return (
    <div className="flex items-center gap-3 py-3 border-b border-border-light last:border-0">
      <div className="p-2 bg-[var(--color-icon-secondary-bg)] rounded-xl shrink-0">
        <Users className="w-4 h-4 text-[var(--color-icon-secondary-fg)]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-text-primary text-sm truncate">{group.name}</p>
        <div className="flex items-center gap-2 mt-1">
          <AvatarStack members={group.members} />
          <span className="text-xs text-text-muted">
            {group.activeListsCount} {t("activeLists")}
          </span>
        </div>
      </div>
      <Button variant="outline" size="sm" onClick={onManage}>
        {t("manage")}
      </Button>
    </div>
  );
}

// ── page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter();
  const t = useTranslations("Dashboard");
  const { user } = useAuthStore();

  const { safeToShow } = useAuthRedirect({
    redirectTo: "/welcome",
    requireAuth: true,
  });

  const { data: dashboardData } = useDashboard();

  if (!safeToShow) {
    return <LoadingState variant="page" size="lg" message={t("loading")} />;
  }

  const activeLists = dashboardData?.activeLists || [];
  const groups = dashboardData?.groups || [];
  const recentActivity = dashboardData?.recentActivity || [];
  const pendingInvitations = dashboardData?.pendingInvitations || 0;

  const displayName =
    user?.firstName || user?.username || "";

  return (
    <div className="min-h-screen bg-surface">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto space-y-6">

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-text-primary">
                {t("welcome")}{displayName ? ` ${displayName}` : ""}
              </h1>
              <p className="text-sm text-text-muted mt-0.5">
                {activeLists.length > 0
                  ? `${activeLists.length} ${t("activeLists")}`
                  : t("noActiveListsNow")}
              </p>
            </div>
            {pendingInvitations > 0 && (
              <button
                onClick={() => router.push("/invitations")}
                className="flex items-center gap-2 px-3 py-2 bg-[var(--color-icon-warning-bg)] rounded-xl hover:opacity-80 transition-opacity"
              >
                <Bell className="w-4 h-4 text-[var(--color-icon-warning-fg)]" />
                <span className="text-sm font-medium text-[var(--color-icon-warning-fg)]">
                  {pendingInvitations} {t("invitations")}
                </span>
              </button>
            )}
          </div>

          <section>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-text-muted" />
                <h2 className="font-semibold text-text-primary">
                  {t("activeLists")}
                </h2>
              </div>
              {activeLists.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push("/groups")}
                >
                  {t("viewAll")}
                </Button>
              )}
            </div>

            {activeLists.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeLists.map((list) => (
                  <ActiveListCard
                    key={list.id}
                    list={list}
                    onClick={() =>
                      router.push(`/groups/${list.groupId}/${list.id}`)
                    }
                  />
                ))}
              </div>
            ) : (
              <Card className="bg-card">
                <CardBody className="py-10 flex flex-col items-center gap-3 text-center">
                  <div className="p-4 bg-[var(--color-icon-primary-bg)] rounded-2xl">
                    <ShoppingCart className="w-8 h-8 text-[var(--color-icon-primary-fg)]" />
                  </div>
                  <p className="text-text-muted">{t("noActiveLists")}</p>
                  <Button
                    variant="primary"
                    size="sm"
                    icon={<Plus className="w-4 h-4" />}
                    onClick={() => router.push("/groups")}
                  >
                    {t("goShopping")}
                  </Button>
                </CardBody>
              </Card>
            )}
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            <div className="order-1 lg:order-2">
              <Card className="bg-card">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-[var(--color-icon-secondary-fg)]" />
                      <h2 className="font-semibold text-text-primary">
                        {t("myGroups")}
                      </h2>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push("/groups")}
                    >
                      {t("viewAll")}
                    </Button>
                  </div>
                </CardHeader>
                <CardBody className="pt-0">
                  {groups.length > 0 ? (
                    groups.slice(0, 5).map((group) => (
                      <GroupItem
                        key={group.id}
                        group={group}
                        onManage={() => router.push(`/groups/${group.id}`)}
                      />
                    ))
                  ) : (
                    <div className="py-6 text-center">
                      <p className="text-sm text-text-muted mb-3">
                        {t("noGroups")}
                      </p>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => router.push("/groups")}
                      >
                        {t("createGroup")}
                      </Button>
                    </div>
                  )}
                </CardBody>
              </Card>
            </div>

            <div className="order-2 lg:order-1 lg:col-span-2">
              <Card className="bg-card">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-[var(--color-icon-accent-fg)]" />
                    <h2 className="font-semibold text-text-primary">
                      {t("recentActivity")}
                    </h2>
                  </div>
                </CardHeader>
                <CardBody className="pt-0">
                  {recentActivity.length > 0 ? (
                    recentActivity.slice(0, 7).map((activity) => (
                      <ActivityItem key={activity.id} activity={activity} />
                    ))
                  ) : (
                    <p className="text-sm text-text-muted py-6 text-center">
                      {t("noActivity")}
                    </p>
                  )}
                </CardBody>
              </Card>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
