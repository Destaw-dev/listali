"use client";

import React, { useState, useRef, useEffect, ReactNode, RefObject } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

export interface DropdownOption {
  value: string | number;
  label: string;
  icon?: ReactNode;
  disabled?: boolean;
  divider?: boolean; 
  isSelected?: boolean; 
}

interface BaseDropdownProps {
  options: DropdownOption[];
  value?: string | number;
  onSelect?: (value: string | number, option: DropdownOption) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
  menuClassName?: string;
  optionClassName?: string;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "outlined" | "ghost";
  fullWidth?: boolean;
  align?: "start" | "end" | "center"; 
  position?: "bottom" | "top";
  maxHeight?: string;
  showChevron?: boolean;
  label?: string;
  error?: string;
  helperText?: string;
  footer?: ReactNode; 
  closeOnSelect?: boolean; 
  onOpenChange?: (isOpen: boolean) => void; 
  isOpen?: boolean; 
}

interface DropdownWithTriggerProps extends BaseDropdownProps {
  trigger?: ReactNode; 
}

type DropdownProps = DropdownWithTriggerProps;

/**
 * Safely converts a value to a string for use in DOM IDs.
 * Only uses primitives to ensure valid CSS selectors.
 * Falls back to index for objects/complex types.
 */
function safeValueToString(value: unknown, fallback: string | number): string {
  if (value === null || value === undefined) {
    return String(fallback);
  }
  
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  
  return String(fallback);
}

const sizeClasses = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-base",
  lg: "px-4 py-2.5 text-lg",
};

const variantClasses = {
  default: "bg-card shadow-sm border border-border hover:bg-surface",
  outlined: "bg-transparent border border-border hover:bg-surface",
  ghost: "bg-transparent hover:bg-surface",
};

// ---------------------------
interface DropdownTriggerProps {
  selectedOption?: DropdownOption;
  placeholder: string;
  disabled: boolean;
  isOpen: boolean;
  handleToggle: () => void;
  showChevron: boolean;
  trigger?: ReactNode;
  size: "sm" | "md" | "lg";
  variant: "default" | "outlined" | "ghost";
  triggerClassName?: string;
  error?: string;
}

