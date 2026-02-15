"use client";

import React, { useCallback, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { ShoppingCart } from "lucide-react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useModalScrollLock } from "../../hooks/useModalScrollLock";
import { Button, ConfirmDialog, Dropdown, Input, TextArea, Modal } from "../common";
import { useGuestListsStore } from "../../store/guestListsStore";
import { GUEST_LIMITS } from "../../constants/guestLimits";
import { useNotification } from "../../contexts/NotificationContext";

const createGuestListSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  status: z.enum(["active", "completed", "archived"]).optional(),
});

type CreateGuestListFormData = z.infer<typeof createGuestListSchema>;

interface CreateGuestListModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CreateGuestListModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateGuestListModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const t = useTranslations("CreateGuestListModal");
  const tCommon = useTranslations("common");
  const { createList, getListsCount } = useGuestListsStore();
  const { showError, showWarning } = useNotification();
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string;
    message: string;
    confirmText?: string;
  } | null>(null);
  const confirmResolverRef = useRef<((value: boolean) => void) | null>(null);

  const requestConfirmation = useCallback(
    (options: { title: string; message: string; confirmText?: string }) =>
      new Promise<boolean>((resolve) => {
        confirmResolverRef.current = resolve;
        setConfirmDialog(options);
      }),
    []
  );

  const closeConfirmation = useCallback((result: boolean) => {
    if (confirmResolverRef.current) {
      confirmResolverRef.current(result);
      confirmResolverRef.current = null;
    }
    setConfirmDialog(null);
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<CreateGuestListFormData>({
    resolver: zodResolver(createGuestListSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: "medium" as "low" | "medium" | "high",
      status: "active" as "active" | "completed" | "archived",
    },
  });

  const handleFormSubmit = async (data: CreateGuestListFormData) => {
    try {
      setIsSubmitting(true);
      
      // Check limits
      if (getListsCount() >= GUEST_LIMITS.MAX_LISTS) {
        showWarning("CreateGuestListModal.maxListsReached", {
          count: `${GUEST_LIMITS.MAX_LISTS}`,
        });
        return;
      }
      
      if (getListsCount() >= GUEST_LIMITS.MAX_LIST_WARNING) {
        const shouldContinue = await requestConfirmation({
          title: tCommon("confirm"),
          message: t("maxListsWarning", { count: GUEST_LIMITS.MAX_LISTS }),
          confirmText: tCommon("confirm"),
        });
        if (!shouldContinue) return;
      }
      
      createList({
        title: data.title.trim().slice(0, 100),
        description: data.description?.trim(),
        priority: data.priority as "low" | "medium" | "high",
        status: data.status as "active" | "completed" | "archived",
      });
      
      reset();
      onClose();
      onSuccess?.();
    } catch (error) {
      console.error("Error creating guest list:", error);
      if (error instanceof Error) {
        showError(error.message);
      } else {
        showError("notifications.unknownError");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      reset();
      onClose();
    }
  };

  useModalScrollLock(isOpen);

  if (!isOpen) return null;

  return (
    <>
      <Modal
        title={t("newGuestList")}
        onClose={handleClose}
        iconHeader={
          <div className="p-2 bg-primary-500 rounded-full">
            <ShoppingCart className="w-5 h-5 text-text-primary" />
          </div>
        }
        subtitle={t("willBeSavedLocally")}
        size="md"
        isLoading={isSubmitting}
      >
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        <Input
          {...register("title", {
            required: t("titleRequired"),
            maxLength: {
              value: 100,
              message: t("titleMaxLength"),
            },
          })}
          type="text"
          placeholder={t("listNamePlaceholder")}
          error={errors.title?.message}
          label={`${t("listName")} *`}
        />

        <TextArea
          {...register("description")}
          placeholder={t("descriptionPlaceholder")}
          error={errors.description?.message}
          label={t("description")}
          rows={3}
        />

        <div className="grid grid-cols-2 gap-4">
          <Dropdown
            {...register("priority")}
            label={t("priority")}
            options={[
              { value: "low", label: t("priorityLow") },
              { value: "medium", label: t("priorityMedium") },
              { value: "high", label: t("priorityHigh") },
            ]}
            value={watch("priority") || "medium"}
            onSelect={(value) => setValue("priority", value as "low" | "medium" | "high")}
          />

          <Dropdown
            {...register("status")}
            label={t("status")}
            options={[
              { value: "active", label: t("statusActive") },
              { value: "completed", label: t("statusCompleted") },
              { value: "archived", label: t("statusArchived") },
            ]}
            value={watch("status") || "active"}
            onSelect={(value) => setValue("status", value as "active" | "completed" | "archived")}
          />
        </div>

        <div className="pt-4 flex gap-3">
          <Button
            type="button"
            variant="secondary"
            size="lg"
            onClick={handleClose}
            disabled={isSubmitting}
            fullWidth
          >
            {t("cancel")}
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={isSubmitting}
            fullWidth
          >
            {isSubmitting ? t("creating") : t("createList")}
          </Button>
        </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(confirmDialog)}
        onClose={() => closeConfirmation(false)}
        onConfirm={() => closeConfirmation(true)}
        title={confirmDialog?.title || ""}
        message={confirmDialog?.message || ""}
        confirmText={confirmDialog?.confirmText || tCommon("confirm")}
        cancelText={tCommon("cancel")}
        variant="warning"
      />
    </>
  );
}
