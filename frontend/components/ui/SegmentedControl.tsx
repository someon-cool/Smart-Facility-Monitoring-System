"use client";

import { type ReactNode } from "react";
import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group";
import { cn } from "@/lib/cn";

export interface SegmentedControlProps {
  value: string;
  onValueChange: (value: string) => void;
  items: { value: string; label: ReactNode }[];
  className?: string;
  /** aria-label for the group */
  label?: string;
}

/**
 * Segmented control: track bg-subtle, selected segment bg-surface + shadow-1.
 * Built on Radix ToggleGroup (roving tabindex, arrow keys, aria-checked).
 * Max 4 segments recommended.
 */
export function SegmentedControl({
  value,
  onValueChange,
  items,
  className,
  label,
}: SegmentedControlProps) {
  return (
    <ToggleGroupPrimitive.Root
      type="single"
      value={value}
      onValueChange={(v) => {
        if (v) onValueChange(v);
      }}
      aria-label={label}
      className={cn(
        "inline-flex items-center gap-0.5 rounded-[var(--radius-md)] p-0.5 h-10",
        className
      )}
      style={{ backgroundColor: "var(--bg-subtle)" }}
    >
      {items.map((item) => (
        <ToggleGroupPrimitive.Item
          key={item.value}
          value={item.value}
          className={cn(
            "inline-flex items-center justify-center px-3 h-full rounded-[6px]",
            "text-body font-medium whitespace-nowrap",
            "transition-all duration-[var(--dur-fast)] ease-[var(--ease-out)]",
            "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--accent-ring)]",
            "data-[state=on]:shadow-[var(--shadow-1)]",
          )}
          style={{
            color:
              value === item.value ? "var(--text-1)" : "var(--text-3)",
            backgroundColor:
              value === item.value ? "var(--bg-surface)" : "transparent",
          }}
        >
          {item.label}
        </ToggleGroupPrimitive.Item>
      ))}
    </ToggleGroupPrimitive.Root>
  );
}
