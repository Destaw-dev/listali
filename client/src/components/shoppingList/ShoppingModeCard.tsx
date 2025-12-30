"use client";

import { Button } from "../common";
import {
  usePauseShopping,
  useResumeShopping,
  useStartShopping,
  useStopShopping,
} from "../../hooks/useShoppingModeQueries";
import { useAuthStore } from "../../store/authStore";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { IShoppingSessionData } from "../../types";

interface ShoppingModeCardProps {
  listId: string;
  groupId: string;
  shoppingSession?: IShoppingSessionData;
  totalItems: number;
  purchasedItems: number;
}
 

const useShoppingSessionActions = (listId: string) => {
  const queryClient = useQueryClient();
  const startShoppingMutation = useStartShopping();
  const stopShoppingMutation = useStopShopping();
  const pauseShoppingMutation = usePauseShopping();
  const resumeShoppingMutation = useResumeShopping();

  const getLatestSession = (): IShoppingSessionData['currentUserSession'] => {
    const unifiedData = queryClient.getQueryData<{ shoppingSession?: IShoppingSessionData }>([
      "shopping-lists",
      "full-data",
      listId,
    ]);
    return unifiedData?.shoppingSession?.currentUserSession || null;
  };

  const createSessionActionHandler = (
    mutation: typeof stopShoppingMutation | typeof pauseShoppingMutation | typeof resumeShoppingMutation,
    actionName: string
  ) => {
    return async () => {
      const latestSession = getLatestSession();

      if (!latestSession?._id) {
        console.warn(
          `⚠️ handle${actionName}Shopping called without valid session - attempting to proceed gracefully.`
        );
        return;
      }
      
      try {
        await mutation.mutateAsync({
          sessionId: latestSession._id,
          listId,
        });
      } catch (error) {
        console.error(`❌ Failed to ${actionName.toLowerCase()} shopping:`, error);
      }
    };
  };

  const handleStopShopping = createSessionActionHandler(stopShoppingMutation, "Stop");
  const handlePauseShopping = createSessionActionHandler(pauseShoppingMutation, "Pause");
  const handleResumeShopping = createSessionActionHandler(resumeShoppingMutation, "Resume");

  const handleStartShopping = async (groupId: string) => {
    const user = useAuthStore.getState().user;

    if (!user?._id) {
      console.error("❌ No user ID available");
      return;
    }

    try {
      await startShoppingMutation.mutateAsync({ listId, groupId });
    } catch (error) {
      console.error("❌ Failed to start shopping:", error);
    }
  };

  const isAnyMutationPending =
    startShoppingMutation.isPending ||
    stopShoppingMutation.isPending ||
    pauseShoppingMutation.isPending ||
    resumeShoppingMutation.isPending;

  return {
    handleStartShopping,
    handleStopShopping,
    handlePauseShopping,
    handleResumeShopping,
    isAnyMutationPending,
    startShoppingMutation,
    stopShoppingMutation,
    pauseShoppingMutation,
    resumeShoppingMutation,
  };
};

