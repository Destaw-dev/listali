"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Calendar } from "lucide-react";
import { useModalScrollLock } from "../../hooks/useModalScrollLock";
import { Button, Dropdown, Input, TextArea, Modal } from "../common";
import { createListSchema } from "../../lib/schemas";

type CreateListFormData = {
  name: string;
  description?: string;
  priority?: "low" | "medium" | "high";
  dueDate?: string;
  tags?: string[];
};

interface CreateShoppingListModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateListFormData) => Promise<void>;
  groupId: string;
  groupName?: string;
}

export function CreateShoppingListModal({
  isOpen,
  onClose,
  onSubmit,
  groupName,
}: CreateShoppingListModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const t = useTranslations("CreateShoppingListModal");
  const listSchema = createListSchema(t);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<CreateListFormData>({
    resolver: zodResolver(listSchema),
    defaultValues: {
      name: "",
      description: "",
      priority: "medium",
      dueDate: "",
    },
  });

  const handleFormSubmit = async (data: CreateListFormData) => {
    setIsSubmitting(true);
      await onSubmit({
        ...data,
        tags: tags.length > 0 ? tags : undefined,
      });
      reset();
      setTags([]);
    setIsSubmitting(false);
  };

  const handleClose = () => {
    if (!isSubmitting) {
      reset();
      setTags([]);
      onClose();
    }
  };

  useModalScrollLock(isOpen);

  if (!isOpen) return null;

  return (
    <Modal
      title={t("newShoppingList")}
      onClose={handleClose}
      iconHeader={
        <div className=" p-2 bg-primary-500 rounded-full">
          <Calendar className="w-5 h-5 text-text-primary" />
        </div>
      }
      subtitle={t("willBeCreatedForGroup")}
      size="md"
    >
      {" "}
      {groupName && (
        <div className="mb-4 p-3 bg-primary-50 border border-primary-200 rounded-lg">
          <p className="text-sm text-primary-600">
            {t("willBeCreatedForGroup")}: <strong>{groupName}</strong>
          </p>
        </div>
      )}
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        <Input
          {...register("name")}
          type="text"
          placeholder={t("listNamePlaceholder")}
          error={errors.name?.message}
          label={`${t("listName")} *`}
        />

        <TextArea
          {...register("description")}
          rows={3}
          placeholder={t("descriptionPlaceholder")}
          error={errors.description?.message}
          label={t("description")}
        />

        <Dropdown
          placeholder={t("priority")}
          variant="default"
          size="md"
          label={t("priority")}
          fullWidth
          error={errors.priority?.message}
          options={[
            { value: "low", label: t("priorityLow") },
            { value: "medium", label: t("priorityMedium") },
            { value: "high", label: t("priorityHigh") },
          ]}
          value={watch("priority")}
          onSelect={(value) =>
            register("priority").onChange({
              target: { value: value as "low" | "medium" | "high" },
            })
          }
        />

        <Input
          {...register("dueDate")}
          type="date"
          error={errors.dueDate?.message}
          label={t("dueDate")}
          variant="outlined"
        />

        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            size="lg"
            fullWidth
            onClick={handleClose}
            disabled={isSubmitting}
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
  );
}
