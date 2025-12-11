"use client";

import { memo, useEffect, useMemo, useRef, useState } from "react";
import { Package, X, Tag } from "lucide-react";
import { Button } from "@/components/common";

interface ProductDetailsModalProps {
  item: any | null;
  onClose: () => void;
  tItems: (key: string, values?: Record<string, any>) => string;
  tCommon: (key: string, values?: Record<string, any>) => string;
}

export const ProductDetailsModal = memo(function ProductDetailsModal({
  item,
  onClose,
  tItems,
  tCommon,
}: ProductDetailsModalProps) {
  const [imgLoaded, setImgLoaded] = useState(false);
  if (!item) return null;

  const product = item.product ?? {};
  const title = product.name || item.name || "";
  const brand = product.brand || item.brand || "";
  const category = item.category?.name || "";
  const unitLabel = item.unit ? tItems(String(item.unit)) : "";



  const metaRows: Array<{ label: string; value: string }> = [];
  if (brand) metaRows.push({ label: tItems("brandLabel") ?? "מותג", value: brand });
  if (category) metaRows.push({ label: tItems("categoryLabel") ?? "קטגוריה", value: category });
  if (typeof item.quantity === "number")
    metaRows.push({
      label: tItems("quantityLabel", { unit: unitLabel }) ?? "כמות",
      value: `${item.quantity}${unitLabel ? ` ${unitLabel}` : ""}`,
    });
  if (item.notes)
    metaRows.push({ label: tItems("notesLabel") ?? "הערות", value: item.notes });

  return (
    <div
      className="fixed inset-0 z-[55] flex items-center justify-center p-4 bg-black/30 backdrop-blur-[2px]"
      aria-labelledby="product-dialog-title"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl rounded-3xl bg-card shadow-2xl transition-all
                   animate-[fadeIn_.15s_ease-out] "
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <header className="flex items-start justify-between gap-3 px-6 pt-6">
          <div className="min-w-0">
            <h3 id="product-dialog-title" className="truncate text-lg font-semibold text-text-primary">
              {title}
            </h3>
            {!!brand && (
              <p className="mt-0.5 truncate text-sm text-text-muted">{brand}</p>
            )}
          </div>
          <Button variant="ghost" size="md" onClick={onClose} aria-label={tCommon("close")}>
            <X className="h-4 w-4" />
          </Button>
        </header>

        {/* Body */}
        <div className="px-6 pb-6 pt-4">
          <div className="flex flex-col gap-4 sm:flex-row">
            {/* Media */}
            <div className="sm:w-40 w-full">
              <div className="aspect-square overflow-hidden rounded-2xl shadow-sm bg-surface">
                {product.image ? (
                  <>
                    {!imgLoaded && (
                      <div className="animate-pulse bg-surface" />
                    )}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={product.image}
                      alt={title}
                      className={`h-full w-full object-contain transition duration-200 ${imgLoaded ? "opacity-100" : "opacity-0"}`}
                      loading="lazy"
                      onLoad={() => setImgLoaded(true)}
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                        setImgLoaded(true);
                      }}
                    />
                  </>
                ) : (
                  <div className="grid h-full w-full place-items-center text-text-muted">
                    <Package className="h-7 w-7" />
                  </div>
                )}
              </div>
            </div>

            {/* Details */}
            <div className="min-w-0 flex-1">
              {product.description && (
                <p className="mb-3 text-sm leading-relaxed text-text-secondary">
                  {product.description}
                </p>
              )}

              <dl className="grid grid-cols-1 gap-y-2 text-sm sm:grid-cols-2">
                {metaRows.map((row, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <dt className="shrink-0 text-text-primary font-medium">{row.label}:</dt>
                    <dd className="truncate text-text-muted">{row.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>

          {/* Footer */}
          <div className=" flex justify-end gap-2">
            <Button variant="primary" size="md" onClick={onClose} aria-label={tCommon("close")}>
              {tCommon("close")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
});
