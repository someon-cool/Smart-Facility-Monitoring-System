import { type ReactNode } from "react";
import { cn } from "@/lib/cn";
import {
  OctagonAlert,
  TriangleAlert,
  AlertCircle,
  Minus,
} from "lucide-react";

export type Severity = "critical" | "high" | "medium" | "low";

const severityConfig: Record<
  Severity,
  { icon: ReactNode; railColor: string; textColor: string; label: string }
> = {
  critical: {
    icon: <OctagonAlert size={16} strokeWidth={1.5} />,
    railColor: "var(--critical-solid)",
    textColor: "var(--critical-fg)",
    label: "Critical",
  },
  high: {
    icon: <OctagonAlert size={16} strokeWidth={1.5} />,
    railColor: "var(--critical-solid)",
    textColor: "var(--critical-fg)",
    label: "High",
  },
  medium: {
    icon: <TriangleAlert size={16} strokeWidth={1.5} />,
    railColor: "var(--warning-solid)",
    textColor: "var(--warning-fg)",
    label: "Medium",
  },
  low: {
    icon: <Minus size={16} strokeWidth={1.5} />,
    railColor: "transparent",
    textColor: "var(--text-3)",
    label: "Low",
  },
};

export interface SeverityMarkProps {
  severity: Severity;
  className?: string;
  /** Show just the inline icon + text (no rail) */
  inline?: boolean;
}

/**
 * Severity indicator: 3px left rail on the row/card in the status solid colour,
 * plus an icon + word. Low has no rail colour.
 *
 * Used in ticket rows, fixture health cards.
 * Severity is NOT a badge — it's a consistent pattern separate from the status badge.
 */
export function SeverityMark({ severity, className, inline }: SeverityMarkProps) {
  const config = severityConfig[severity];

  if (inline) {
    return (
      <span
        className={cn("inline-flex items-center gap-1.5 text-body font-medium", className)}
        style={{ color: config.textColor }}
      >
        {config.icon}
        {config.label}
      </span>
    );
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div
        className="w-[3px] self-stretch rounded-full shrink-0"
        style={{ backgroundColor: config.railColor }}
      />
      <span
        className="inline-flex items-center gap-1.5 text-body font-medium"
        style={{ color: config.textColor }}
      >
        {config.icon}
        {config.label}
      </span>
    </div>
  );
}

/** Map severity_label string from API to our Severity type */
export function parseSeverity(label: string): Severity {
  const lower = label.toLowerCase();
  if (lower === "critical") return "critical";
  if (lower === "high") return "high";
  if (lower === "medium") return "medium";
  return "low";
}
