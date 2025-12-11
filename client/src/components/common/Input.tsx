"use client";

import React, { forwardRef, useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle, Info } from "lucide-react";

// ---------------------------
// Types
// ---------------------------

type Size = "sm" | "md" | "lg";
type Variant = "default" | "outlined" | "filled";
type Status = "default" | "success" | "warning" | "error"; // visual state

interface BaseProps {
  label?: string;
  floatingLabel?: boolean; // ✨ enables Material-like label
  helperText?: string;
  status?: Status; // ✨ success | warning | error styles
  error?: string; // keeps backward compatibility; if provided -> status=error
  leftIcon?: React.ReactNode;
  iconTwo?: React.ReactNode;
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  containerClassName?: string;
  icon?: React.ReactNode;
  mobileInput?: boolean;
}

interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
    BaseProps {}

interface TextAreaProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "size">,
    BaseProps {
  rows?: number;
}

// ---------------------------
// Design tokens (Tailwind classes)
// ---------------------------

const sizePad: Record<Size, string> = {
  sm: "px-3 py-2 text-sm",
  md: "px-4 py-2.5 text-base",
  lg: "px-4 py-3 text-lg",
};

const radiusBy: Record<Size, string> = {
  sm: "rounded-md",
  md: "rounded-lg",
  lg: "rounded-xl",
};

const iconPadLeft: Record<Size, string> = {
  sm: "pl-9",
  md: "pl-10",
  lg: "pl-12",
};

const iconPadRight: Record<Size, string> = {
  sm: "pr-9",
  md: "pr-10",
  lg: "pr-12",
};

const iconSizeBy: Record<Size, string> = {
  sm: "size-4",
  md: "size-5",
  lg: "size-6",
};

const variantBase: Record<Variant, string> = {
  default: "bg-card shadow-sm",
  outlined: "bg-transparent border border-border",
  filled: "bg-surface",
};

const statusRing: Record<Status, string> = {
  default: "focus:ring-primaryT-500",
  success: "focus:ring-success-500",
  warning: "focus:ring-warning-500",
  error: "focus:ring-error",
};

const statusBorder: Record<Status, string> = {
  default: "",
  success: "border-success-300",
  warning: "border-warning-300",
  error: "border-error",
};

const statusHelper: Record<Status, string> = {
  default: "text-text-muted",
  success: "text-success-600",
  warning: "text-warning-600",
  error: "text-error",
};

const statusIcon = {
  success: CheckCircle,
  warning: Info,
  error: AlertCircle,
} as const;

