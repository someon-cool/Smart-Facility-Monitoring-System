"use client";

import { Fragment, useState, useMemo, type FormEvent, type KeyboardEvent } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { SeverityMark, type Severity } from "@/components/ui/SeverityMark";
import { Button } from "@/components/ui/Button";
import { Toolbar, ToolbarSpacer } from "@/components/ui/Toolbar";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Select } from "@/components/ui/Select";
import { CopyableId } from "@/components/ui/CopyableId";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/Dialog";
import { Disclosure } from "@/components/ui/Disclosure";
import { EmptyState } from "@/components/ui/EmptyState";
import { EvidencePanel } from "./EvidencePanel";
import { Ticket } from "./types";
import { getZoneLabel } from "@/lib/names";
import { formatDateTime } from "@/lib/format";
import { Sparkles, CheckCircle2, ChevronRight, ChevronDown } from "lucide-react";

export interface TicketsViewProps {
  tickets: Ticket[];
  onStatusChange: (
    ticketId: string,
    newStatus: "open" | "dispatched" | "resolved",
    resolutionNote?: string
  ) => Promise<void>;
  loading: boolean;
}

const SEVERITY_RANKS: Record<string, number> = {
  critical: 1,
  high: 2,
  medium: 3,
  low: 4,
};

const QUICK_NOTES = [
  "Valve diaphragm replaced",
  "False positive — sensor recalibrated",
  "Supply union tightened",
  "Solenoid seal inspected and tested",
];

/**
 * Single source of truth for column widths (7 columns).
 * Order MUST match the header cells and the row cells:
 * severity | issue (flexible) | flagged | water | cost | status | action
 */
const COLUMN_WIDTHS = [
  "150px", // severity (chevron + mark)
  undefined, // issue & location — takes the remaining space
  "140px", // flagged
  "112px", // water lost
  "112px", // cost sustainability
  "136px", // status
  "120px", // action
] as const;

const COLUMN_COUNT = COLUMN_WIDTHS.length;

