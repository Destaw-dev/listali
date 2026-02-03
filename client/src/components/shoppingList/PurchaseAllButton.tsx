"use client";

import { memo, useState, useCallback, useEffect } from "react";
import { useTranslations } from "next-intl";
import { CheckCircle2 } from "lucide-react";
import { Button } from "../common";

interface PurchaseAllButtonProps {
  onPurchaseAll: () => void | Promise<void>;
  unpurchasedCount: number;
  isLoading?: boolean;
  showUndo?: boolean;
  setUndoState?: (state: Array<{ itemId: string; purchasedQuantity: number; checked: boolean }> | null) => void;
  onUndo?: () => void;
}

export const PurchaseAllButton = memo(function PurchaseAllButton({
  onPurchaseAll,
  unpurchasedCount,
  isLoading = false,
  showUndo = false,
  setUndoState,
  onUndo,
}: PurchaseAllButtonProps) {
  const t = useTranslations("ShoppingListItems");
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleClick = useCallback(() => {
    if (unpurchasedCount === 0) return;
    setShowConfirmation(true);
  }, [unpurchasedCount]);

  const handleConfirm = useCallback(async () => {
    setShowConfirmation(false);
    await onPurchaseAll();
  }, [onPurchaseAll]);

  const handleCancel = useCallback(() => {
    setShowConfirmation(false);
  }, []);

  // Auto-hide undo after 10 seconds
  useEffect(() => {
    if (showUndo) {
      const timer = setTimeout(() => {
        if (onUndo) {
          setUndoState?.(null);
        }
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [showUndo, onUndo]);

  if (unpurchasedCount === 0 && !showUndo) return null;

  if (showUndo && onUndo) {
    return (
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onUndo}
          className="text-sm"
        >
          {t("undoPurchaseAll") || "בטל"}
        </Button>
        <span className="text-sm text-text-muted">
          {t("purchaseAllSuccess", { count: unpurchasedCount }) || `${unpurchasedCount} פריטים סומנו`}
        </span>
      </div>
    );
  }

  if (showConfirmation) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-text-muted">
          {t("confirmPurchaseAll", { count: unpurchasedCount }) || `לסמן ${unpurchasedCount} פריטים?`}
        </span>
        <Button
          variant="primary"
          size="sm"
          onClick={handleConfirm}
          disabled={isLoading}
          loading={isLoading}
        >
          {t("confirm") || "אישור"}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleCancel}
          disabled={isLoading}
        >
          {t("cancel") || "ביטול"}
        </Button>
      </div>
    );
  }

  return (
    <Button
      variant="primary"
      size="sm"
      onClick={handleClick}
      disabled={isLoading || unpurchasedCount === 0}
      icon={<CheckCircle2 className="h-4 w-4" />}
    >
      {t("purchaseAll") || "קניתי הכל"}
    </Button>
  );
});
