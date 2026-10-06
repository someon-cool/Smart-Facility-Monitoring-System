"use client";

import {
  forwardRef,
  useState,
  type HTMLAttributes,
  type TableHTMLAttributes,
  type TdHTMLAttributes,
  type ThHTMLAttributes,
  type ReactNode,
  type KeyboardEvent,
} from "react";
import { ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/cn";

export interface TableProps extends TableHTMLAttributes<HTMLTableElement> {
  dense?: boolean;
}

export const Table = forwardRef<HTMLTableElement, TableProps>(
  ({ className, dense = false, ...props }, ref) => {
    return (
      <div className="w-full overflow-x-auto">
        <table
          ref={ref}
          data-dense={dense ? "true" : undefined}
          className={cn(
            "w-full border-collapse text-left font-sans text-sm",
            className
          )}
          {...props}
        />
      </div>
    );
  }
);
Table.displayName = "Table";

export const TableHeader = forwardRef<
  HTMLTableSectionElement,
  HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead
    ref={ref}
    className={cn(
      "sticky top-0 z-10 bg-[var(--bg-surface)] border-b border-[var(--border-hairline)]",
      className
    )}
    {...props}
  />
));
TableHeader.displayName = "TableHeader";

export const TableBody = forwardRef<
  HTMLTableSectionElement,
  HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn("divide-y divide-[var(--border-hairline)]", className)}
    {...props}
  />
));
TableBody.displayName = "TableBody";

export interface TableHeadProps extends ThHTMLAttributes<HTMLTableCellElement> {
  sortable?: boolean;
  sortDirection?: "ascending" | "descending" | "none";
  onSort?: () => void;
  align?: "left" | "right" | "center";
}

export const TableHead = forwardRef<HTMLTableCellElement, TableHeadProps>(
  (
    {
      className,
      sortable = false,
      sortDirection = "none",
      onSort,
      align = "left",
      children,
      ...props
    },
    ref
  ) => {
    return (
      <th
        ref={ref}
        scope="col"
        aria-sort={sortable ? sortDirection : undefined}
        onClick={sortable ? onSort : undefined}
        className={cn(
          "h-10 px-3 py-2 text-xs font-medium text-[var(--text-3)] tracking-[0.01em] select-none",
          align === "right" && "text-right",
          align === "center" && "text-center",
          align === "left" && "text-left",
          sortable &&
            "cursor-pointer hover:text-[var(--text-1)] focus-visible:outline-2 focus-visible:outline-[var(--accent-ring)]",
          className
        )}
        {...props}
      >
        <div
          className={cn(
            "inline-flex items-center gap-1.5",
            align === "right" && "justify-end w-full",
            align === "center" && "justify-center w-full"
          )}
        >
          <span>{children}</span>
          {sortable && (
            <span className="shrink-0 text-[var(--text-3)]">
              {sortDirection === "ascending" ? (
                <ArrowUp className="h-3.5 w-3.5 text-[var(--text-1)]" />
              ) : sortDirection === "descending" ? (
                <ArrowDown className="h-3.5 w-3.5 text-[var(--text-1)]" />
              ) : (
                <ArrowUpDown className="h-3.5 w-3.5 opacity-60" />
              )}
            </span>
          )}
        </div>
      </th>
    );
  }
);
TableHead.displayName = "TableHead";

export interface TableRowProps extends HTMLAttributes<HTMLTableRowElement> {
  severityRail?: "critical" | "warning" | "healthy" | "info" | "none";
}

export const TableRow = forwardRef<HTMLTableRowElement, TableRowProps>(
  ({ className, severityRail = "none", ...props }, ref) => (
    <tr
      ref={ref}
      className={cn(
        "relative transition-colors hover:bg-[var(--bg-subtle)] focus-visible:outline-2 focus-visible:outline-[var(--accent-ring)]",
        "h-12 data-[dense=true]:h-10",
        severityRail === "critical" &&
          "before:absolute before:left-0 before:top-0 before:bottom-0 before:w-[3px] before:bg-[var(--critical-solid)]",
        severityRail === "warning" &&
          "before:absolute before:left-0 before:top-0 before:bottom-0 before:w-[3px] before:bg-[var(--warning-solid)]",
        severityRail === "healthy" &&
          "before:absolute before:left-0 before:top-0 before:bottom-0 before:w-[3px] before:bg-[var(--healthy-solid)]",
        severityRail === "info" &&
          "before:absolute before:left-0 before:top-0 before:bottom-0 before:w-[3px] before:bg-[var(--info-solid)]",
        className
      )}
      {...props}
    />
  )
);
TableRow.displayName = "TableRow";

