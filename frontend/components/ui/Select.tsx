"use client";

import { forwardRef, type ReactNode } from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { Check, ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/cn";

/* ─── Single Select (Radix Select) ─── */

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  ariaLabel?: string;
  className?: string;
  size?: "sm" | "md";
}

export const Select = forwardRef<HTMLButtonElement, SelectProps>(
  (
    {
      value,
      onValueChange,
      options,
      placeholder = "Select...",
      ariaLabel,
      className,
      size = "md",
    },
    ref
  ) => {
    return (
      <SelectPrimitive.Root value={value} onValueChange={onValueChange}>
        <SelectPrimitive.Trigger
          ref={ref}
          aria-label={ariaLabel}
          className={cn(
            "inline-flex items-center justify-between gap-2 rounded-[var(--r-md)] border text-left font-sans transition-colors cursor-pointer select-none",
            "border-[var(--border-strong)] bg-[var(--bg-surface)] text-[var(--text-1)]",
            "hover:bg-[var(--bg-subtle)] focus-visible:outline-2 focus-visible:outline-[var(--accent-ring)] focus-visible:outline-offset-2",
            size === "sm" ? "h-8 px-2.5 text-xs" : "h-10 px-3 text-sm",
            className
          )}
        >
          <SelectPrimitive.Value placeholder={placeholder} />
          <SelectPrimitive.Icon asChild>
            <ChevronDown className="h-4 w-4 shrink-0 text-[var(--text-3)]" />
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>

        <SelectPrimitive.Portal>
          <SelectPrimitive.Content
            position="popper"
            sideOffset={4}
            className={cn(
              "z-50 min-w-[8rem] overflow-hidden rounded-[var(--r-md)] border border-[var(--border-hairline)]",
              "bg-[var(--bg-raised)] text-[var(--text-1)] shadow-[var(--shadow-2)]",
              "data-[state=open]:animate-in data-[state=closed]:animate-out",
              "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
              "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
            )}
          >
            <SelectPrimitive.Viewport className="p-1">
              {options.map((opt) => (
                <SelectPrimitive.Item
                  key={opt.value}
                  value={opt.value}
                  disabled={opt.disabled}
                  className={cn(
                    "relative flex w-full cursor-pointer select-none items-center rounded-[var(--r-sm)] py-2 pl-8 pr-3 text-sm outline-none transition-colors",
                    "data-[highlighted]:bg-[var(--bg-subtle)] data-[highlighted]:text-[var(--text-1)]",
                    "data-[disabled]:pointer-events-none data-[disabled]:opacity-40"
                  )}
                >
                  <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                    <SelectPrimitive.ItemIndicator>
                      <Check className="h-4 w-4 text-[var(--accent-text)]" />
                    </SelectPrimitive.ItemIndicator>
                  </span>
                  <SelectPrimitive.ItemText>{opt.label}</SelectPrimitive.ItemText>
                </SelectPrimitive.Item>
              ))}
            </SelectPrimitive.Viewport>
          </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>
    );
  }
);

Select.displayName = "Select";

/* ─── Multi-Select Popover ─── */

export interface MultiSelectOption {
  value: string;
  label: string;
}

export interface MultiSelectPopoverProps {
  label: string;
  options: MultiSelectOption[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  className?: string;
}

export function MultiSelectPopover({
  label,
  options,
  selectedValues,
  onChange,
  className,
}: MultiSelectPopoverProps) {
  const allSelected = selectedValues.length === options.length;
  const countLabel =
    selectedValues.length === 0
      ? `All ${label}`
      : allSelected
      ? `All ${label}`
      : `${label} · ${selectedValues.length} of ${options.length}`;

  const toggleValue = (val: string) => {
    if (selectedValues.includes(val)) {
      onChange(selectedValues.filter((v) => v !== val));
    } else {
      onChange([...selectedValues, val]);
    }
  };

  const clear = () => onChange([]);
  const selectAll = () => onChange(options.map((o) => o.value));

  return (
    <PopoverPrimitive.Root>
      <PopoverPrimitive.Trigger
        className={cn(
          "inline-flex h-10 items-center justify-between gap-2 rounded-[var(--r-md)] border px-3 text-sm font-sans cursor-pointer select-none transition-colors",
          "border-[var(--border-strong)] bg-[var(--bg-surface)] text-[var(--text-1)]",
          "hover:bg-[var(--bg-subtle)] focus-visible:outline-2 focus-visible:outline-[var(--accent-ring)] focus-visible:outline-offset-2",
          className
        )}
      >
        <span>{countLabel}</span>
        <ChevronDown className="h-4 w-4 shrink-0 text-[var(--text-3)]" />
      </PopoverPrimitive.Trigger>

      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          sideOffset={4}
          align="start"
          className={cn(
            "z-50 w-56 rounded-[var(--r-md)] border border-[var(--border-hairline)]",
            "bg-[var(--bg-raised)] p-2 shadow-[var(--shadow-2)] text-[var(--text-1)]"
          )}
        >
          <div className="flex items-center justify-between border-b border-[var(--border-hairline)] pb-2 mb-1 px-1 text-xs">
            <span className="font-medium text-[var(--text-2)]">{label}</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={selectAll}
                className="text-[var(--text-3)] hover:text-[var(--text-1)] cursor-pointer"
              >
                All
              </button>
              <span>·</span>
              <button
                type="button"
                onClick={clear}
                className="text-[var(--text-3)] hover:text-[var(--text-1)] cursor-pointer"
              >
                Clear
              </button>
            </div>
          </div>
          <div className="flex flex-col gap-0.5 max-h-56 overflow-y-auto">
            {options.map((opt) => {
              const isChecked = selectedValues.length === 0 || selectedValues.includes(opt.value);
              return (
                <label
                  key={opt.value}
                  className="flex items-center gap-2.5 rounded-[var(--r-sm)] px-2 py-1.5 text-xs text-[var(--text-2)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-1)] cursor-pointer select-none"
                >
                  <input
                    type="checkbox"
                    checked={selectedValues.includes(opt.value)}
                    onChange={() => toggleValue(opt.value)}
                    className="h-3.5 w-3.5 rounded-[var(--r-sm)] accent-[var(--accent-ring)] cursor-pointer"
                  />
                  <span className="flex-1 truncate">{opt.label}</span>
                </label>
              );
            })}
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
