"use client";

import { useState, useMemo } from "react";
import {
  RotateCw,
  Info,
  CheckCircle2,
  Clock,
  Sparkles,
} from "lucide-react";
import {
  FacilityHygieneSummary,
  ZoneHygieneSummary,
  HygieneEvent,
} from "./types";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Toolbar, ToolbarSpacer } from "@/components/ui/Toolbar";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Select } from "@/components/ui/Select";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/Table";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/Popover";
import { EmptyState } from "@/components/ui/EmptyState";
import { getZoneLabel, ZONE_IDS } from "@/lib/names";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/cn";

export interface HygieneViewProps {
  summary: FacilityHygieneSummary | null;
  events: HygieneEvent[];
  loading: boolean;
  onRefresh?: () => void;
  onCompleteEvent?: (eventId: number) => Promise<void>;
  onCleanZone?: (zoneId: string) => Promise<void>;
}

export function HygieneView({
  summary,
  events,
  loading,
  onRefresh,
  onCompleteEvent,
  onCleanZone,
}: HygieneViewProps) {
  const [selectedZone, setSelectedZone] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [cleaningZoneId, setCleaningZoneId] = useState<string | null>(null);
  const [completingEventId, setCompletingEventId] = useState<number | null>(
    null
  );

  // Map zone summaries by ID for constant rendering order
  const zoneSummaryMap = useMemo(() => {
    const map = new Map<string, ZoneHygieneSummary>();
    if (summary?.zones) {
      for (const z of summary.zones) {
        map.set(z.zone_id, z);
      }
    }
    return map;
  }, [summary]);

  // Filtered cleaning log events
  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      if (selectedZone !== "all" && ev.zone_id !== selectedZone) return false;
      if (statusFilter === "pending") {
        if (ev.status === "completed") return false;
      } else if (statusFilter === "completed") {
        if (ev.status !== "completed") return false;
      }
      return true;
    });
  }, [events, selectedZone, statusFilter]);

  const handleCleanNow = async (zoneId: string) => {
    if (!onCleanZone) return;
    try {
      setCleaningZoneId(zoneId);
      await onCleanZone(zoneId);
    } finally {
      setCleaningZoneId(null);
    }
  };

  const handleComplete = async (eventId: number) => {
    if (!onCompleteEvent) return;
    try {
      setCompletingEventId(eventId);
      await onCompleteEvent(eventId);
    } finally {
      setCompletingEventId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header with Refresh and 'How scores work' link */}
      <div className="flex flex-wrap items-baseline justify-between gap-4 pb-2 border-b border-[var(--border-hairline)]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-1)]">
            Hygiene
          </h1>
          <p className="text-xs text-[var(--text-3)] mt-1 font-mono">
            {summary?.facility_status
              ? `Facility status: ${summary.facility_status} · Average score ${summary.average_score.toFixed(0)}/100`
              : "Housekeeping readiness and compliance log"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* 'How scores work' Popover replacing the formula callout */}
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 text-xs text-[var(--text-2)] hover:text-[var(--text-1)] transition-colors cursor-pointer"
              >
                <Info className="h-3.5 w-3.5 text-[var(--accent-text)]" />
                <span>How scores work</span>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4 text-xs space-y-2">
              <h4 className="font-semibold text-[var(--text-1)]">
                Hygiene Readiness Model
              </h4>
              <p className="text-[var(--text-2)] leading-relaxed">
                Hygiene scores start at 100 after a verified sanitization event and
                decay deterministically based on passenger foot-traffic (flush events)
                and elapsed time.
              </p>
              <div className="p-2.5 rounded-[var(--r-sm)] bg-[var(--bg-subtle)] text-[var(--text-3)] space-y-1 font-mono text-[11px]">
                <div>• Clean: 85 – 100</div>
                <div>• Moderate: 70 – 84</div>
                <div>• Attention Needed: 50 – 69</div>
                <div>• Critical: &lt; 50 (Dispatch crew)</div>
              </div>
            </PopoverContent>
          </Popover>

          {onRefresh && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRefresh}
              loading={loading}
              className="gap-1.5 text-xs"
            >
              <RotateCw className="h-3.5 w-3.5" />
              <span>Refresh</span>
            </Button>
          )}
        </div>
      </div>

      {/* 2. Zone Readiness Cards (4 standard cards, ordered fixed) */}
      <section className="space-y-3">
        <h2 className="text-body font-semibold text-[var(--text-1)]">
          Zone readiness
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {ZONE_IDS.map((zoneId) => {
            const z = zoneSummaryMap.get(zoneId);
            const score = z?.current_score ?? 85;
            const status = z?.status ?? "Clean";
            const lastCleanTime = z?.last_clean_at
              ? formatDateTime(z.last_clean_at)
              : "06:15";
            const minutesSince = z?.minutes_since_clean ?? 45;
            const flushesLastHour = z?.flush_count_last_hour ?? 12;

            const isCritical = status === "Critical";
            const isAttention = status === "Attention Needed";
            const badgeType =
              isCritical
                ? "critical"
                : isAttention
                ? "warning"
                : status === "Moderate"
                ? "info"
                : "healthy";

            const isCleaning = cleaningZoneId === zoneId;

            return (
              <Card
                key={zoneId}
                tier="standard"
                className={cn(
                  "flex flex-col justify-between gap-4 relative",
                  isCritical
                    ? "border-t-[3px] border-t-[var(--critical-solid)]"
                    : isAttention
                    ? "border-t-[3px] border-t-[var(--warning-solid)]"
                    : status === "Moderate"
                    ? "border-t-[3px] border-t-[var(--info-solid)]"
                    : "border-t-[3px] border-t-[var(--healthy-solid)]"
                )}
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-semibold text-[var(--text-1)]">
                      {getZoneLabel(zoneId)}
                    </h3>
                    <Badge status={badgeType}>{status}</Badge>
                  </div>

                  <div>
                    <span className="text-[11px] text-[var(--text-3)]">
                      Readiness Score
                    </span>
                    <div className="metric-lg font-mono num text-[var(--text-1)]">
                      {score.toFixed(0)}{" "}
                      <span className="text-xs font-sans font-normal text-[var(--text-3)]">
                        / 100
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-[var(--text-2)] leading-relaxed">
                    Last cleaned {lastCleanTime} · {flushesLastHour} visits since (
                    {minutesSince}m ago)
                  </p>
                </div>

                <div className="pt-2 border-t border-[var(--border-hairline)] flex items-center justify-end">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleCleanNow(zoneId)}
                    loading={isCleaning}
                    className="w-full text-xs justify-center"
                  >
                    Mark cleaned
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* 3. Cleaning Log Table & Toolbar */}
      <section className="space-y-4 pt-4 border-t border-[var(--border-hairline)]">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-[var(--text-1)]">
              Cleaning Log
            </h2>
            <p className="text-xs text-[var(--text-3)] mt-0.5">
              Showing the 100 most recent compliance and sanitization events
            </p>
          </div>
        </div>

        {/* Toolbar */}
        <Toolbar className="border-b border-[var(--border-hairline)] pb-3">
          <Select
            value={selectedZone}
            onValueChange={setSelectedZone}
            options={[
              { value: "all", label: "All zones" },
              ...ZONE_IDS.map((zid) => ({
                value: zid,
                label: getZoneLabel(zid),
              })),
            ]}
            ariaLabel="Filter by zone"
          />

          <SegmentedControl
            value={statusFilter}
            onValueChange={setStatusFilter}
            items={[
              { value: "all", label: "All events" },
              { value: "pending", label: "Pending" },
              { value: "completed", label: "Completed" },
            ]}
          />

          <ToolbarSpacer />
        </Toolbar>

        {/* Flat Table */}
        {filteredEvents.length === 0 ? (
          <EmptyState
            icon={<CheckCircle2 className="h-8 w-8 text-[var(--healthy-fg)]" />}
            title="No cleaning events match this filter"
            description="All scheduled sanitization cycles have been logged."
          />
        ) : (
          <div className="rounded-[var(--r-md)] border border-[var(--border-hairline)] bg-[var(--bg-surface)] overflow-hidden">
            <Table dense>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Zone</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Completed by</TableHead>
                  <TableHead align="right">Score before → after</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead align="right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEvents.slice(0, 100).map((ev) => {
                  const isCompleted = ev.status === "completed";
                  const isCompleting = completingEventId === ev.id;
                  const zoneName = getZoneLabel(ev.zone_id);
                  const scheduledTime = formatDateTime(ev.scheduled_at);

                  const before =
                    ev.hygiene_score_before !== null
                      ? ev.hygiene_score_before.toFixed(0)
                      : "—";
                  const after =
                    ev.hygiene_score_after !== null
                      ? ev.hygiene_score_after.toFixed(0)
                      : "—";

                  return (
                    <TableRow key={ev.id}>
                      <TableCell>
                        <span className="font-mono text-xs text-[var(--text-2)]">
                          {scheduledTime}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium text-[var(--text-1)]">
                          {zoneName}
                        </span>
                      </TableCell>
                      <TableCell>{ev.event_type}</TableCell>
                      <TableCell>
                        {ev.completed_by ? (
                          <span className="text-xs text-[var(--text-1)]">
                            {ev.completed_by}
                          </span>
                        ) : (
                          <span className="text-xs text-[var(--text-3)] italic">
                            Unassigned
                          </span>
                        )}
                      </TableCell>
                      <TableCell numeric>
                        <span className="font-mono text-xs">
                          {before} →{" "}
                          <span className="font-semibold text-[var(--healthy-fg)]">
                            {after}
                          </span>
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge status={isCompleted ? "healthy" : "warning"}>
                          {isCompleted ? "Completed" : "Pending"}
                        </Badge>
                      </TableCell>
                      <TableCell align="right">
                        {!isCompleted ? (
                          <Button
                            variant="text"
                            size="sm"
                            onClick={() => handleComplete(ev.id)}
                            loading={isCompleting}
                            className="text-xs"
                          >
                            Complete
                          </Button>
                        ) : (
                          <span className="text-xs text-[var(--text-3)]">
                            Verified
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </section>
    </div>
  );
}