function DropdownTrigger({
  selectedOption,
  placeholder,
  disabled,
  isOpen,
  handleToggle,
  showChevron,
  trigger,
  size,
  variant,
  triggerClassName,
  error,
}: DropdownTriggerProps) {
  if (trigger) {
    return (
      <div 
        onClick={handleToggle} 
        className={cn(disabled && "opacity-50 cursor-not-allowed")}
        aria-disabled={disabled}
      >
        {trigger}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={disabled}
      aria-expanded={isOpen}
      aria-haspopup="listbox"
      aria-controls="dropdown-menu"
      className={cn(
        "w-full flex items-center justify-between gap-2",
        "transition-all duration-200",
        "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        sizeClasses[size],
        variantClasses[variant],
        "rounded-lg",
        error && "border-error focus:ring-error/20",
        triggerClassName
      )}
    >
      <span className={cn("truncate", !selectedOption && "text-text-muted")}>
        {selectedOption ? selectedOption.label : placeholder}
      </span>
      {showChevron && (
        <ChevronDown
          className={cn(
            "w-4 h-4 text-text-muted transition-transform duration-200 flex-shrink-0",
            isOpen && "rotate-180"
          )}
        />
      )}
    </button>
  );
}

// ---------------------------
interface DropdownMenuProps {
  options: DropdownOption[];
  value?: string | number;
  handleSelect: (option: DropdownOption) => void;
  focusedIndex: number;
  setFocusedIndex: (index: number) => void;
  menuRef: RefObject<HTMLDivElement | null>;
  menuClassName?: string;
  optionClassName?: string;
  footer?: ReactNode;
  align: "start" | "end" | "center";
  position: "bottom" | "top";
  maxHeight: string;
}

const alignClasses = {
  start: "inset-inline-start-0",
  end: "inset-inline-end-0",
  center: "left-1/2 -translate-x-1/2",
};

const positionClasses = {
  bottom: "top-full mt-1",
  top: "bottom-full mb-1",
};

function DropdownMenu({
  options,
  value,
  handleSelect,
  focusedIndex,
  setFocusedIndex,
  menuRef,
  menuClassName,
  optionClassName,
  footer,
  align,
  position,
  maxHeight,
}: DropdownMenuProps) {

  const activeDescendantId = focusedIndex >= 0 
    ? `option-${safeValueToString(options[focusedIndex].value, focusedIndex)}` 
    : undefined;

  return (
    <div
      id="dropdown-menu"
      className={cn(
        "absolute z-50 min-w-full",
        alignClasses[align],
        positionClasses[position],
        "bg-white rounded-lg shadow-xl border border-gray-100",
        "overflow-hidden",
        menuClassName
      )}
      ref={menuRef}
      role="listbox"
      aria-activedescendant={activeDescendantId}
      tabIndex={-1} 
    >
      <div
        className="overflow-y-auto"
        style={{ maxHeight }}
      >
        {options.map((option, index) => {
          if (option.divider) {
            return (
              <div
                key={`divider-${index}`}
                role="separator"
                className="h-px bg-gray-200 my-1"
              />
            );
          }

          const isSelected = option.isSelected !== undefined 
            ? option.isSelected 
            : option.value === value;
          const isFocused = index === focusedIndex;
          const isDisabled = option.disabled;
          
          const optionId = `option-${safeValueToString(option.value, index)}`;

          return (
            <button
              key={safeValueToString(option.value, `option-${index}`)}
              id={optionId}
              type="button"
              role="option"
              aria-selected={isSelected}
              disabled={isDisabled}
              onClick={() => handleSelect(option)}
              onMouseEnter={() => setFocusedIndex(index)}
              onMouseLeave={() => setFocusedIndex(-1)} 
              className={cn(
                "w-full flex items-center justify-between gap-2 px-4 py-2", 
                "transition-colors duration-150",
                "focus:outline-none",
                isFocused && !isDisabled && "bg-primary/10",
                isSelected && !isDisabled && "bg-primary/20 font-medium",
                isDisabled
                  ? "opacity-50 cursor-not-allowed text-text-muted"
                  : "hover:bg-surface cursor-pointer",
                optionClassName
              )}
            >
              {option.icon && (
                <span className="flex-shrink-0">{option.icon}</span>
              )}
              <span className="flex-1 text-start">{option.label}</span>
              {isSelected && (
                <span className="flex-shrink-0 text-primary" aria-hidden="true">
                  ✓
                </span>
              )}
            </button>
          );
        })}
      </div>
      {footer && (
        <div className="border-t border-gray-200 p-2 bg-gray-50">
          {footer}
        </div>
      )}
    </div>
  );
}


// ---------------------------
export function Dropdown({
  options,
  value,
  onSelect,
  placeholder = "Select an option",
  disabled = false,
  className,
  triggerClassName,
  menuClassName,
  optionClassName,
  size = "md",
  variant = "default",
  fullWidth = false,
  align = "start", 
  position = "bottom",
  maxHeight = "300px",
  showChevron = true,
  trigger,
  label,
  error,
  helperText,
  footer,
  closeOnSelect = !footer,
  onOpenChange,
  isOpen: controlledIsOpen,
}: DropdownProps) {
  
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  const setIsOpen = (value: boolean | ((prev: boolean) => boolean)) => {
    const newState = typeof value === "function" 
      ? value(controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen) 
      : value;

    if (controlledIsOpen === undefined) {
      setInternalIsOpen(newState);
    }
    onOpenChange?.(newState);
  };
  
  const handleSelect = (option: DropdownOption) => {
    if (option.disabled || option.divider) return;

    onSelect?.(option.value, option);
    
    if (closeOnSelect) {
      setIsOpen(false);
      setFocusedIndex(-1);
    }
  };

  const handleToggle = () => {
    if (disabled) return;
    
    setIsOpen((prev) => {
      const newValue = !prev;
      if (newValue) {
        const firstEnabledIdx = options.findIndex(
          (opt) => !opt.disabled && !opt.divider
        );
        setFocusedIndex(firstEnabledIdx >= 0 ? firstEnabledIdx : -1);
      } else {
        setFocusedIndex(-1);
      }
      return newValue;
    });
  };

  useEffect(() => {
    const handleClickOutside = (event: Event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setFocusedIndex(-1);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isOpen, controlledIsOpen]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;

      const enabledIndices = options
        .map((opt, idx) => (!opt.disabled && !opt.divider ? idx : -1))
        .filter((idx) => idx !== -1);
      
      if (enabledIndices.length === 0) return;

      const currentIndexInEnabled = enabledIndices.indexOf(focusedIndex);
      let nextIndexInEnabled: number;

      switch (event.key) {
        case "ArrowDown":
          event.preventDefault();
          nextIndexInEnabled =
              currentIndexInEnabled < enabledIndices.length - 1
                ? currentIndexInEnabled + 1
                : 0;
          setFocusedIndex(enabledIndices[nextIndexInEnabled]);
          break;
        case "ArrowUp":
          event.preventDefault();
          nextIndexInEnabled =
              currentIndexInEnabled > 0
                ? currentIndexInEnabled - 1
                : enabledIndices.length - 1;
          setFocusedIndex(enabledIndices[nextIndexInEnabled]);
          break;
        case "Enter":
        case " ":
          event.preventDefault();
          if (focusedIndex >= 0) {
            const option = options[focusedIndex];
            if (!option.disabled && !option.divider) {
              handleSelect(option);
            }
          }
          break;
        case "Escape":
          event.preventDefault();
          setIsOpen(false);
          setFocusedIndex(-1);
          break;
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, focusedIndex, options, controlledIsOpen]);

  useEffect(() => {
    if (focusedIndex >= 0 && menuRef.current) {
      const optionValue = safeValueToString(options[focusedIndex].value, focusedIndex);
      const focusedElement = menuRef.current.querySelector(`#option-${optionValue}`) as HTMLElement;
      if (focusedElement) {
        focusedElement.scrollIntoView({
          block: "nearest",
          behavior: "smooth",
        });
      }
    }
  }, [focusedIndex, options]);

  return (
    <div
      className={cn("relative", fullWidth && "w-full", className)}
      ref={dropdownRef}
    >
      {label && (
        <label
          className={cn(
            "block text-sm font-medium mb-1 text-start", 
            error ? "text-error" : "text-text-secondary"
          )}
        >
          {label}
        </label>
      )}

      <DropdownTrigger
        selectedOption={selectedOption}
        placeholder={placeholder}
        disabled={disabled}
        isOpen={isOpen}
        handleToggle={handleToggle}
        showChevron={showChevron}
        trigger={trigger}
        size={size}
        variant={variant}
        triggerClassName={triggerClassName}
        error={error}
      />

      {isOpen && (
        <DropdownMenu
          options={options}
          value={value}
          handleSelect={handleSelect}
          focusedIndex={focusedIndex}
          setFocusedIndex={setFocusedIndex}
          menuRef={menuRef}
          menuClassName={menuClassName}
          optionClassName={optionClassName}
          footer={footer}
          align={align}
          position={position}
          maxHeight={maxHeight}
        />
      )}

      {(helperText || error) && (
        <p
          className={cn(
            "mt-1 text-sm",
            error ? "text-error" : "text-text-muted"
          )}
        >
          {error || helperText}
        </p>
      )}
    </div>
  );
}

export default Dropdown;