import { type ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}

/**
 * Empty state: 32px neutral icon, h3 title, one body sentence, one action.
 * Never an emoji. Icons are lucide only.
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 px-6 text-center",
        className
      )}
    >
      <div className="mb-3" style={{ color: "var(--text-3)" }}>
        {icon}
      </div>
      <h3 className="text-h3 mb-1" style={{ color: "var(--text-1)" }}>
        {title}
      </h3>
      <p className="text-body mb-4 max-w-sm" style={{ color: "var(--text-2)" }}>
        {description}
      </p>
      {action}
    </div>
  );
}
