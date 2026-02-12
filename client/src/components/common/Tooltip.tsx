'use client';

import React, { useState, cloneElement } from 'react';
import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
  useHover,
  useFocus,
  useDismiss,
  useRole,
  useInteractions,
  FloatingPortal,
  type Placement,
} from '@floating-ui/react';

export interface TooltipProps {
  /**
   * The tooltip content to display
   */
  content: string;

  /**
   * The element that triggers the tooltip
   * Must be a single React element that accepts ref and event handlers
   */
  children: React.ReactElement;

  /**
   * Placement of the tooltip relative to the trigger
   * @default 'top'
   */
  placement?: Placement;

  /**
   * Delay before showing tooltip (in ms)
   * @default 300
   */
  delayShow?: number;

  /**
   * Delay before hiding tooltip (in ms)
   * @default 0
   */
  delayHide?: number;

  /**
   * Whether the tooltip is disabled
   * @default false
   */
  disabled?: boolean;
}

/**
 * Tooltip component for displaying contextual information
 *
 * @example
 * ```tsx
 * <Tooltip content="Delete item">
 *   <button>
 *     <Trash className="w-5 h-5" />
 *   </button>
 * </Tooltip>
 * ```
 *
 * @example
 * ```tsx
 * <Tooltip content="Settings" placement="right">
 *   <IconButton icon={<Settings />} />
 * </Tooltip>
 * ```
 */
export function Tooltip({
  content,
  children,
  placement = 'top',
  delayShow = 300,
  delayHide = 0,
  disabled = false,
}: TooltipProps) {
  const [isOpen, setIsOpen] = useState(false);

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen && !disabled,
    onOpenChange: setIsOpen,
    placement,
    middleware: [
      offset(8),
      flip({
        fallbackAxisSideDirection: 'start',
        padding: 8,
      }),
      shift({ padding: 8 }),
    ],
    whileElementsMounted: autoUpdate,
  });

  const hover = useHover(context, {
    delay: {
      open: delayShow,
      close: delayHide,
    },
    move: false,
  });

  const focus = useFocus(context);
  const dismiss = useDismiss(context);
  const role = useRole(context, { role: 'tooltip' });

  const { getReferenceProps, getFloatingProps } = useInteractions([
    hover,
    focus,
    dismiss,
    role,
  ]);

  // Clone the child element and add ref + event handlers
  const trigger = cloneElement(
    children,
    getReferenceProps({
      ref: refs.setReference,
      ...children.props,
    })
  );

  return (
    <>
      {trigger}
      {isOpen && !disabled && (
        <FloatingPortal>
          <div
            ref={refs.setFloating}
            style={floatingStyles}
            {...getFloatingProps()}
            className="z-[9999] px-3 py-2 text-sm text-white bg-neutral-900 dark:bg-neutral-700 rounded-lg shadow-lg max-w-xs animate-fade-in"
          >
            {content}
            {/* Optional arrow could be added here */}
          </div>
        </FloatingPortal>
      )}
    </>
  );
}

/**
 * Convenience component for icon buttons with tooltips
 *
 * @example
 * ```tsx
 * <TooltipIconButton content="Delete" onClick={handleDelete}>
 *   <Trash className="w-5 h-5" />
 * </TooltipIconButton>
 * ```
 */
export function TooltipIconButton({
  content,
  children,
  placement = 'top',
  onClick,
  disabled = false,
  className = '',
}: {
  content: string;
  children: React.ReactNode;
  placement?: Placement;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <Tooltip content={content} placement={placement} disabled={disabled}>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={`p-2 rounded-lg hover:bg-background-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      >
        {children}
      </button>
    </Tooltip>
  );
}
