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
  content: string;
  children: React.ReactElement;
  placement?: Placement;
  delayShow?: number;
  delayHide?: number;
  disabled?: boolean;
}

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

  const trigger = cloneElement(
    children,
    getReferenceProps({
      ref: refs.setReference,
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
            className="z-[9999] px-3 py-2 text-sm rounded-lg shadow-lg max-w-xs animate-fade-in bg-[var(--color-tooltip-bg)] text-[var(--color-tooltip-fg)]"
          >
            {content}
            {/* Optional arrow could be added here */}
          </div>
        </FloatingPortal>
      )}
    </>
  );
}

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
        className={`p-2 rounded-lg hover:bg-surface-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      >
        {children}
      </button>
    </Tooltip>
  );
}