export interface TableCellProps extends TdHTMLAttributes<HTMLTableCellElement> {
  numeric?: boolean;
  align?: "left" | "right" | "center";
}

export const TableCell = forwardRef<HTMLTableCellElement, TableCellProps>(
  ({ className, numeric = false, align, children, ...props }, ref) => {
    const computedAlign = align || (numeric ? "right" : "left");
    return (
      <td
        ref={ref}
        className={cn(
          "px-3 py-2.5 text-sm text-[var(--text-2)] align-middle",
          numeric && "num font-mono text-[var(--text-1)] tabular-nums",
          computedAlign === "right" && "text-right",
          computedAlign === "center" && "text-center",
          computedAlign === "left" && "text-left",
          className
        )}
        {...props}
      >
        {children}
      </td>
    );
  }
);
TableCell.displayName = "TableCell";

/* ─── Expandable Table Row ─── */

export interface ExpandableTableRowProps extends HTMLAttributes<HTMLTableRowElement> {
  expandedContent: ReactNode;
  isExpanded?: boolean;
  onToggle?: () => void;
  severityRail?: "critical" | "warning" | "healthy" | "info" | "none";
  colSpan: number;
}

export function ExpandableTableRow({
  children,
  expandedContent,
  isExpanded: controlledExpanded,
  onToggle,
  severityRail = "none",
  colSpan,
  className,
}: ExpandableTableRowProps) {
  const [internalExpanded, setInternalExpanded] = useState(false);
  const isExpanded =
    controlledExpanded !== undefined ? controlledExpanded : internalExpanded;

  const toggle = () => {
    if (onToggle) {
      onToggle();
    } else {
      setInternalExpanded(!internalExpanded);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTableRowElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggle();
    }
  };

  return (
    <>
      <tr
        tabIndex={0}
        aria-expanded={isExpanded}
        onClick={toggle}
        onKeyDown={handleKeyDown}
        className={cn(
          "group relative h-12 cursor-pointer transition-colors hover:bg-[var(--bg-subtle)] focus-visible:outline-2 focus-visible:outline-[var(--accent-ring)]",
          severityRail === "critical" &&
            "before:absolute before:left-0 before:top-0 before:bottom-0 before:w-[3px] before:bg-[var(--critical-solid)]",
          severityRail === "warning" &&
            "before:absolute before:left-0 before:top-0 before:bottom-0 before:w-[3px] before:bg-[var(--warning-solid)]",
          severityRail === "healthy" &&
            "before:absolute before:left-0 before:top-0 before:bottom-0 before:w-[3px] before:bg-[var(--healthy-solid)]",
          severityRail === "info" &&
            "before:absolute before:left-0 before:top-0 before:bottom-0 before:w-[3px] before:bg-[var(--info-solid)]",
          isExpanded && "bg-[var(--bg-subtle)]",
          className
        )}
      >
        <td className="w-10 px-2 py-2.5 text-center align-middle">
          <ChevronRight
            className={cn(
              "h-4 w-4 text-[var(--text-3)] transition-transform duration-[var(--dur-base)]",
              isExpanded && "rotate-90 text-[var(--text-1)]"
            )}
          />
        </td>
        {children}
      </tr>
      {isExpanded && (
        <tr className="bg-[var(--bg-subtle)]/50 transition-all">
          <td colSpan={colSpan} className="p-4 border-t border-[var(--border-hairline)]">
            <div className="text-sm text-[var(--text-2)]">{expandedContent}</div>
          </td>
        </tr>
      )}
    </>
  );
}