// ---------------------------
// Input
// ---------------------------

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      floatingLabel,
      helperText,
      status = "default",
      error,
      icon,
      iconTwo,
      variant = "default",
      size = "md",
      fullWidth,
      className,
      containerClassName,
      ...props
    },
    ref
  ) => {
    // If error text provided, force status to error
    const finalStatus: Status = error ? "error" : status;

    // Check if page is RTL or LTR (only on client side)
    const [isRTL, setIsRTL] = useState(false);
    
    useEffect(() => {
      if (typeof window !== 'undefined') {
        setIsRTL(document.documentElement.getAttribute('dir') === 'rtl');
      }
    }, []);

    const iconPosition = isRTL ? 'right' : 'left';
    const iconTwoPosition = iconTwo && iconPosition === 'right' ? 'left' : 'right';

    const base = cn(
      "w-full transition-all duration-200 placeholder:text-text-muted disabled:opacity-50 disabled:cursor-not-allowed",
      "focus:outline-none",
      statusRing[finalStatus],
      variantBase[variant],
      sizePad[size],
      radiusBy[size],
      finalStatus !== "default" && statusBorder[finalStatus],
      iconPosition === 'left' && iconPadLeft[size],
      iconPosition === 'right' && iconPadRight[size],
      iconTwoPosition === 'left' && iconPadLeft[size],
      iconTwoPosition === 'right' && iconPadRight[size],
      floatingLabel && "peer placeholder-transparent",
      className,
    );

    // Helper function to render icon at a specific position
    const renderIcon = (
      iconNode: React.ReactNode | undefined,
      position: 'left' | 'right',
      currentPosition: 'left' | 'right'
    ) => {
      if (!iconNode || position !== currentPosition) return null;
      
      return (
        <span
          className={cn(
            "absolute top-1/2 -translate-y-1/2 flex items-center justify-center text-text-muted",
            position === 'left' ? 'left-3' : 'right-3'
          )}
        >
          <span className={iconSizeBy[size]}>{iconNode}</span>
        </span>
      );
    };

    const Floating = floatingLabel && label ? (
      <label
        className={cn(
          "pointer-events-none absolute left-3 z-[1] origin-[0] select-none",
          "top-1/2 -translate-y-1/2 text-text-muted",
          "transition-all duration-150",
          "peer-focus:top-2 peer-focus:text-xs",
          "peer-[&:not(:placeholder-shown)]:top-2 peer-[&:not(:placeholder-shown)]:text-xs"
        )}
      >
        {label}
      </label>
    ) : null;

    const HelperIcon = finalStatus !== "default" ? statusIcon[finalStatus] : null;

    return (
      <div className={cn("space-y-1", fullWidth && "w-full", containerClassName)}>
        {/* Static label (non-floating) */}
        {!floatingLabel && label && (
          <label className="block text-base font-medium text-text-primary">{label}</label>
        )}

        <div className="relative">
          {renderIcon(icon, 'left', iconPosition)}
          {renderIcon(iconTwo, 'left', iconTwoPosition)}
          <input ref={ref} className={base} {...props} />
          {renderIcon(iconTwo, 'right', iconTwoPosition)}
          {renderIcon(icon, 'right', iconPosition)}
          {Floating}
        </div>

        {(error || helperText) && (
          <div className={cn("flex items-center gap-1 text-sm", statusHelper[finalStatus])}>
            {finalStatus !== "default" && HelperIcon ? (
              <HelperIcon className="h-4 w-4" aria-hidden="true" />
            ) : null}
            <p>{error ?? helperText}</p>
          </div>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

// ---------------------------
// TextArea (with floating label too)
// ---------------------------

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  (
    {
      label,
      floatingLabel,
      helperText,
      status = "default",
      error,
      icon,
      variant = "default",
      size = "md",
      fullWidth,
      rows = 3,
      className,
      containerClassName,
      ...props
    },
    ref
  ) => {
    const finalStatus: Status = error ? "error" : status;

    const base = cn(
      "w-full transition-all duration-200 placeholder:text-text-muted disabled:opacity-50 disabled:cursor-not-allowed",
      "focus:outline-none",
      statusRing[finalStatus],
      variantBase[variant],
      sizePad[size],
      radiusBy[size],
      finalStatus !== "default" && statusBorder[finalStatus],
      floatingLabel && "peer placeholder-transparent",
      "resize-none",
      className
    );

    const Floating = floatingLabel && label ? (
      <label
        className={cn(
          "pointer-events-none absolute left-3 z-[1] origin-[0] select-none",
          "top-3 text-text-muted transition-all duration-150",
          "peer-focus:top-1 peer-focus:text-xs",
          "peer-[&:not(:placeholder-shown)]:top-1 peer-[&:not(:placeholder-shown)]:text-xs"
        )}
      >
        {label}
      </label>
    ) : null;

    const HelperIcon = finalStatus !== "default" ? statusIcon[finalStatus] : null;

    return (
      <div className={cn("space-y-1", fullWidth && "w-full", containerClassName)}>
        {!floatingLabel && label && (
          <label className="block text-sm font-medium text-text-primary">{label}</label>
        )}
        <div className="relative">
          <textarea ref={ref} className={base} rows={rows} {...props} />
          {Floating}
        </div>
        {(error || helperText) && (
          <div className={cn("flex items-center gap-1 text-sm", statusHelper[finalStatus])}>
            {finalStatus !== "default" && HelperIcon ? (
              <HelperIcon className="h-4 w-4" aria-hidden="true" />
            ) : null}
            <p>{error ?? helperText}</p>
          </div>
        )}
      </div>
    );
  }
);
TextArea.displayName = "TextArea";