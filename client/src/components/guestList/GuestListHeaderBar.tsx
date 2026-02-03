"use client";

import { Button } from "../common";
import { cn } from "../../lib/utils";
import { Calendar, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { ArrowIcon } from "../common/Arrow";
import { GuestList } from "../../types";
import { useRequireAuth } from "../../hooks/useRequireAuth";

interface GuestListHeaderBarProps {
  guestList: GuestList;
  locale: string;
  onAddItems: () => void;
}

export function GuestListHeaderBar({
  guestList,
  locale,
  onAddItems,
}: GuestListHeaderBarProps) {
  const router = useRouter();
  const t = useTranslations("ShoppingList");
  const { requireAuth, RequireAuthModal } = useRequireAuth();

  const formattedDate = new Intl.DateTimeFormat(locale ?? "he-IL", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(guestList.updatedAt));

  return (
    <header className="flex flex-col gap-6 rounded-3xl bg-card p-6 shadow-xl">
      {RequireAuthModal}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-4">
          <Button
            onClick={() => router.push(`/${locale}/dashboard`)}
            variant="surface"
            size="md"
            rounded
            aria-label="Back to dashboard"
          >
            <ArrowIcon className="text-text-primary" />
          </Button>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold text-text-primary">
                {guestList?.title}
              </h1>
              {guestList?.priority && (
                <span
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium",
                    "bg-primary-500 text-text-on-primary"
                  )}
                >
                  {guestList.priority === "high"
                    ? "גבוהה"
                    : guestList.priority === "medium"
                    ? "בינונית"
                    : "נמוכה"}
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-text-muted">
              {guestList?.description || t("description")}
            </p>
            <div className="mt-3 flex items-center gap-2 text-xs text-text-muted">
              <Calendar className="h-4 w-4" />
              <span>{formattedDate}</span>
            </div>
          </div>
        </div>
          <Button
            variant="primary"
            onClick={() => {
              if (!requireAuth("login")) {
                // Modal will open
              }
            }}
          >
            {t("login") || "התחבר"}
          </Button>
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          <Button
            onClick={onAddItems}
            icon={<Plus className="h-5 w-5" />}
            className="bg-gradient-to-r from-primary-500 to-secondary-500 px-5 py-2.5 text-text-on-primary shadow-xl transition hover:shadow-2xl"
          >
            {t("addItem")}
          </Button>
        </div>
      </div>

      <div className="lg:hidden">
        <Button
          onClick={onAddItems}
          fullWidth
          icon={<Plus className="h-5 w-5" />}
          className="bg-gradient-to-r from-primary-500 to-secondary-500 py-3 text-text-on-primary shadow-xl transition hover:shadow-2xl"
        >
          {t("addItem")}
        </Button>
      </div>
    </header>
  );
}
