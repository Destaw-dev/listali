"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { X, User } from "lucide-react";
import { Card, CardBody } from "@/components/common/Card";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { z } from "zod";
import { NotificationType, useNotification } from "@/contexts/NotificationContext";

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  onSave: (data: {
    firstName: string;
    lastName: string;
    username?: string;
  }) => Promise<void>;
  isLoading?: boolean;
}

const profileSchema = z.object({
  firstName: z
    .string()
    .min(2, "firstNameMinLength")
    .max(50, "firstNameMaxLength")
    .regex(/^[a-zA-Z\u0590-\u05FF\s]+$/, "firstNameInvalid"),
  lastName: z
    .string()
    .min(2, "lastNameMinLength")
    .max(50, "lastNameMaxLength")
    .regex(/^[a-zA-Z\u0590-\u05FF\s]+$/, "lastNameInvalid"),
  username: z
    .string()
    .min(3, "usernameMinLength")
    .max(30, "usernameMaxLength")
    .regex(/^[a-zA-Z0-9_\u0590-\u05FF]+$/, "usernameInvalid"),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function EditProfileModal({
  isOpen,
  onClose,
  user,
  onSave,
  isLoading,
}: EditProfileModalProps) {
  const t = useTranslations("settings");
  const [formData, setFormData] = useState<ProfileFormData>({
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

  const validateField = (field: keyof ProfileFormData, value: string) => {
    try {
      // Create a partial object with just this field for validation
      const dataToValidate = { [field]: value };
      
      // Use the full schema but only validate the specific field
      const fieldSchema = profileSchema.pick({ [field]: true });
      fieldSchema.parse(dataToValidate);
      
      setErrors((prev) => ({ ...prev, [field]: "" }));
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const zodError = error as z.ZodError;
        const errors = zodError.issues || [];
        
        // Look for errors that match our field
        const fieldError = errors.find((e: any) =>
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
        errors.forEach((err: any) => {
          if (err.path && err.path.length > 0) {
            const field = err.path[0] as string;
            // Handle default Zod messages that aren't in our translations
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

  const handleInputChange = (field: keyof ProfileFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    validateField(field, value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 backdrop-blur-lg z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <Card
        className="bg-surface shadow-2xl max-w-md w-full animate-in slide-in-from-bottom-4"
      >
        <CardBody className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-primary">
                  {t("editProfile")}
                </h2>
                <p className="text-text-muted text-sm">
                  {t("editProfileDescription")}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-text-muted hover:text-text-primary transition-colors rounded-lg hover:bg-white/50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

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
