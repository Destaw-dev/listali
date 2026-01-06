"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { UserPlus } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useModalScrollLock } from "../../hooks/useModalScrollLock";
import { Button, Input, Modal } from "../common";
import { createJoinGroupSchema } from "../../lib/schemas";

type JoinGroupFormData = {
  inviteCode: string;
};

interface JoinGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoinGroup: (inviteCode: string) => Promise<void>;
}

export function JoinGroupModal({
  isOpen,
  onClose,
  onJoinGroup,
}: JoinGroupModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const t = useTranslations("JoinGroupModal");

  const joinGroupSchema = createJoinGroupSchema(t);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<JoinGroupFormData>({
    resolver: zodResolver(joinGroupSchema),
  });

  const onSubmit = async (data: JoinGroupFormData) => {
    try {
      setIsLoading(true);
      await onJoinGroup(data.inviteCode);
      reset();
    } catch (error) {
      console.error("Error joining group:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  useModalScrollLock(isOpen);

  if (!isOpen) return null;

  return (
    <Modal
      title={t("joinGroup")}
      onClose={handleClose}
      iconHeader={
        <div className="p-2 bg-gradient-to-br from-secondary-400 to-secondary-600 rounded-xl">
          <UserPlus className="w-5 h-5 text-text-primary" />
        </div>
      }
      subtitle={t("joinGroupDescription")}
      size="md"
      isLoading={isLoading}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label={t("inviteCode") + " *"}
          error={errors.inviteCode?.message}
          {...register("inviteCode")}
          type="text"
          id="inviteCode"
          placeholder={t("enterInviteCode")}
          className="placeholder:text-secondary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors text-center text-lg font-mono tracking-wider"
          autoComplete="off"
        />

        <div className="bg-background/5 border border-primary/10 rounded-lg p-4">
          <h4 className="font-medium text-text-primary mb-2">
            {t("howToJoinGroup")}
          </h4>
          <ul className="text-sm text-text-secondary space-y-1">
            <li>• {t("getInviteCodeFromManager")}</li>
            <li>• {t("codeCanComeFromEmail")}</li>
            <li>• {t("enterCodeInFieldAbove")}</li>
            <li>• {t("clickJoinGroup")}</li>
            <li>• {t("youWillSeeGroupInList")}</li>
          </ul>
        </div>

        <div className="bg-background border border-border rounded-lg p-4">
          <h4 className="font-medium text-text-primary mb-2">
            {t("exampleInviteCode")}:
          </h4>
          <div className="flex items-center justify-between bg-card border border-border rounded-lg p-3">
            <span className="font-mono text-lg tracking-wider text-text-primary">
              ABC12345
            </span>
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            variant="ghost"
            type="button"
            fullWidth
            onClick={handleClose}
            disabled={isLoading}
          >
            {t("cancel")}
          </Button>
          <Button
            variant="secondary"
            type="submit"
            fullWidth
            disabled={isLoading}
          >
            {isLoading ? t("joiningGroup") : t("joinGroup")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
