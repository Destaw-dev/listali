"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { User } from "lucide-react";
import { Button, Input, Modal } from "../common";
import { z } from "zod";
import { NotificationType, useNotification } from "../../contexts/NotificationContext";
import { useModalScrollLock } from "../../hooks/useModalScrollLock";
import { createProfileSchema } from "../../lib/schemas";
import { IUser } from "../../types";

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: IUser;
  onSave: (data: {
    firstName: string;
    lastName: string;
    username?: string;
  }) => Promise<void>;
  isLoading?: boolean;
}


export default function EditProfileModal({
  isOpen,
  onClose,
  user,
  onSave,
  isLoading,
}: EditProfileModalProps) {
  const t = useTranslations("settings");
  const profileSchema = createProfileSchema(t);
  type ProfileInput = z.infer<typeof profileSchema>;
  const [formData, setFormData] = useState<ProfileInput>({
    firstName: "",
    lastName: "",
    username: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { showError } = useNotification();


  useEffect(() => {
    if (isOpen) {
      setFormData({
        firstName: user?.firstName || "",
        lastName: user?.lastName || "",
        username: user?.username || "",
      });
      setErrors({});
    }
  }, [isOpen, user]);

  const validateField = (field: keyof ProfileInput, value: string) => {
    try {
      const dataToValidate = { [field]: value };
      
      const fieldSchema = profileSchema.pick({ [field]: true });
      fieldSchema.parse(dataToValidate);
      
      setErrors((prev) => ({ ...prev, [field]: "" }));
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const zodError = error as z.ZodError;
        const errors = zodError.issues || [];
        
        const fieldError = errors.find((e: z.ZodIssue) =>
          e.path && e.path.length > 0 && e.path[0] === field
        );
        
        if (fieldError) {
          setErrors((prev) => ({ ...prev, [field]: fieldError.message }));
        }
      }
      return false;
    }
  };

  const validateForm = () => {
    try {
      const dataToValidate = {
        ...formData,
        username: formData.username || undefined,
      };

      profileSchema.parse(dataToValidate);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        const errors = error.issues || [];
        errors.forEach((err: z.ZodIssue) => {
          if (err.path && err.path.length > 0) {
            const field = err.path[0] as string;
            const errorMessage = err.message.startsWith('Invalid input') 
              ? t('validationError', { message: err.message })
              : err.message;
            newErrors[field] = errorMessage;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      showError(t("pleaseFixErrors"), NotificationType.ERROR);
      return;
    }

      const dataToSave = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        ...(formData.username &&
          formData.username.length > 0 && { username: formData.username }),
      };

      await onSave(dataToSave);

      onClose();
  };

  const handleInputChange = (field: keyof ProfileInput, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    validateField(field, value);
  };

  useModalScrollLock(isOpen);

  if (!isOpen) return null;

  return (
    <Modal
      title={t("editProfile")}
      onClose={onClose}
      iconHeader={<div className=" bg-background-500 rounded-full">
        <User className="w-5 h-5" />
      </div>}
      subtitle={t("editProfileDescription")}
      size="md"
    >
          <form
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            <Input
              label={t("firstName")}
              value={formData.firstName}
              onChange={(e) => handleInputChange("firstName", e.target.value)}
              icon={<User className="w-4 h-4" />}
              error={errors.firstName}
              required
              placeholder={t("firstNamePlaceholder")}
            />

            <Input
              label={t("lastName")}
              value={formData.lastName}
              onChange={(e) => handleInputChange("lastName", e.target.value)}
              icon={<User className="w-4 h-4" />}
              error={errors.lastName}
              required
              placeholder={t("lastNamePlaceholder")}
            />

            <Input
              label={t("username")}
              value={formData.username}
              onChange={(e) => handleInputChange("username", e.target.value)}
              icon={<User className="w-4 h-4" />}
              error={errors.username}
              required
              placeholder={t("usernamePlaceholder")}
            />

            <div className="flex gap-3 pt-4">
              <Button
                variant="ghost"
                onClick={onClose}
                fullWidth
                disabled={isLoading}
                type="button"
              >
                {t("cancel")}
              </Button>
              <Button
                variant="primary"
                type="submit"
                fullWidth
                loading={isLoading}
                disabled={isLoading}
              >
                {isLoading ? t("saving") : t("save")}
              </Button>
            </div>
          </form>
    </Modal>
  )
}
