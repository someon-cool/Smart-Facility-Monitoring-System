import { type ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface ToolbarProps {
  children: ReactNode;
  className?: string;
}

/**
 * One toolbar row per view:
 * [Search?] [Filter select(s)] ……… [view toggle] [secondary actions]
 *
 * 40px tall controls, 8px gaps, wraps cleanly under 1024px.
 * Never stack more than one toolbar row.
 */
export function Toolbar({ children, className }: ToolbarProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 py-2",
        className
      )}
    >
      {children}
    </div>
  );
}

/** Spacer that pushes subsequent items to the right */
export function ToolbarSpacer() {
  return <div className="flex-1" />;
}

/** Divider between toolbar sections */
export function ToolbarDivider() {
  return (
    <div
      className="h-6 w-px mx-1 shrink-0"
      style={{ backgroundColor: "var(--border-hairline)" }}
    />
  );
}
