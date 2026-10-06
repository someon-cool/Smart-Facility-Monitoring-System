"use client";

import React, { useEffect, useState, useMemo } from "react";
import { AppShell } from "@/components/shell/AppShell";
import { MetricCards } from "@/components/MetricCards";
import { SustainabilityPanel } from "@/components/SustainabilityPanel";
import { FixtureHealthView } from "@/components/FixtureHealthView";
import { HygieneView } from "@/components/HygieneView";
import { CarbonView } from "@/components/CarbonView";
import { SensorIntelligenceSection } from "@/components/SensorIntelligenceSection";
import { FlowRateChart } from "@/components/FlowRateChart";
import { OccupancyHeatmap } from "@/components/OccupancyHeatmap";
import { TicketsView } from "@/components/TicketsView";
import { ReplayScrubber } from "@/components/ReplayScrubber";
import { AiCopilotDrawer } from "@/components/AiCopilotDrawer";
import { CopilotPanel } from "@/components/copilot/CopilotPanel";
import { AttentionBand } from "@/components/dashboard/AttentionBand";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { formatDateTime } from "@/lib/format";
import {
  OverviewMetrics,
  Reading,
  Ticket,
  DailyDigest,
  OccupancyHeatmapData,
  SustainabilitySummary,
  FixtureHealthRecord,
  FacilityHealthSummary,
  FixtureHealthApiResponse,
  FacilityHygieneSummary,
  HygieneEvent,
  CarbonSummary,
  SensorRecord,
  SensorFleetSummary,
  SensorIntelligenceApiResponse,
} from "@/components/types";

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "tickets" | "sustainability" | "health" | "hygiene" | "carbon" | "sensors">("dashboard");
  const [viewMode, setViewMode] = useState<"full" | "replay">("full");
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);

  // Core Data
  const [metrics, setMetrics] = useState<OverviewMetrics | null>(null);
  const [readings, setReadings] = useState<Reading[]>([]);
  const [zoneTotals, setZoneTotals] = useState<
    { timestamp_str: string; zone_id: string; flow_rate_lpm: number }[]
  >([]);
  const [heatmapData, setHeatmapData] = useState<OccupancyHeatmapData | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [digests, setDigests] = useState<Record<string, DailyDigest>>({});
  const [sustainability, setSustainability] = useState<SustainabilitySummary | null>(null);
  const [fixtureHealth, setFixtureHealth] = useState<FixtureHealthRecord[]>([]);
  const [healthSummary, setHealthSummary] = useState<FacilityHealthSummary | null>(null);
  const [hygieneSummary, setHygieneSummary] = useState<FacilityHygieneSummary | null>(null);
  const [hygieneEvents, setHygieneEvents] = useState<HygieneEvent[]>([]);
  const [carbonSummary, setCarbonSummary] = useState<CarbonSummary | null>(null);
  const [sensors, setSensors] = useState<SensorRecord[]>([]);
  const [sensorSummary, setSensorSummary] = useState<SensorFleetSummary | null>(null);
  const [loading, setLoading] = useState(true);

  // Replay Simulator State
  const [replayHours, setReplayHours] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Initial Data Fetch with progressive rendering
  const fetchData = async () => {
    try {
      setLoading(true);
      const fetchOverview = fetch("/api/overview").then(async (r) => {
        if (r.ok) setMetrics(await r.json());
      });
      const fetchTickets = fetch("/api/tickets").then(async (r) => {
        if (r.ok) setTickets(await r.json());
      });
      const fetchHealth = fetch("/api/fixture-health").then(async (r) => {
        if (r.ok) {
          const d: FixtureHealthApiResponse = await r.json();
          setFixtureHealth(d.fixtures || []);
          setHealthSummary(d.summary || null);
        }
      });
      const fetchZoneTotals = fetch("/api/readings/zone-totals?downsample_mins=5").then(async (r) => {
        if (r.ok) setZoneTotals(await r.json());
      });
      const fetchHygiene = fetch("/api/hygiene/summary").then(async (r) => {
        if (r.ok) setHygieneSummary(await r.json());
      });
      const fetchCarbon = fetch("/api/carbon/summary").then(async (r) => {
        if (r.ok) setCarbonSummary(await r.json());
      });
      const fetchSensors = fetch("/api/sensors").then(async (r) => {
        if (r.ok) {
          const d: SensorIntelligenceApiResponse = await r.json();
          setSensors(d.sensors || []);
          setSensorSummary(d.summary || null);
        }
      });
      const fetchHeatmap = fetch("/api/occupancy-heatmap").then(async (r) => {
        if (r.ok) setHeatmapData(await r.json());
      });
      const fetchDigests = fetch("/api/digests").then(async (r) => {
        if (r.ok) setDigests(await r.json());
      });
      const fetchSustainability = fetch("/api/sustainability/summary").then(async (r) => {
        if (r.ok) setSustainability(await r.json());
      });
      const fetchReadings = fetch("/api/readings?downsample_mins=5").then(async (r) => {
        if (r.ok) setReadings(await r.json());
      });
      const fetchHygieneEvents = fetch("/api/hygiene/events?limit=100").then(async (r) => {
        if (r.ok) setHygieneEvents(await r.json());
      });

      // Unlock initial dashboard view as soon as core operational metrics & chart totals land
      await Promise.all([fetchOverview, fetchTickets, fetchHealth, fetchZoneTotals, fetchHygiene, fetchCarbon, fetchSensors]);
      setLoading(false);

      // Remaining secondary datasets resolve in background
      await Promise.all([fetchHeatmap, fetchDigests, fetchSustainability, fetchReadings, fetchHygieneEvents]);
    } catch (err) {
      console.error("Error fetching facility telemetry:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Update Ticket Status (Optimistic UI + SQLite PATCH)
  const handleTicketStatusChange = async (
    ticketId: string,
    newStatus: "open" | "dispatched" | "resolved",
    resolutionNote?: string
  ) => {
    // 1. Optimistic local update
    setTickets((prev) =>
      prev.map((t) =>
        t.ticket_id === ticketId
          ? {
              ...t,
              status: newStatus,
              resolution_note:
                resolutionNote !== undefined ? resolutionNote : t.resolution_note,
            }
          : t
      )
    );

    // 2. Call backend
    try {
      const payload: { status: string; resolution_note?: string } = { status: newStatus };
      if (resolutionNote !== undefined) {
        payload.resolution_note = resolutionNote;
      }
      const res = await fetch(`/api/tickets/${encodeURIComponent(ticketId)}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to update status");
      const updatedData = await res.json();
      if (updatedData.ticket) {
        setTickets((prev) =>
          prev.map((t) => (t.ticket_id === ticketId ? updatedData.ticket : t))
        );
      }
    } catch (err) {
      console.error("Failed to update ticket status on server:", err);
      // Revert on error
      fetchData();
    }
  };

  // Hygiene Event Handlers (Mark cycle completed or trigger sanitize)
  const handleCompleteHygieneEvent = async (eventId: number) => {
    try {
      const res = await fetch(`/api/hygiene/events/${eventId}/complete`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed_by: "Housekeeping Staff", score_after: 96.0 }),
      });
      if (res.ok) {
        const [sumRes, evRes] = await Promise.all([
          fetch("/api/hygiene/summary"),
          fetch("/api/hygiene/events?limit=100"),
        ]);
        if (sumRes.ok) setHygieneSummary(await sumRes.json());
        if (evRes.ok) setHygieneEvents(await evRes.json());
      }
    } catch (err) {
      console.error("Failed to complete hygiene event:", err);
    }
  };

  const handleCleanZone = async (zoneId: string) => {
    try {
      const res = await fetch("/api/hygiene/clean-zone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ zone_id: zoneId, completed_by: "Sanitation Lead", score_after: 98.0 }),
      });
      if (res.ok) {
        const [sumRes, evRes] = await Promise.all([
          fetch("/api/hygiene/summary"),
          fetch("/api/hygiene/events?limit=100"),
        ]);
        if (sumRes.ok) setHygieneSummary(await sumRes.json());
        if (evRes.ok) setHygieneEvents(await evRes.json());
      }
    } catch (err) {
      console.error("Failed to clean zone:", err);
    }
  };

  // Replay Simulator: Filtered data according to replayHours
  const replayCutoffDate = useMemo(() => {
    if (!metrics?.sim_start) return new Date("2024-10-02T00:00:00");
    const start = new Date(metrics.sim_start);
    return new Date(start.getTime() + replayHours * 3600 * 1000);
  }, [metrics?.sim_start, replayHours]);

  const activeReadings = useMemo(() => {
    if (viewMode === "full") return readings;
    return readings.filter((r) => new Date(r.timestamp_str) <= replayCutoffDate);
  }, [viewMode, readings, replayCutoffDate]);

  const activeZoneTotals = useMemo(() => {
    if (viewMode === "full") return zoneTotals;
    return zoneTotals.filter((zt) => new Date(zt.timestamp_str) <= replayCutoffDate);
  }, [viewMode, zoneTotals, replayCutoffDate]);

  const activeTickets = useMemo(() => {
    if (viewMode === "full") return tickets;
    return tickets.filter((t) => new Date(t.timestamp_flagged) <= replayCutoffDate);
  }, [viewMode, tickets, replayCutoffDate]);

  const activeMetrics = useMemo(() => {
    if (!metrics) return null;
    if (viewMode === "full") return metrics;
    const waterLoss = activeTickets.reduce((acc, t) => acc + (t.estimated_water_loss_liters || 0), 0);
    const costImpact = activeTickets.reduce((acc, t) => acc + (t.estimated_cost_impact || 0), 0);
    const openCount = activeTickets.filter((t) => t.status !== "resolved").length;
    const totalSimHours = metrics.sim_duration_hours || 168;
    const progressRatio = Math.min(1, Math.max(0, replayHours / totalSimHours));
    const scaledReadings = Math.round(metrics.sensor_readings_count * progressRatio);

    return {
      ...metrics,
      sensor_readings_count: scaledReadings,
      total_tickets_count: activeTickets.length,
      open_tickets_count: openCount,
      estimated_water_loss_liters: waterLoss,
      estimated_cost_impact_inr: costImpact,
    };
  }, [viewMode, metrics, activeTickets, replayHours]);

  const openTicketsCount = activeTickets.filter((t) => t.status !== "resolved").length;
  const hasCriticalTickets = activeTickets.some(
    (t) =>
      t.status !== "resolved" &&
      (t.severity_label?.toLowerCase() === "critical" ||
        t.severity_label?.toLowerCase() === "high")
  );
  const hygieneAlertCount =
    (hygieneSummary?.critical_zones_count ?? 0) + (hygieneSummary?.attention_zones_count ?? 0);
  const hasCriticalHygiene = (hygieneSummary?.critical_zones_count ?? 0) > 0;

  return (
    <>
      <AppShell
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        openTicketsCount={openTicketsCount}
        hasCriticalTickets={hasCriticalTickets}
        hygieneAlertCount={hygieneAlertCount}
        hasCriticalHygiene={hasCriticalHygiene}
        onOpenCopilot={() => setIsCopilotOpen(true)}
        copilotOpen={isCopilotOpen}
        copilotPanel={
          <CopilotPanel onClose={() => setIsCopilotOpen(false)} />
        }
      >
        {activeTab === "tickets" && (
          <TicketsView
            tickets={tickets}
            onStatusChange={handleTicketStatusChange}
            loading={loading}
          />
        )}

        {activeTab === "sustainability" && (
          <SustainabilityPanel
            summary={sustainability}
            loading={loading}
            onSwitchView={(v) => setActiveTab(v)}
          />
        )}

        {activeTab === "health" && (
          <FixtureHealthView
            records={fixtureHealth}
            summary={healthSummary}
            loading={loading}
          />
        )}

        {activeTab === "hygiene" && (
          <HygieneView
            summary={hygieneSummary}
            events={hygieneEvents}
            loading={loading}
            onRefresh={fetchData}
            onCompleteEvent={handleCompleteHygieneEvent}
            onCleanZone={handleCleanZone}
          />
        )}

        {activeTab === "carbon" && (
          <CarbonView
            summary={carbonSummary}
            loading={loading}
            onSwitchView={(v) => setActiveTab(v)}
          />
        )}

        {activeTab === "sensors" && (
          <SensorIntelligenceSection
            summary={sensorSummary}
            sensors={sensors}
            loading={loading}
          />
        )}

        {activeTab === "dashboard" && (
          <div className="space-y-6">
            {/* Header sub-row: Time context & Replay Mode toggle */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-[var(--border-hairline)]">
              <div>
                <span className="text-xs text-[var(--text-3)] font-mono">
                  Terminal 2 · Data as of{" "}
                  {metrics?.sim_end
                    ? formatDateTime(metrics.sim_end)
                    : "8 Oct 2024, 23:59"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <SegmentedControl
                  value={viewMode}
                  onValueChange={(val) => {
                    const mode = val as "full" | "replay";
                    setViewMode(mode);
                    if (mode === "replay") {
                      setIsPlaying(false);
                    }
                  }}
                  items={[
                    { value: "full", label: "Full dataset" },
                    { value: "replay", label: "Simulation replay" },
                  ]}
                />
              </div>
            </div>

            {/* 1. Attention now band (Hero Card) */}
            <AttentionBand
              tickets={activeTickets}
              hygieneSummary={hygieneSummary}
              fixtureHealth={fixtureHealth}
              onNavigateTab={setActiveTab}
            />

            {/* 2. Stat strip (Flat KPI metrics) */}
            <MetricCards
              metrics={activeMetrics}
              healthSummary={healthSummary}
              carbonSummary={carbonSummary}
              loading={loading}
              onNavigateTab={setActiveTab}
            />

            {/* 3. Flow Telemetry Chart */}
            <FlowRateChart
              readings={readings}
              zoneTotals={zoneTotals}
              loading={loading}
              viewMode={viewMode}
              onViewModeChange={(mode) => {
                setViewMode(mode);
                if (mode === "replay") {
                  setIsPlaying(false);
                }
              }}
              isReplay={viewMode === "replay"}
              replayCutoffDate={replayCutoffDate}
              replayHours={replayHours}
              onJumpReplayHours={setReplayHours}
            />

            {/* Replay Scrubber: flat inline directly UNDER the flow chart when in Replay */}
            {viewMode === "replay" && (
              <ReplayScrubber
                simStart={metrics?.sim_start || "2024-10-02T00:00:00"}
                simDurationHours={metrics?.sim_duration_hours || 168}
                currentHours={replayHours}
                onChangeHours={setReplayHours}
                isPlaying={isPlaying}
                onTogglePlay={() => setIsPlaying(!isPlaying)}
                onReset={() => {
                  setIsPlaying(false);
                  setReplayHours(0);
                }}
              />
            )}

            {/* 4. Occupancy Heatmap */}
            <OccupancyHeatmap data={heatmapData} loading={loading} />
          </div>
        )}
      </AppShell>

      {/* AI Copilot Slide-out Sheet Drawer for screens < 1280px */}
      <div className="xl:hidden">
        <AiCopilotDrawer
          isOpen={isCopilotOpen}
          onClose={() => setIsCopilotOpen(false)}
        />
      </div>
    </>
  );
}
