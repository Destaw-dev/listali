"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { X, User } from "lucide-react";
import { Card, CardBody, CardHeader, Button, Input } from "../common";
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
          const errorMessage = t(fieldError.message);
          setErrors((prev) => ({ ...prev, [field]: errorMessage }));
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
            const messageKey = err.message.startsWith('Invalid input') ? 'validationError' : err.message;
            newErrors[field] = t(messageKey, { message: err.message });
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    }
  };

  useModalScrollLock(isOpen);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 backdrop-blur-lg z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <Card
        className="bg-background shadow-2xl max-w-md w-full animate-in slide-in-from-bottom-4"
      >
        <CardHeader className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-background-500 rounded-full">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-text-primary">
                {t("editProfile")}
              </h2>
              <p className="text-text-muted text-sm">
                {t("editProfileDescription")}
              </p>
            </div>
          </div>
            <Button variant="ghost" size="xs" icon={<X className="w-4 h-4" />} onClick={onClose} rounded={true}/>
        </CardHeader>
        <CardBody className="p-6">
          <form
            onSubmit={handleSubmit}
            className="space-y-4"
            onKeyDown={handleKeyDown}
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
                className="flex-1"
                disabled={isLoading}
                type="button"
              >
                {t("cancel")}
              </Button>
              <Button
                variant="primary"
                type="submit"
                className="flex-1"
                loading={isLoading}
                disabled={isLoading}
              >
                {isLoading ? t("saving") : t("save")}
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
