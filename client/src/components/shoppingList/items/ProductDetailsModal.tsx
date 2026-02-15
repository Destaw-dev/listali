"use client";

import { memo, useState } from "react";
import { Package } from "lucide-react";
import { Button, Modal } from "../../common";
import { useModalScrollLock } from "../../../hooks/useModalScrollLock";
import { IItem } from "../../../types";
import { extractImageUrl, extractNameFromProduct } from "../../../lib/utils";

interface ProductDetailsModalProps {
  item: IItem | null;
  onClose: () => void;
  tItems: (key: string, values?: Record<string, string | number>) => string;
  tCommon: (key: string, values?: Record<string, string | number>) => string;
}

export const ProductDetailsModal = memo(function ProductDetailsModal({
  item,
  onClose,
  tItems,
  tCommon,
}: ProductDetailsModalProps) {
  const [imgLoaded, setImgLoaded] = useState(false);
  
  useModalScrollLock(!!item);
  
  if (!item) return null;

  const product = item.product;
  const productName = typeof product === 'object' && product !== null && 'name' in product ? (product as { name?: string }).name : undefined;
  const productBrand = typeof product === 'object' && product !== null && 'brand' in product ? (product as { brand?: string }).brand : undefined;
  const productImage = typeof product === 'object' && product !== null && 'image' in product ? (product as { image?: string }).image ? extractImageUrl((product as { image?: string }).image) : undefined : undefined;
  const productDescription = typeof product === 'object' && product !== null && 'description' in product ? (product as { description?: string }).description : undefined;
  const title = productName || extractNameFromProduct(item) || "";
  const brand = productBrand || item.brand || "";
  const category = typeof item.category === 'object' && item.category !== null && 'name' in item.category ? item.category.name : "";
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
    <Modal
      title={title}
      onClose={onClose}
      iconHeader={<div className=" p-2 bg-info rounded-full">
        <Package className="w-5 h-5 text-text-primary" />
      </div>}
      subtitle={brand}
    >
              <div className="px-6 pb-6 pt-4">
          <div className="flex flex-col gap-4">
            <div className="sm:w-40 w-full">
              <div className="aspect-square overflow-hidden rounded-2xl shadow-sm bg-background">
                {productImage ? (
                  <>
                    {!imgLoaded && (
                      <div className="animate-pulse bg-background" />
                    )}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={productImage}
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

            <div className="min-w-0 flex-1">
              {productDescription && (
                <p className="mb-3 text-sm leading-relaxed text-text-secondary">
                  {productDescription}
                </p>
              )}

              <dl className="grid grid-cols-1 gap-y-2 text-sm">
                {metaRows.map((row, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <dt className="shrink-0 text-text-primary font-medium">{row.label}:</dt>
                    <dd className="truncate text-text-muted">{row.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>

          <div className=" flex justify-end gap-2">
            <Button variant="primary" size="md" onClick={onClose} aria-label={tCommon("close")}>
              {tCommon("close")}
            </Button>
          </div>
        </div>
      </Modal>
  );

});