/** "sustained_leak" -> "Sustained leak" */
function humanize(value?: string | null): string {
  if (!value) return "—";
  const text = value.replace(/_/g, " ").trim();
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function TicketsView({
  tickets,
  onStatusChange,
  loading,
}: TicketsViewProps) {
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [zoneFilter, setZoneFilter] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<string>("severity_desc");

  // Expanded rows
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // Modal State for Resolution
  const [resolvingTicket, setResolvingTicket] = useState<Ticket | null>(null);
  const [resolutionNote, setResolutionNote] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleRowKeyDown = (e: KeyboardEvent<HTMLElement>, id: string) => {
    // Ignore keys pressed on inner controls (e.g. the Dispatch button)
    if (e.target !== e.currentTarget) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggleExpanded(id);
    }
  };

  // Counts
  const counts = useMemo(() => {
    let open = 0;
    let dispatched = 0;
    let resolved = 0;
    for (const t of tickets) {
      if (t.status === "open") open++;
      else if (t.status === "dispatched") dispatched++;
      else if (t.status === "resolved") resolved++;
    }
    return { open, dispatched, resolved, total: tickets.length };
  }, [tickets]);

  // Unique Anomaly Types & Zones for filter dropdowns
  const anomalyTypes = useMemo(() => {
    const set = new Set<string>();
    tickets.forEach((t) => t.anomaly_type && set.add(t.anomaly_type));
    return Array.from(set);
  }, [tickets]);

  const zoneIds = useMemo(() => {
    const set = new Set<string>();
    tickets.forEach((t) => t.zone_id && set.add(t.zone_id));
    return Array.from(set);
  }, [tickets]);

  // Filtered & Sorted Tickets
  const filteredTickets = useMemo(() => {
    return tickets
      .filter((t) => {
        if (statusFilter !== "all" && t.status !== statusFilter) return false;
        if (
          severityFilter !== "all" &&
          t.severity_label.toLowerCase() !== severityFilter
        )
          return false;
        if (typeFilter !== "all" && t.anomaly_type !== typeFilter) return false;
        if (zoneFilter !== "all" && t.zone_id !== zoneFilter) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortOrder === "severity_desc") {
          const rA = SEVERITY_RANKS[a.severity_label.toLowerCase()] || 99;
          const rB = SEVERITY_RANKS[b.severity_label.toLowerCase()] || 99;
          if (rA !== rB) return rA - rB;
          return (
            new Date(b.timestamp_flagged).getTime() -
            new Date(a.timestamp_flagged).getTime()
          );
        }
        if (sortOrder === "newest") {
          return (
            new Date(b.timestamp_flagged).getTime() -
            new Date(a.timestamp_flagged).getTime()
          );
        }
        if (sortOrder === "oldest") {
          return (
            new Date(a.timestamp_flagged).getTime() -
            new Date(b.timestamp_flagged).getTime()
          );
        }
        if (sortOrder === "water_loss") {
          return b.estimated_water_loss_liters - a.estimated_water_loss_liters;
        }
        return 0;
      });
  }, [tickets, statusFilter, severityFilter, typeFilter, zoneFilter, sortOrder]);

  // De-duplicate AI text: check if same explanation appears on >= 3 visible tickets
  const sharedAnalysisNote = useMemo(() => {
    const freq = new Map<string, number>();
    for (const t of filteredTickets) {
      if (t.explanation) {
        freq.set(t.explanation, (freq.get(t.explanation) || 0) + 1);
      }
    }
    for (const [expl, count] of freq.entries()) {
      if (count >= 3) {
        return {
          explanation: expl,
          count,
        };
      }
    }
    return null;
  }, [filteredTickets]);

  // Dispatch handler
  const handleDispatch = async (t: Ticket) => {
    await onStatusChange(t.ticket_id, "dispatched");
  };

  // Submit resolution note modal
  const handleConfirmResolve = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!resolvingTicket || !resolutionNote.trim()) return;

    try {
      setIsSubmitting(true);
      await onStatusChange(
        resolvingTicket.ticket_id,
        "resolved",
        resolutionNote.trim()
      );
      setResolvingTicket(null);
      setResolutionNote("");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <div className="pb-2 border-b border-[var(--border-hairline)]">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text-1)]">
          Incident Queue
        </h1>
        <p className="text-xs text-[var(--text-3)] mt-1 font-mono">
          {counts.open} open · {counts.dispatched} dispatched · {counts.resolved} resolved
        </p>
      </div>

      {/* 2. Single Toolbar */}
      <Toolbar className="border-b border-[var(--border-hairline)] pb-4">
        <SegmentedControl
          value={statusFilter}
          onValueChange={setStatusFilter}
          items={[
            { value: "all", label: `All (${counts.total})` },
            { value: "open", label: "Open" },
            { value: "dispatched", label: "Dispatched" },
            { value: "resolved", label: "Resolved" },
          ]}
        />

        <Select
          value={severityFilter}
          onValueChange={setSeverityFilter}
          options={[
            { value: "all", label: "All severities" },
            { value: "critical", label: "Critical" },
            { value: "high", label: "High" },
            { value: "medium", label: "Medium" },
            { value: "low", label: "Low" },
          ]}
          ariaLabel="Filter by severity"
        />

        <Select
          value={typeFilter}
          onValueChange={setTypeFilter}
          options={[
            { value: "all", label: "All issue types" },
            ...anomalyTypes.map((type) => ({
              value: type,
              label: humanize(type),
            })),
          ]}
          ariaLabel="Filter by issue type"
        />

        <Select
          value={zoneFilter}
          onValueChange={setZoneFilter}
          options={[
            { value: "all", label: "All zones" },
            ...zoneIds.map((zid) => ({ value: zid, label: getZoneLabel(zid) })),
          ]}
          ariaLabel="Filter by zone"
        />

        <ToolbarSpacer />

        <Select
          value={sortOrder}
          onValueChange={setSortOrder}
          options={[
            { value: "severity_desc", label: "Severity (Highest first)" },
            { value: "newest", label: "Date (Newest first)" },
            { value: "oldest", label: "Date (Oldest first)" },
            { value: "water_loss", label: "Water lost (Highest first)" },
          ]}
          ariaLabel="Sort tickets"
        />
      </Toolbar>

      {/* Shared Analysis Banner (De-duplicated AI text) */}
      {sharedAnalysisNote && (
        <div className="flex items-start gap-2.5 p-3 rounded-[var(--r-md)] border border-[var(--border-hairline)] bg-[var(--bg-subtle)] text-xs text-[var(--text-2)]">
          <Sparkles className="h-4 w-4 text-[var(--accent-text)] shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-[var(--text-1)]">
              Shared AI pattern ({sharedAnalysisNote.count} tickets):
            </span>{" "}
            <span>{sharedAnalysisNote.explanation}</span>
          </div>
        </div>
      )}

      {/* 3. Queue Table */}
      {filteredTickets.length === 0 ? (
        <EmptyState
          icon={<CheckCircle2 className="h-8 w-8 text-[var(--healthy-fg)]" />}
          title="No tickets match this filter"
          description="Everything in this view has been resolved or meets normal operational baseline."
          action={
            <Button
              variant="ghost"
              onClick={() => {
                setStatusFilter("all");
                setSeverityFilter("all");
                setTypeFilter("all");
                setZoneFilter("all");
              }}
            >
              Reset all filters
            </Button>
          }
        />
      ) : (
        <div className="rounded-[var(--r-md)] border border-[var(--border-hairline)] bg-[var(--bg-surface)] overflow-hidden">
          <Table className="table-fixed w-full">
            {/* Column widths live here ONLY, so header and rows can never disagree */}
            <colgroup>
              {COLUMN_WIDTHS.map((width, i) => (
                <col key={i} style={width ? { width } : undefined} />
              ))}
            </colgroup>

            <TableHeader>
              <TableRow>
                <TableHead className="pl-5">Severity</TableHead>
                <TableHead>Issue &amp; location</TableHead>
                <TableHead>Flagged</TableHead>
                <TableHead align="right">Water lost</TableHead>
                <TableHead align="right">Cost sustainability</TableHead>
                <TableHead align="center">Status</TableHead>
                <TableHead align="right" className="pr-4">
                  Action
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filteredTickets.map((t) => {
                const sev = t.severity_label.toLowerCase() as Severity;
                const fixtureName = t.fixture_id
                  .replace(/^T2_/, "")
                  .replace(/_/g, "-");
                const zoneName = getZoneLabel(t.zone_id);
                const isResolved = t.status === "resolved";
                const isExpanded = expandedIds.has(t.ticket_id);
                const Chevron = isExpanded ? ChevronDown : ChevronRight;

                const statusBadgeType =
                  t.status === "open"
                    ? "warning"
                    : t.status === "dispatched"
                      ? "info"
                      : "healthy";

                // Severity rail: inset left border on the first cell
                const railClass =
                  sev === "critical" || sev === "high"
                    ? "shadow-[inset_3px_0_0_0_var(--critical-fg)]"
                    : sev === "medium"
                      ? "shadow-[inset_3px_0_0_0_var(--warning-fg)]"
                      : "";

                return (
                  <Fragment key={t.ticket_id}>
                    <TableRow
                      className="cursor-pointer"
                      onClick={() => toggleExpanded(t.ticket_id)}
                      onKeyDown={(e: KeyboardEvent<HTMLElement>) =>
                        handleRowKeyDown(e, t.ticket_id)
                      }
                      tabIndex={0}
                      aria-expanded={isExpanded}
                    >
                      {/* 1. Severity (with expand chevron) */}
                      <TableCell className={`pl-5 ${railClass}`}>
                        <div className="flex items-center gap-2">
                          <Chevron
                            className="h-4 w-4 shrink-0 text-[var(--text-3)]"
                            aria-hidden="true"
                          />
                          <SeverityMark severity={sev} />
                        </div>
                      </TableCell>

                      {/* 2. Issue & Location */}
                      <TableCell>
                        <div className="min-w-0">
                          <div className="font-medium text-[var(--text-1)] truncate">
                            {humanize(t.anomaly_type)}
                          </div>
                          <div className="text-xs text-[var(--text-3)] mt-0.5 truncate">
                            Fixture {fixtureName} · {zoneName}
                          </div>
                        </div>
                      </TableCell>

                      {/* 3. Flagged */}
                      <TableCell>
                        <span className="font-mono text-xs text-[var(--text-2)] whitespace-nowrap">
                          {formatDateTime(t.timestamp_flagged)}
                        </span>
                      </TableCell>

                      {/* 4. Water lost */}
                      <TableCell
                        numeric
                        align="right"
                        className="whitespace-nowrap tabular-nums"
                      >
                        {t.estimated_water_loss_liters.toFixed(1)} L
                      </TableCell>

                      {/* 5. Cost sustainability */}
                      <TableCell
                        numeric
                        align="right"
                        className="whitespace-nowrap tabular-nums"
                      >
                        ₹{Math.round(t.estimated_cost_impact).toLocaleString("en-IN")}
                      </TableCell>

                      {/* 6. Status */}
                      <TableCell align="center">
                        <Badge status={statusBadgeType}>
                          {t.status === "open"
                            ? "Open"
                            : t.status === "dispatched"
                              ? "Dispatched"
                              : "Resolved"}
                        </Badge>
                      </TableCell>

                      {/* 7. Action */}
                      <TableCell
                        align="right"
                        className="pr-4"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {t.status === "open" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDispatch(t)}
                            className="text-xs"
                          >
                            Dispatch
                          </Button>
                        )}
                        {t.status === "dispatched" && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => {
                              setResolvingTicket(t);
                              setResolutionNote(t.resolution_note || "");
                            }}
                            className="text-xs"
                          >
                            Resolve
                          </Button>
                        )}
                        {isResolved && (
                          <span className="text-xs text-[var(--text-3)]">
                            Completed
                          </span>
                        )}
                      </TableCell>
                    </TableRow>

                    {/* Expanded details: one cell spanning all 7 columns */}
                    {isExpanded && (
                      <TableRow>
                        <TableCell
                          colSpan={COLUMN_COUNT}
                          className="bg-[var(--bg-subtle)] px-5 py-4"
                        >
                          <div className="space-y-4">
                            {/* Summary & ID */}
                            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--border-hairline)] pb-3">
                              <div className="space-y-1">
                                <span className="text-caption font-medium text-[var(--text-3)]">
                                  Incident summary
                                </span>
                                <p className="text-sm font-medium text-[var(--text-1)]">
                                  Observed flow{" "}
                                  {t.evidence?.observed_flow_lpm?.toFixed(2) ?? "—"} L/min
                                  vs baseline{" "}
                                  {t.evidence?.expected_flow_lpm?.toFixed(2) ?? "—"} L/min
                                  across {t.evidence?.duration_minutes ?? "—"} minutes.
                                </p>
                              </div>
                              <CopyableId fullId={t.ticket_id} />
                            </div>

                            {/* AI analysis (hidden if already shown in the shared banner) */}
                            {(!sharedAnalysisNote ||
                              sharedAnalysisNote.explanation !== t.explanation) &&
                              t.explanation && (
                                <div className="p-3 rounded-[var(--r-sm)] border border-[var(--border-hairline)] bg-[var(--bg-surface)] text-xs space-y-1">
                                  <div className="flex items-center gap-1.5 font-semibold text-[var(--text-1)]">
                                    <Sparkles className="h-3.5 w-3.5 text-[var(--accent-text)]" />
                                    <span>Diagnostics &amp; AI guidance</span>
                                  </div>
                                  <p className="text-[var(--text-2)] leading-relaxed">
                                    {t.explanation}
                                  </p>
                                </div>
                              )}

                            {/* Resolution note */}
                            {isResolved && t.resolution_note && (
                              <div className="p-3 rounded-[var(--r-sm)] border border-[var(--healthy-fg)]/20 bg-[var(--healthy-tint)] text-xs text-[var(--healthy-fg)] space-y-1">
                                <span className="font-semibold">Resolution note:</span>
                                <p>{t.resolution_note}</p>
                              </div>
                            )}

                            {/* Evidence */}
                            {t.evidence && (
                              <Disclosure title="Why was this flagged? (Deterministic telemetry evidence)">
                                <div className="pt-2">
                                  <EvidencePanel evidence={t.evidence} />
                                </div>
                              </Disclosure>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* 4. Resolve Ticket Modal (Radix Dialog) */}
      <Dialog
        open={!!resolvingTicket}
        onOpenChange={(open) => !open && setResolvingTicket(null)}
      >
        <DialogContent>
          <form onSubmit={handleConfirmResolve}>
            <DialogHeader>
              <DialogTitle>
                Resolve ticket{" "}
                {resolvingTicket?.ticket_id
                  ? resolvingTicket.ticket_id.slice(-6)
                  : ""}
              </DialogTitle>
              <DialogDescription>
                {humanize(resolvingTicket?.anomaly_type)} · Fixture{" "}
                {resolvingTicket?.fixture_id
                  .replace(/^T2_/, "")
                  .replace(/_/g, "-")}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-3">
              <div className="space-y-1.5">
                <label
                  htmlFor="resolution-note-input"
                  className="text-xs font-semibold text-[var(--text-2)]"
                >
                  Resolution note{" "}
                  <span className="text-[var(--critical-fg)]">*</span>
                </label>
                <textarea
                  id="resolution-note-input"
                  rows={3}
                  required
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  placeholder="Describe the maintenance action taken..."
                  className="w-full rounded-[var(--r-md)] border border-[var(--border-strong)] bg-[var(--bg-surface)] p-2.5 text-sm text-[var(--text-1)] placeholder-[var(--text-3)] focus:outline-2 focus:outline-[var(--accent-ring)]"
                />
              </div>

              <div className="space-y-1.5">
                <span className="text-[11px] text-[var(--text-3)]">
                  Quick suggestions:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_NOTES.map((note) => (
                    <button
                      key={note}
                      type="button"
                      onClick={() => setResolutionNote(note)}
                      className="text-xs px-2 py-1 rounded-[var(--r-sm)] border border-[var(--border-hairline)] bg-[var(--bg-subtle)] text-[var(--text-2)] hover:text-[var(--text-1)] hover:bg-[var(--bg-surface)] transition-colors cursor-pointer"
                    >
                      {note}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="ghost"
                type="button"
                onClick={() => setResolvingTicket(null)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                type="submit"
                disabled={!resolutionNote.trim() || isSubmitting}
                loading={isSubmitting}
              >
                Resolve ticket
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}