"use client";

import { memo, useEffect, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { Button } from "../../common";
import { useModalScrollLock } from "../../../hooks/useModalScrollLock";

import { IItem } from "../../../types";

interface PurchaseQuantityModalProps {
  item: IItem | null;
  onClose: () => void;
  onConfirm: (quantity: number) => void;
  tItems: (key: string, values?: Record<string, string | number>) => string;
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
      // If item is partially purchased, start from remaining quantity
      const purchasedQty = item.purchasedQuantity || 0;
      const totalQty = item.quantity ?? 0;
      const remainingQty = item.remainingQuantity ?? (totalQty - purchasedQty);
      
      // Start from remaining quantity if partially purchased, otherwise start from 1
      // This allows user to select partial purchase
      if (purchasedQty > 0 && purchasedQty < totalQty) {
        // Partially purchased - start from remaining
        setQuantity(remainingQty);
      } else {
        // Not purchased - start from 1 (user can increase)
        setQuantity(1);
      }
    }
  }, [item]);

  useModalScrollLock(!!item);

  if (!item) return null;

  const purchasedQty = item.purchasedQuantity || 0;
  const totalQty = item.quantity ?? 0;
  const remainingQty = item.remainingQuantity ?? (totalQty - purchasedQty);
  const isPartiallyPurchased = purchasedQty > 0 && purchasedQty < totalQty;
  
  // Max quantity is the remaining quantity if partially purchased
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
    
    // Send the quantity to purchase (amount to add), not the total
    // The backend will add it to the existing purchasedQuantity
    onConfirm(quantity);
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
          {item.name}
        </p>
        {isPartiallyPurchased && (
          <p className="mt-1 text-xs text-text-muted">
            {tItems("alreadyPurchased", { 
              purchased: purchasedQty, 
              total: totalQty, 
              unit: item.unit 
            }) || `נקנה כבר: ${purchasedQty}/${totalQty} ${item.unit}`}
          </p>
        )}
        <p className="mt-1 text-sm text-text-muted">
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
          >
            {tItems("confirm")}
          </Button>  
        </div>
      </div>
    </div>
  );
});

