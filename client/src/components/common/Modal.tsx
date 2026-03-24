"use client";

import { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Card, CardBody, CardHeader } from "./Card";
import { Button } from "./Button";
import { LoadingSpinner } from "./LoadingSpinner";

interface ModalProps {
  children: React.ReactNode;
  onClose: () => void;
  title?: string;
  iconHeader?: React.ReactNode;
  subtitle?: string;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  isLoading?: boolean;
}

export function Modal({ children, onClose, title, iconHeader, subtitle, size = "md", isLoading = false }: ModalProps) {
  const tCommon = useTranslations("common");
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const dialog = dialogRef.current;
    if (!dialog) return;

    // Focus first focusable element
    const focusable = dialog.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    focusable[0]?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key === "Tab" && focusable.length > 0) {
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [onClose]);

  const sizeClasses = {
    sm: "max-w-sm max-h-[90vh] overflow-y-auto",
    md: "max-w-md max-h-[90vh] overflow-y-auto",
    lg: "max-w-lg max-h-[95vh] overflow-y-auto",
    xl: "max-w-xl max-h-full overflow-y-auto",
    full: "max-w-full max-h-full overflow-y-auto",
  };

  return (
    <div
      className="fixed inset-0 z-[55] flex items-center justify-center p-4 bg-background/30 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        className={`relative w-full rounded-3xl bg-surface shadow-2xl transition-all animate-[fadeIn_.15s_ease-out] animate-in slide-in-from-bottom-4 ${sizeClasses[size]}`}
      >
        {isLoading && <div className="absolute inset-0 bg-background/50 z-10 flex items-center justify-center">
          <LoadingSpinner />
        </div>}
        <Card>
          <CardHeader padding='xs'>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                {iconHeader}
                <div>
                  <h2 id={titleId} className="text-lg font-bold text-text-primary">
                    {title}
                  </h2>
                  <p className="text-text-muted text-sm">{subtitle}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                rounded={true}
                aria-label={tCommon("close")}
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </Button>
            </div>
          </CardHeader>
          <CardBody>{children}</CardBody>
        </Card>
      </div>
    </div>
  );
}
