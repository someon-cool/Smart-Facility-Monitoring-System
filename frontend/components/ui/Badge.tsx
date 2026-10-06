import { type ReactNode } from "react";
import { cn } from "@/lib/cn";
import {
  OctagonAlert,
  TriangleAlert,
  CircleCheck,
  Info,
  Clock,
} from "lucide-react";

export type BadgeStatus = "critical" | "warning" | "healthy" | "info";

const statusConfig: Record<
  BadgeStatus,
  { icon: ReactNode; bgVar: string; fgVar: string }
> = {
  critical: {
    icon: <OctagonAlert size={14} strokeWidth={1.5} />,
    bgVar: "var(--critical-tint)",
    fgVar: "var(--critical-fg)",
  },
  warning: {
    icon: <TriangleAlert size={14} strokeWidth={1.5} />,
    bgVar: "var(--warning-tint)",
    fgVar: "var(--warning-fg)",
  },
  healthy: {
    icon: <CircleCheck size={14} strokeWidth={1.5} />,
    bgVar: "var(--healthy-tint)",
    fgVar: "var(--healthy-fg)",
  },
  info: {
    icon: <Info size={14} strokeWidth={1.5} />,
    bgVar: "var(--info-tint)",
    fgVar: "var(--info-fg)",
  },
};

/** Alternative icon for dispatched/in-progress */
const clockIcon = <Clock size={14} strokeWidth={1.5} />;

export interface BadgeProps {
  status: BadgeStatus;
  children: ReactNode;
  /** Use the clock icon instead of the default status icon */
  useClock?: boolean;
  className?: string;
}

export function Badge({ status, children, useClock, className }: BadgeProps) {
  const config = statusConfig[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-[var(--radius-sm)]",
        "h-6 px-2 text-label whitespace-nowrap",
        className
      )}
      style={{
        backgroundColor: config.bgVar,
        color: config.fgVar,
      }}
    >
      {useClock ? clockIcon : config.icon}
      {children}
    </span>
  );
}

/**
 * Map common ticket/fixture states to badge status.
 */
export function getTicketBadgeStatus(
  status: "open" | "dispatched" | "resolved"
): BadgeStatus {
  switch (status) {
    case "open":
      return "warning";
    case "dispatched":
      return "info";
    case "resolved":
      return "healthy";
  }
}
