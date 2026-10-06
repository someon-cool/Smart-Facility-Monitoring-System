"use client";

import { cn } from "@/lib/cn";
import { type ReactNode } from "react";
import { formatDateTime } from "@/lib/format";

export interface ChartTooltipRow {
  name: string;
  value: string | number;
  unit?: string;
  color?: string;
  dashed?: boolean;
}

export interface ChartTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string | number;
  title?: string;
  rows?: ChartTooltipRow[];
  unit?: string;
  className?: string;
}

/**
 * Shared Recharts tooltip content component:
 * bg-raised, hairline, shadow-2, r-md, 12px padding.
 * Header = formatted timestamp/label.
 * Rows = swatch + name + value right-aligned tabular + unit.
 */
export function ChartTooltip({
  active,
  payload,
  label,
  title,
  rows,
  unit,
  className,
}: ChartTooltipProps) {
  if (!active && !rows) return null;

  let displayTitle = title || (label ? String(label) : "");
  if (!title && label && typeof label === "string" && (label.includes("T") || label.includes("-"))) {
    try {
      const parsed = new Date(label);
      if (!isNaN(parsed.getTime())) {
        displayTitle = formatDateTime(parsed);
      }
    } catch {}
  }

  // If custom rows were passed, use those; otherwise extract from Recharts payload
  const resolvedRows: ChartTooltipRow[] =
    rows ||
    (payload || []).map((item) => ({
      name: item.name || item.dataKey,
      value: item.value,
      unit: item.unit || unit,
      color: item.color || item.fill || item.stroke,
    }));

  if (resolvedRows.length === 0 && !displayTitle) return null;

  return (
    <div
      className={cn(
        "z-50 min-w-[180px] max-w-[280px] rounded-[var(--r-md)] border border-[var(--border-hairline)]",
        "bg-[var(--bg-raised)] p-3 shadow-[var(--shadow-2)] text-xs font-sans",
        className
      )}
    >
      {displayTitle && (
        <div className="border-b border-[var(--border-hairline)] pb-1.5 mb-2 font-medium text-[var(--text-1)]">
          {displayTitle}
        </div>
      )}
      <div className="flex flex-col gap-1.5">
        {resolvedRows.map((row, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between gap-3 text-[var(--text-2)]"
          >
            <div className="flex items-center gap-2 truncate">
              {row.color && (
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{
                    backgroundColor: row.color,
                    border: row.dashed ? "1px dashed var(--text-3)" : undefined,
                  }}
                />
              )}
              <span className="truncate">{row.name}</span>
            </div>
            <div className="shrink-0 font-mono num text-[var(--text-1)] font-medium">
              {typeof row.value === "number" ? row.value.toLocaleString("en-IN") : row.value}
              {row.unit && <span className="ml-0.5 text-[var(--text-3)] font-sans">{row.unit}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
