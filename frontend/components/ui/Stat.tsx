import { type ReactNode } from "react";
import { cn } from "@/lib/cn";

/* ─── Single stat tile ─── */

export interface StatProps {
  label: string;
  value: string | number;
  unit?: string;
  context?: string;
  delta?: {
    value: string;
    direction: "up" | "down";
    sentiment: "positive" | "negative" | "neutral";
    comparison?: string;
  };
  hero?: boolean;
  sparkline?: ReactNode;
  className?: string;
}

export function Stat({
  label,
  value,
  unit,
  context,
  delta,
  hero,
  sparkline,
  className,
}: StatProps) {
  const deltaColor =
    delta?.sentiment === "positive"
      ? "var(--healthy-fg)"
      : delta?.sentiment === "negative"
      ? "var(--critical-fg)"
      : "var(--text-3)";

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <span className="text-label" style={{ color: "var(--text-3)" }}>
        {label}
      </span>
      <div className="flex items-baseline gap-2">
        <span className={cn("num", hero ? "metric-hero" : "metric-lg")}>
          {value}
        </span>
        {unit && (
          <span className="text-body" style={{ color: "var(--text-3)" }}>
            {unit}
          </span>
        )}
        {sparkline && <div className="ml-2">{sparkline}</div>}
      </div>
      {context && (
        <span className="text-body" style={{ color: "var(--text-2)" }}>
          {context}
        </span>
      )}
      {delta && (
        <span
          className="text-caption num inline-flex items-center gap-1"
          style={{ color: deltaColor }}
        >
          {delta.direction === "up" ? "▲" : "▼"} {delta.value}
          {delta.comparison && (
            <span style={{ color: "var(--text-3)" }}>
              {" "}
              {delta.comparison}
            </span>
          )}
        </span>
      )}
    </div>
  );
}

/* ─── Stat strip (row of stats separated by hairlines) ─── */

export interface StatStripProps {
  children: ReactNode;
  className?: string;
}

/**
 * Horizontal row of stats separated by 1px vertical hairlines,
 * no individual card borders.
 */
export function StatStrip({ children, className }: StatStripProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-start gap-y-4",
        "[&>*]:px-5 first:[&>*]:pl-0 last:[&>*]:pr-0",
        "[&>*+*]:border-l [&>*+*]:border-[var(--border-hairline)]",
        className
      )}
    >
      {children}
    </div>
  );
}
