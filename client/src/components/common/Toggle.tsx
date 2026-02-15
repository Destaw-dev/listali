'use client';
import React from "react";
import { Button } from "./Button";
import { cn } from "../../lib/utils";

interface ToggleProps {
  isEnabled: boolean;
  onClick?: () => void;
  className?: string;
  variant?: 'accent' | 'primary' | 'secondary' | 'destructive' | 'success' | 'warning' | 'error';
}

export function Toggle({ isEnabled, onClick, className, variant = 'accent' }: ToggleProps) {
    const baseClasses = cn(
        'rounded-full transition-all duration-200 flex items-center w-12 h-6',
        className
    );

    const variantColor = isEnabled ? variant : 'ghost';
  return (
    <Button type='button' variant={variantColor} onClick={onClick} className={baseClasses}>
      <div className={`w-5 h-5 rounded-full bg-border transition-all duration-200 transform ${
        isEnabled ? 'translate-x-3' : '-translate-x-3'
      }`} />
    </Button>
  );
}
