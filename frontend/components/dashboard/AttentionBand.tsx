"use client";

import { useMemo } from "react";
import { OctagonAlert, TriangleAlert, CircleCheck, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { SeverityMark } from "@/components/ui/SeverityMark";
import { getZoneLabel, getFixtureShortLabel } from "@/lib/names";
import { formatDateTime } from "@/lib/format";
import { Ticket, FacilityHygieneSummary, FixtureHealthRecord } from "@/components/types";
import { type TabId } from "@/components/shell/SideNav";

export interface AttentionBandProps {
  tickets: Ticket[];
  hygieneSummary?: FacilityHygieneSummary | null;
  fixtureHealth?: FixtureHealthRecord[] | null;
  onNavigateTab: (tab: TabId) => void;
  onDispatchTicket?: (ticketId: string) => void;
}

interface ActionItem {
  id: string;
  severity: "critical" | "warning";
  headline: string;
  location: string;
  actionLabel: string;
  targetTab: TabId;
}

export function AttentionBand({
  tickets,
  hygieneSummary,
  fixtureHealth,
  onNavigateTab,
}: AttentionBandProps) {
  const items = useMemo<ActionItem[]>(() => {
    const list: ActionItem[] = [];

    // 1. Critical & High open tickets
    const openTickets = tickets
      .filter((t) => t.status !== "resolved")
      .sort((a, b) => b.severity_score - a.severity_score);

    for (const t of openTickets.slice(0, 2)) {
      const isCritical =
        t.severity_label?.toLowerCase() === "critical" ||
        t.severity_label?.toLowerCase() === "high";
      const fixtureName = t.fixture_id.replace(/^T2_/, "").replace(/_/g, "-");
      const zoneName = getZoneLabel(t.zone_id);
      const flaggedTime = t.timestamp_flagged
        ? formatDateTime(t.timestamp_flagged)
        : "recently";

      list.push({
        id: `ticket-${t.ticket_id}`,
        severity: isCritical ? "critical" : "warning",
        headline: `Fixture ${fixtureName}: ${t.anomaly_type} (~${t.estimated_water_loss_liters.toFixed(1)} L lost, flagged ${flaggedTime})`,
        location: zoneName,
        actionLabel: "Review ticket",
        targetTab: "tickets",
      });
    }

    // 2. Critical Hygiene zones
    if (hygieneSummary?.zones) {
      const urgentZones = hygieneSummary.zones.filter(
        (z) => z.status === "Critical" || z.status === "Attention Needed"
      );
      for (const z of urgentZones) {
        list.push({
          id: `hygiene-${z.zone_id}`,
          severity: z.status === "Critical" ? "critical" : "warning",
          headline: `Hygiene readiness degraded to ${z.current_score.toFixed(0)}/100 (${z.missed_events_24h} missed cleanings)`,
          location: getZoneLabel(z.zone_id),
          actionLabel: "View hygiene",
          targetTab: "hygiene",
        });
      }
    }

    // 3. High Risk fixtures
    if (fixtureHealth) {
      const atRiskFixtures = fixtureHealth.filter(
        (f) => f.status === "High Risk" || f.status === "Degrading"
      );
      for (const f of atRiskFixtures.slice(0, 1)) {
        list.push({
          id: `fixture-${f.fixture_id}`,
          severity: f.status === "High Risk" ? "critical" : "warning",
          headline: `Fixture ${f.fixture_id.replace(/^T2_/, "")} predictive health at ${f.health_score.toFixed(0)}/100 (${f.trend})`,
          location: getZoneLabel(f.zone_id),
          actionLabel: "Inspect fixture",
          targetTab: "health",
        });
      }
    }

    // Rank critical first, take top 3
    return list
      .sort((a, b) => (a.severity === "critical" ? -1 : 1))
      .slice(0, 3);
  }, [tickets, hygieneSummary, fixtureHealth]);

  if (items.length === 0) {
    return (
      <Card tier="hero" className="border-l-4 border-l-[var(--healthy-solid)]">
        <div className="flex items-center gap-3 py-1">
          <CircleCheck className="h-5 w-5 text-[var(--healthy-fg)] shrink-0" strokeWidth={2} />
          <div>
            <h2 className="text-base font-semibold text-[var(--text-1)]">
              Nothing needs action
            </h2>
            <p className="text-xs text-[var(--text-2)] mt-0.5">
              17 of 17 smart fixtures operating within normal parameters.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  const criticalCount = items.filter((i) => i.severity === "critical").length;

  return (
    <Card tier="hero" className="space-y-4">
      {/* Header Headline */}
      <div className="flex items-center justify-between border-b border-[var(--border-hairline)] pb-3">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[var(--critical-solid)] animate-pulse" />
          <h2 className="text-base font-semibold text-[var(--text-1)] tracking-tight">
            {items.length} {items.length === 1 ? "item needs" : "items need"} action now
          </h2>
          {criticalCount > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-[var(--r-sm)] font-medium bg-[var(--critical-tint)] text-[var(--critical-fg)]">
              {criticalCount} critical
            </span>
          )}
        </div>
        <span className="text-xs text-[var(--text-3)] hidden sm:inline">
          Ranked by operational sustainability
        </span>
      </div>

      {/* Action Rows */}
      <div className="divide-y divide-[var(--border-hairline)]">
        {items.map((item) => (
          <div
            key={item.id}
            className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3 pl-3 pr-1 rounded-[var(--r-sm)] transition-colors hover:bg-[var(--bg-subtle)]"
          >
            {/* 3px severity rail */}
            <div
              className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full"
              style={{
                backgroundColor:
                  item.severity === "critical"
                    ? "var(--critical-solid)"
                    : "var(--warning-solid)",
              }}
            />

            <div className="flex items-start gap-2.5 min-w-0">
              <span className="mt-0.5 shrink-0">
                {item.severity === "critical" ? (
                  <OctagonAlert className="h-4 w-4 text-[var(--critical-fg)]" strokeWidth={2} />
                ) : (
                  <TriangleAlert className="h-4 w-4 text-[var(--warning-fg)]" strokeWidth={2} />
                )}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-[var(--text-1)] leading-snug">
                  {item.headline}
                </p>
                <p className="text-xs text-[var(--text-3)] mt-0.5">
                  {item.location}
                </p>
              </div>
            </div>

            <div className="shrink-0 self-end sm:self-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNavigateTab(item.targetTab)}
                className="gap-1 text-xs"
              >
                <span>{item.actionLabel}</span>
                <ArrowRight className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
