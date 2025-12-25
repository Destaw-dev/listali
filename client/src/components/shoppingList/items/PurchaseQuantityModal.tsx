"use client";

import { memo, useEffect, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/common/Button";
import { useModalScrollLock } from "@/hooks/useModalScrollLock";

interface PurchaseQuantityModalProps {
  item: any | null;
  onClose: () => void;
  onConfirm: (quantity: number) => void;
  tItems: (key: string, values?: Record<string, any>) => string;
}

export const PurchaseQuantityModal = memo(function PurchaseQuantityModal({
  item,
  onClose,
  onConfirm,
  tItems,
}: PurchaseQuantityModalProps) {
  const [quantity, setQuantity] = useState(0);

  useEffect(() => {
    if (item) {
      setQuantity(item.quantity ?? 0);
    }
  }, [item]);

  // Prevent body scroll when modal is open
  useModalScrollLock(!!item);

  if (!item) return null;

  const maxQuantity = item.quantity ?? 0;

  const handleIncrement = () => {
    if (quantity >= maxQuantity) return;
    setQuantity((prev: number) => Math.min(prev + 1, maxQuantity));
  };

  const handleDecrement = () => {
    if (quantity <= 0) return;
    setQuantity((prev: number) => Math.max(prev - 1, 0));
  };

  const handleConfirm = () => {
    if (quantity <= 0 || quantity > maxQuantity) return;
    onConfirm(quantity || maxQuantity);
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/25 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-3xl bg-card p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-text-primary">
          {tItems("selectQuantityTitle")}
        </h3>
        <p className="mt-2 text-sm text-text-muted">
          {item.name} · {tItems("totalQuantity")}: {maxQuantity} {item.unit}
        </p>

        <div className="mt-6 flex items-center justify-center gap-6">
          <button
            type="button"
            onClick={handleDecrement}
            disabled={quantity <= 0}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-surface text-text-primary transition hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Minus className="h-4 w-4" />
          </button>
          <div className="text-center">
            <div className="text-4xl font-bold text-text-primary">
              {quantity}
            </div>
            <div className="text-sm text-text-muted">{item.unit}</div>
          </div>
          <button
            type="button"
            onClick={handleIncrement}
            disabled={quantity >= maxQuantity}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-surface text-text-primary transition hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-8 flex gap-3">
          <Button
            variant="outline"
            onClick={handleConfirm}        
            size="md"
            fullWidth={true}
            rounded={true}
            shadow={true}
            glow={true}
            className="flex-1"
          >
            {tItems("cancel")}
          </Button>
          <Button
            variant="primary"
            onClick={handleConfirm}
            disabled={quantity <= 0 || quantity > maxQuantity}          
            size="md"
            fullWidth={true}
            rounded={true}
            shadow={true}
            glow={true}
            className="flex-1"
          >
            {tItems("confirm")}
          </Button>  
        </div>
      </div>
    </div>
  );
});

