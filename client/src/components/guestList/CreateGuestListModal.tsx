"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { ShoppingCart } from "lucide-react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useModalScrollLock } from "../../hooks/useModalScrollLock";
import { Button, Dropdown, Input, TextArea, Modal } from "../common";
import { useGuestListsStore } from "../../store/guestListsStore";
import { GUEST_LIMITS } from "../../constants/guestLimits";

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
  const { createList, getListsCount } = useGuestListsStore();

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
        alert(`מקסימום ${GUEST_LIMITS.MAX_LISTS} רשימות במצב אורח`);
        return;
      }
      
      if (getListsCount() >= GUEST_LIMITS.MAX_LIST_WARNING) {
        const confirm = window.confirm(
          `אתה קרוב למגבלה! מקסימום ${GUEST_LIMITS.MAX_LISTS} רשימות. האם להמשיך?`
        );
        if (!confirm) return;
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
        alert(error.message);
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
    <Modal
      title={t("newGuestList") || "רשימה חדשה"}
      onClose={handleClose}
      iconHeader={
        <div className="p-2 bg-primary-500 rounded-full">
          <ShoppingCart className="w-5 h-5 text-text-primary" />
        </div>
      }
      subtitle={t("willBeSavedLocally") || "רשימה מקומית - יישמר רק במכשיר זה"}
      size="md"
      isLoading={isSubmitting}
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        <Input
          {...register("title", {
            required: t("titleRequired") || "שם הרשימה נדרש",
            maxLength: {
              value: 100,
              message: t("titleMaxLength") || "שם הרשימה לא יכול להיות יותר מ-100 תווים",
            },
          })}
          type="text"
          placeholder={t("listNamePlaceholder") || "לדוגמה: קניות שבוע"}
          error={errors.title?.message}
          label={`${t("listName") || "שם הרשימה"} *`}
        />

        <TextArea
          {...register("description")}
          placeholder={t("descriptionPlaceholder") || "תיאור (אופציונלי)"}
          error={errors.description?.message}
          label={t("description") || "תיאור"}
          rows={3}
        />

        <div className="grid grid-cols-2 gap-4">
          <Dropdown
            {...register("priority")}
            label={t("priority") || "עדיפות"}
            options={[
              { value: "low", label: t("priorityLow") || "נמוכה" },
              { value: "medium", label: t("priorityMedium") || "בינונית" },
              { value: "high", label: t("priorityHigh") || "גבוהה" },
            ]}
            value={watch("priority") || "medium"}
            onSelect={(value) => setValue("priority", value as "low" | "medium" | "high")}
          />

          <Dropdown
            {...register("status")}
            label={t("status") || "סטטוס"}
            options={[
              { value: "active", label: t("statusActive") || "פעיל" },
              { value: "completed", label: t("statusCompleted") || "הושלם" },
              { value: "archived", label: t("statusArchived") || "בארכיון" },
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
            {t("cancel") || "ביטול"}
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={isSubmitting}
            fullWidth
          >
            {isSubmitting ? t("creating") || "יוצר..." : t("createList") || "צור רשימה"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
