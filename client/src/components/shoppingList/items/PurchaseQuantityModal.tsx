"use client";

import { memo, useEffect, useState } from "react";
import { Minus, Package, Plus } from "lucide-react";
import { Button, Modal } from "../../common";
import { useModalScrollLock } from "../../../hooks/useModalScrollLock";
import { IItem } from "../../../types";
import { extractNameFromProduct } from "../../../lib/utils";

interface PurchaseQuantityModalProps {
  item: IItem | null;
  onClose: () => void;
  onConfirm: (quantity: number) => void;
  tItems: (key: string, values?: Record<string, string | number>) => string;
  isLoading: boolean;
}

export const PurchaseQuantityModal = memo(function PurchaseQuantityModal({
  item,
  onClose,
  onConfirm,
  tItems,
  isLoading,
}: PurchaseQuantityModalProps) {
  const [quantity, setQuantity] = useState(0);

  useEffect(() => {
    if (item) {
      const purchasedQty = item.purchasedQuantity || 0;
      const totalQty = item.quantity ?? 0;
      const remainingQty = item.remainingQuantity ?? (totalQty - purchasedQty);
      
      if (purchasedQty > 0 && purchasedQty < totalQty) {
        setQuantity(remainingQty);
      } else {
        setQuantity(totalQty);
      }
    }
  }, [item]);

  useModalScrollLock(!!item);

  if (!item) return null;

  const purchasedQty = item.purchasedQuantity || 0;
  const totalQty = item.quantity ?? 0;
  const remainingQty = item.remainingQuantity ?? (totalQty - purchasedQty);
  const isPartiallyPurchased = purchasedQty > 0 && purchasedQty < totalQty;
  
  const maxQuantity = isPartiallyPurchased ? remainingQty : totalQty;

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
    
    onConfirm(quantity);
  };
  return (
    <Modal
      title={tItems("selectQuantityTitle")}
      onClose={onClose}
      iconHeader={<div className=" p-2 bg-primary rounded-full">
        <Package className="w-5 h-5 text-text-primary" />
      </div>}
      isLoading={isLoading}
    >
      <div className="space-y-3"
      >
        <div className="text-center p-3 bg-surface rounded-xl border border-border/30">
          <p className="text-base font-semibold text-text-primary">
            {extractNameFromProduct(item)}
          </p>
          {item.brand && (
            <p className="text-xs text-text-muted mt-1">{item.brand}</p>
          )}
        </div>
        {isPartiallyPurchased && (
          <div className="p-2 bg-[var(--color-status-info-soft)] rounded-lg border border-info/20">
            <p className="text-xs text-info font-medium">
              {tItems("alreadyPurchased", {
                purchased: purchasedQty,
                total: totalQty,
                unit: item.unit
              }) || `נקנה כבר: ${purchasedQty}/${totalQty} ${item.unit}`}
            </p>
          </div>
        )}
        <p className="text-sm text-text-muted text-center">
          {isPartiallyPurchased
            ? (tItems("remainingQuantity", { remaining: remainingQty, unit: item.unit }) || `נותר: ${remainingQty} ${item.unit}`)
            : `${tItems("totalQuantity")}: ${totalQty} ${item.unit}`
          }
        </p>

        <div className="mt-6 flex items-center justify-center gap-6">
          <button
            type="button"
            onClick={handleDecrement}
            disabled={quantity <= 0}
            className="flex h-12 w-12 items-center justify-center rounded-xl border-2 border-border bg-surface text-text-primary transition-all duration-200 hover:bg-surface-hover hover:border-primary hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100 shadow-sm"
          >
            <Minus className="h-5 w-5" />
          </button>
          <div className="text-center min-w-[100px] px-4 py-3 rounded-xl bg-surface border border-border/50">
            <div className="text-5xl font-bold text-primary">
              {quantity}
            </div>
            <div className="text-sm font-medium text-text-muted mt-1">{item.unit}</div>
          </div>
          <button
            type="button"
            onClick={handleIncrement}
            disabled={quantity >= maxQuantity}
            className="flex h-12 w-12 items-center justify-center rounded-xl border-2 border-border bg-surface text-text-primary transition-all duration-200 hover:bg-surface-hover hover:border-primary hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100 shadow-sm"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-8 flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}        
            size="md"
            fullWidth={true}
            rounded={true}
            shadow={true}
            glow={true}
          >
            {tItems("cancel")}
          </Button>
          <Button
            variant="primary"
            onClick={handleConfirm}
            disabled={quantity <= 0 || quantity > maxQuantity || isLoading}          
            size="md"
            fullWidth={true}
            rounded={true}
            shadow={true}
            glow={true}
          >
            {tItems("confirm")}
          </Button>  
        </div>
      </div>
      </Modal>
  );

});