export function ShoppingModeCard({
  listId,
  groupId,
  shoppingSession,
  totalItems,
  purchasedItems,
}: ShoppingModeCardProps) {
  const t = useTranslations("ShoppingListPage.shoppingMode");

  const currentSession = shoppingSession?.currentUserSession || null;
  const activeSessions = shoppingSession?.activeSessions || [];
  
  const {
    handleStartShopping: start,
    handleStopShopping,
    handlePauseShopping,
    handleResumeShopping,
    isAnyMutationPending: isLoading,
    startShoppingMutation,
    stopShoppingMutation,
    pauseShoppingMutation,
    resumeShoppingMutation,
  } = useShoppingSessionActions(listId);

  const handleStartShopping = () => start(groupId);

  const remainingItems = useMemo(() => {
    return Math.max(totalItems - purchasedItems, 0);
  }, [totalItems, purchasedItems]);
  
  if (!currentSession) {
    return (
      <section className="overflow-hidden rounded-3xl bg-gradient-to-r from-accentT-50 to-accentT-100 p-6 text-text-on-primary shadow-xl">
        <div className=" inset-0 bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.18),_transparent_55%)]" />
        <div className=" z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-lg font-semibold">
              {t("title")}
            </h3>
            <p className="mt-1 text-sm text-text-on-primary opacity-80">
              {t("startMessage")}
            </p>
          </div>
          <div className="flex flex-col items-start gap-3 md:flex-row md:items-center">
            <div className="text-sm">
              <span className="font-medium">{t("totalItems")}:</span>{" "}
              {totalItems}
            </div>
            <Button
              onClick={handleStartShopping}
              disabled={isLoading || remainingItems === 0}
              loading={startShoppingMutation.isPending}
              className="bg-card text-primaryT-600 shadow-lg hover:bg-card"
            >
              {startShoppingMutation.isPending
                ? t("starting")
                : t("start")}
            </Button>
          </div>
        </div>
        {activeSessions && activeSessions.length > 0 && (
          <div className="relative z-10 mt-4 text-sm text-text-on-primary opacity-80">
            {t("activeShoppers", { count: activeSessions.length })}
          </div>
        )}
      </section>
    );
  }

  const isPaused = currentSession.status === "paused";

  return (
    <section
      className={`rounded-3xl bg-card p-6 shadow-xl transition ${
        isLoading ? "opacity-60" : ""
      }`}
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-text-primary">
            {isPaused ? t("pausedTitle") : t("activeTitle")}
          </h3>
          <p className="mt-1 text-sm text-text-muted">
            {t("status")}: {isPaused ? t("paused") : t("active")}
          </p>
          <p className="mt-1 text-xs text-text-muted">
            {t("startedAt")}:{" "}
            <span suppressHydrationWarning>
              {new Date(currentSession.startedAt).toLocaleTimeString("he-IL")}
            </span>
          </p>
        </div>

        <div className="flex flex-col gap-3 md:min-w-[320px]">
          {/* ... (Shopping Stats Grid - unchanged) */}
          <div className="grid grid-cols-3 gap-2 text-center text-sm text-text-secondary">
            <div className="rounded-xl bg-surface py-3 shadow-inner">
              <div className="text-xs text-text-muted">
                {t("totalItems")}
              </div>
              <div className="text-lg font-semibold text-text-primary">
                {totalItems}
              </div>
            </div>
            <div className="rounded-xl bg-surface py-3 shadow-inner">
              <div className="text-xs text-text-muted">
                {t("itemsPurchased")}
              </div>
              <div className="text-lg font-semibold text-success-600">
                {purchasedItems}
              </div>
            </div>
            <div className="rounded-xl bg-surface py-3 shadow-inner">
              <div className="text-xs text-text-muted">
                {t("remaining")}
              </div>
              <div className="text-lg font-semibold text-warning-600">
                {remainingItems}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 md:flex-row">
            {isPaused ? (
              <>
                <Button
                  onClick={handleResumeShopping}
                  disabled={isLoading}
                  loading={resumeShoppingMutation.isPending}
                  className="flex-1"
                >
                  {resumeShoppingMutation.isPending
                    ? t("resuming")
                    : t("resume")}
                </Button>
                <Button
                  onClick={handleStopShopping}
                  disabled={isLoading}
                  loading={stopShoppingMutation.isPending}
                  variant="destructive"
                  className="flex-1"
                >
                  {stopShoppingMutation.isPending
                    ? t("stopping")
                    : t("finish")}
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={handlePauseShopping}
                  disabled={isLoading}
                  loading={pauseShoppingMutation.isPending}
                  variant="outline"
                  className="flex-1"
                >
                  {pauseShoppingMutation.isPending
                    ? t("pausing")
                    : t("pause")}
                </Button>
                <Button
                  onClick={handleStopShopping}
                  disabled={isLoading}
                  loading={stopShoppingMutation.isPending}
                  variant="destructive"
                  className="flex-1"
                >
                  {stopShoppingMutation.isPending
                    ? t("stopping")
                    : t("finish")}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {activeSessions && activeSessions.length > 1 && (
        <div className="mt-4 rounded-2xl bg-surface px-4 py-3 text-sm text-text-muted">
          {t("otherActive", { count: activeSessions.length - 1 })}
        </div>
      )}
    </section>
  );
}