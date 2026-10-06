"use client";

import { useState, type ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";

export interface DisclosureProps {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
  id?: string;
}

/**
 * Expandable disclosure section with aria-expanded.
 * The trigger is a plain button, content slides open.
 */
export function Disclosure({
  title,
  children,
  defaultOpen = false,
  className,
  id,
}: DisclosureProps) {
  const [open, setOpen] = useState(defaultOpen);
  const contentId = id ? `${id}-content` : undefined;

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls={contentId}
        className={cn(
          "flex items-center gap-2 text-body font-medium w-full text-left py-2",
          "transition-colors duration-[var(--dur-fast)]",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-ring)]",
        )}
        style={{ color: "var(--text-2)" }}
      >
        <ChevronRight
          size={16}
          strokeWidth={1.5}
          className={cn(
            "shrink-0 transition-transform duration-[var(--dur-base)]",
            open && "rotate-90"
          )}
        />
        {title}
      </button>
      {open && (
        <div id={contentId} className="pl-6 pb-2">
          {children}
        </div>
      )}
    </div>
  );
}
