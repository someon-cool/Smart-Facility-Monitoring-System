"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown, Table as TableIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { Card } from "./Card";

export interface ChartFrameProps {
  title: string;
  subtitle?: string;
  unit?: string;
  ariaLabel: string;
  children: ReactNode;
  actions?: ReactNode;
  tableData?: {
    columns: string[];
    rows: (string | number)[][];
  };
  tier?: "hero" | "standard";
  className?: string;
}

/**
 * Standard container for all charts with accessibility disclosure:
 * role="img", aria-label, card header with title + unit, and optional "View as table" disclosure.
 */
export function ChartFrame({
  title,
  subtitle,
  unit,
  ariaLabel,
  children,
  actions,
  tableData,
  tier = "standard",
  className,
}: ChartFrameProps) {
  const [showTable, setShowTable] = useState(false);

  return (
    <Card tier={tier} className={cn("flex flex-col gap-4", className)}>
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-baseline gap-2">
            <h3 className="text-base font-semibold text-[var(--text-1)] tracking-tight">
              {title}
            </h3>
            {unit && (
              <span className="text-xs font-normal text-[var(--text-3)]">
                ({unit})
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-[var(--text-3)] mt-0.5">{subtitle}</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {actions}
          {tableData && (
            <button
              type="button"
              onClick={() => setShowTable(!showTable)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-[var(--r-sm)] border border-[var(--border-hairline)] px-2.5 py-1 text-xs text-[var(--text-2)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-1)] transition-colors cursor-pointer",
                showTable && "bg-[var(--bg-subtle)] text-[var(--text-1)]"
              )}
              aria-expanded={showTable}
            >
              <TableIcon className="h-3.5 w-3.5" />
              <span>{showTable ? "Hide table" : "View as table"}</span>
              <ChevronDown
                className={cn(
                  "h-3 w-3 text-[var(--text-3)] transition-transform duration-[var(--dur-base)]",
                  showTable && "rotate-180"
                )}
              />
            </button>
          )}
        </div>
      </div>

      {/* Main Chart Graphic */}
      <div
        role="img"
        aria-label={ariaLabel}
        className="w-full relative"
      >
        {children}
      </div>

      {/* Accessible Table View Disclosure */}
      {showTable && tableData && (
        <div className="mt-2 border-t border-[var(--border-hairline)] pt-3">
          <div className="max-h-60 overflow-y-auto overflow-x-auto text-xs">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-[var(--border-hairline)]">
                  {tableData.columns.map((col, idx) => (
                    <th
                      key={idx}
                      scope="col"
                      className="px-2.5 py-1.5 font-medium text-[var(--text-3)]"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-hairline)]">
                {tableData.rows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-[var(--bg-subtle)]">
                    {row.map((cell, cIdx) => (
                      <td
                        key={cIdx}
                        className={cn(
                          "px-2.5 py-1.5 text-[var(--text-2)]",
                          typeof cell === "number" && "font-mono num tabular-nums text-right"
                        )}
                      >
                        {typeof cell === "number" ? cell.toLocaleString("en-IN") : cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Card>
  );
}
