"use client";

import React, { useState, useMemo } from "react";
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Minus,
  RefreshCw,
  Search,
  Filter,
  Droplets,
  Calendar,
  UserCheck,
  AlertCircle,
  ChevronRight,
  Info,
  Timer,
  Check,
} from "lucide-react";
import {
  FacilityHygieneSummary,
  ZoneHygieneSummary,
  HygieneEvent,
} from "./types";

interface HygieneViewProps {
  summary: FacilityHygieneSummary | null;
  events: HygieneEvent[];
  loading: boolean;
  onRefresh?: () => void;
  onCompleteEvent?: (eventId: number) => Promise<void>;
  onCleanZone?: (zoneId: string) => Promise<void>;
}

const ZONE_NAMES: Record<string, string> = {
  T2_Restroom_A: "Departure Restroom A",
  T2_Restroom_B: "Arrival Restroom B",
  T2_Family_Room: "Family Restroom",
  T2_Staff_WC: "Staff Operations WC",
};

const ZONE_BADGES: Record<string, { bg: string; text: string; border: string }> = {
  T2_Restroom_A: { bg: "bg-[#6B8CAE]/15", text: "text-[#6B8CAE]", border: "border-[#6B8CAE]/30" },
  T2_Restroom_B: { bg: "bg-[#789A8B]/15", text: "text-[#789A8B]", border: "border-[#789A8B]/30" },
  T2_Family_Room: { bg: "bg-[#B08D57]/15", text: "text-[#B08D57]", border: "border-[#B08D57]/30" },
  T2_Staff_WC: { bg: "bg-[#847E9C]/15", text: "text-[#847E9C]", border: "border-[#847E9C]/30" },
};

export function HygieneView({
  summary,
  events,
  loading,
  onRefresh,
  onCompleteEvent,
  onCleanZone,
}: HygieneViewProps) {
  const [selectedZone, setSelectedZone] = useState<string>("all");
  const [eventStatusFilter, setEventStatusFilter] = useState<string>("all");
  const [cleaningZoneId, setCleaningZoneId] = useState<string | null>(null);
  const [completingEventId, setCompletingEventId] = useState<number | null>(null);
  const [showFormulaInfo, setShowFormulaInfo] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Helpers for badge styling
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Clean":
        return {
          bg: "bg-[#2EB88A]/15",
          text: "text-[#2EB88A]",
          border: "border-[#2EB88A]/30",
          icon: CheckCircle2,
          bar: "bg-[#2EB88A]",
        };
      case "Moderate":
        return {
          bg: "bg-[#06B6D4]/15",
          text: "text-[#06B6D4]",
          border: "border-[#06B6D4]/30",
          icon: ShieldCheck,
          bar: "bg-[#06B6D4]",
        };
      case "Attention Needed":
        return {
          bg: "bg-[#F79009]/15",
          text: "text-[#F79009]",
          border: "border-[#F79009]/30",
          icon: AlertTriangle,
          bar: "bg-[#F79009]",
        };
      case "Critical":
      default:
        return {
          bg: "bg-[#F04438]/15",
          text: "text-[#F04438]",
          border: "border-[#F04438]/30",
          icon: AlertCircle,
          bar: "bg-[#F04438]",
        };
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "Improving":
        return <TrendingUp className="h-3.5 w-3.5 text-[#2EB88A]" />;
      case "Worsening":
        return <TrendingDown className="h-3.5 w-3.5 text-[#F04438]" />;
      default:
        return <Minus className="h-3.5 w-3.5 text-[#8B949E]" />;
    }
  };

  // Filtered cleaning audit events
  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      if (selectedZone !== "all" && ev.zone_id !== selectedZone) return false;
      if (eventStatusFilter !== "all" && ev.status.toLowerCase() !== eventStatusFilter.toLowerCase()) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const staff = (ev.completed_by || "").toLowerCase();
        const notes = (ev.notes || "").toLowerCase();
        const zoneName = (ZONE_NAMES[ev.zone_id] || "").toLowerCase();
        return staff.includes(q) || notes.includes(q) || zoneName.includes(q);
      }
      return true;
    });
  }, [events, selectedZone, eventStatusFilter, searchQuery]);

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

  if (loading && !summary) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="w-8 h-8 border-2 border-[#06B6D4] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-[#8B949E]">Loading facility hygiene intelligence...</p>
      </div>
    );
  }

  const zones = summary?.zones || [];
  const criticalZones = zones.filter((z) => z.status === "Critical" || z.status === "Attention Needed");
  const totalMissed = summary?.total_missed_events_24h ?? 0;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* ── 1. Header & Actions Banner ────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.08] pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-[#06B6D4]/15 border border-[#06B6D4]/30">
              <ShieldCheck className="h-5 w-5 text-[#06B6D4]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-wide">
                Restroom Hygiene & Cleaning Operations
              </h2>
              <p className="text-xs text-[#8B949E] mt-0.5">
                Real-time decay modeling, usage load penalties, and housekeeping compliance tracking
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowFormulaInfo(!showFormulaInfo)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#8B949E] hover:text-white bg-[#101010] border border-white/[0.08] hover:border-white/20 transition-all"
          >
            <Info className="h-3.5 w-3.5 text-[#06B6D4]" />
            <span>Decay Model</span>
          </button>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#F0F6FC] bg-[#161B22] border border-white/[0.08] hover:border-white/20 transition-all"
            >
              <RefreshCw className="h-3.5 w-3.5 text-[#06B6D4]" />
              <span>Refresh</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Formula Info Callout (collapsible) ───────────────────────────────── */}
      {showFormulaInfo && (
        <div className="p-4 rounded-xl bg-[#06B6D4]/5 border border-[#06B6D4]/20 text-xs text-[#E6EDF3] space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-[#06B6D4] flex items-center gap-1.5">
              <Sparkles className="h-4 w-4" /> Hygiene Score Mathematical Formulation:
            </span>
            <button
              onClick={() => setShowFormulaInfo(false)}
              className="text-[#8B949E] hover:text-white text-[11px]"
            >
              Dismiss
            </button>
          </div>
          <p className="font-mono text-[#79C0FF] bg-[#0A0D12] p-2.5 rounded-lg border border-white/5">
            Hygiene Score = max(0, min(100, 100 × e^(-λ × minutes_since_clean) - (flush_load × penalty)))
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[11px] text-[#8B949E] pt-1">
            <div>
              <strong className="text-white">λ (Decay Rate):</strong> 0.0035/min (~80% score after 60 min idle)
            </div>
            <div>
              <strong className="text-white">Load Penalty:</strong> -0.8 pts per fixture flush/occupancy use
            </div>
            <div>
              <strong className="text-white">Airport SLA Threshold:</strong> ≥ 70 Clean, &lt; 40 Critical
            </div>
          </div>
        </div>
      )}

      {/* ── 2. Top-Level Metric Cards (4 cards) ───────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Facility Average Hygiene Score */}
        <div className="rounded-xl border border-white/[0.08] bg-[#101010] p-5 shadow-sm relative overflow-hidden group hover:border-[#06B6D4]/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#8B949E] uppercase tracking-wider">
              Facility Hygiene Score
            </span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                getStatusBadge(summary?.facility_status || "Clean").border
              } ${getStatusBadge(summary?.facility_status || "Clean").bg} ${
                getStatusBadge(summary?.facility_status || "Clean").text
              }`}
            >
              {summary?.facility_status || "Clean"}
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-white">
              {summary ? summary.average_score.toFixed(1) : "—"}
            </span>
            <span className="text-xs text-[#8B949E]">/ 100</span>
          </div>
          <div className="mt-3 w-full bg-[#1A1F26] rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                getStatusBadge(summary?.facility_status || "Clean").bar
              }`}
              style={{ width: `${Math.min(100, Math.max(0, summary?.average_score || 0))}%` }}
            />
          </div>
          <p className="text-[11px] text-[#8B949E] mt-2.5 flex items-center justify-between">
            <span>Terminal 2 SLA benchmark</span>
            <span className="text-white font-medium">≥ 70.0</span>
          </p>
        </div>

        {/* Card 2: Zones Requiring Attention */}
        <div className="rounded-xl border border-white/[0.08] bg-[#101010] p-5 shadow-sm relative overflow-hidden group hover:border-[#F79009]/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#8B949E] uppercase tracking-wider">
              Zone Hygiene Compliance
            </span>
            <div className="p-1.5 rounded-lg bg-[#F79009]/10 text-[#F79009]">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-white">
              {summary ? summary.clean_zones_count : 0}
            </span>
            <span className="text-xs text-[#8B949E]">
              / {zones.length || 4} Zones Clean
            </span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-[11px]">
            <span className="px-1.5 py-0.5 rounded bg-[#F04438]/15 text-[#F04438] font-semibold border border-[#F04438]/30">
              {summary?.critical_zones_count ?? 0} Critical
            </span>
            <span className="px-1.5 py-0.5 rounded bg-[#F79009]/15 text-[#F79009] font-semibold border border-[#F79009]/30">
              {summary?.attention_zones_count ?? 0} Moderate/Attention
            </span>
          </div>
          <p className="text-[11px] text-[#8B949E] mt-2.5">
            Real-time status across 4 monitored zones
          </p>
        </div>

        {/* Card 3: Missed Cleaning Cycles */}
        <div className="rounded-xl border border-white/[0.08] bg-[#101010] p-5 shadow-sm relative overflow-hidden group hover:border-[#F04438]/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#8B949E] uppercase tracking-wider">
              Missed Cycles (24h)
            </span>
            <div className="p-1.5 rounded-lg bg-[#F04438]/10 text-[#F04438]">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span
              className={`text-3xl font-bold tracking-tight ${
                totalMissed > 0 ? "text-[#F04438]" : "text-[#2EB88A]"
              }`}
            >
              {totalMissed}
            </span>
            <span className="text-xs text-[#8B949E]">scheduled intervals</span>
          </div>
          <p className="text-[11px] text-[#8B949E] mt-3">
            {totalMissed > 0
              ? "Staff dispatch required for pending sanitizations"
              : "Housekeeping cycles 100% on schedule"}
          </p>
        </div>

        {/* Card 4: Audit & Activity Log */}
        <div className="rounded-xl border border-white/[0.08] bg-[#101010] p-5 shadow-sm relative overflow-hidden group hover:border-[#2EB88A]/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#8B949E] uppercase tracking-wider">
              Total Recorded Cycles
            </span>
            <div className="p-1.5 rounded-lg bg-[#2EB88A]/10 text-[#2EB88A]">
              <Calendar className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-white">
              {events.length}
            </span>
            <span className="text-xs text-[#8B949E]">audit events</span>
          </div>
          <p className="text-[11px] text-[#8B949E] mt-3 flex items-center gap-1.5">
            <CheckCircle2 className="h-3 w-3 text-[#2EB88A]" />
            <span>
              {events.filter((e) => e.status === "completed").length} completed successfully
            </span>
          </p>
        </div>
      </div>

      {/* ── 3. Hygiene Active Alerts Banner (if critical/attention) ───────────── */}
      {criticalZones.length > 0 && (
        <div className="rounded-xl border border-[#F79009]/30 bg-gradient-to-r from-[#F79009]/10 via-[#F79009]/5 to-transparent p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-[#F79009]/20 text-[#F79009] shrink-0 mt-0.5">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">
                Hygiene Attention Required: {criticalZones.length} Zone{criticalZones.length > 1 ? "s" : ""} Below Target
              </h4>
              <p className="text-xs text-[#8B949E] mt-0.5">
                {criticalZones
                  .map(
                    (z) =>
                      `${ZONE_NAMES[z.zone_id] || z.zone_id} (${z.current_score.toFixed(0)}/100, ${z.minutes_since_clean}m idle)`
                  )
                  .join(" · ")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end md:self-center shrink-0">
            <button
              onClick={() => {
                if (criticalZones[0]) handleCleanNow(criticalZones[0].zone_id);
              }}
              disabled={cleaningZoneId !== null}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#F79009] hover:bg-[#F79009]/90 text-black shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Sanitize Priority Zone</span>
            </button>
          </div>
        </div>
      )}

      {/* ── 4. Zone Hygiene Status Cards Grid ─────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <span>Zone Hygiene Intelligence & Readiness</span>
            <span className="text-xs text-[#8B949E] font-normal">
              ({zones.length} restroom blocks)
            </span>
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {zones.map((zone) => {
            const badge = getStatusBadge(zone.status);
            const zoneMeta = ZONE_BADGES[zone.zone_id] || {
              bg: "bg-white/10",
              text: "text-white",
              border: "border-white/20",
            };
            const isCleaning = cleaningZoneId === zone.zone_id;

            return (
              <div
                key={zone.zone_id}
                className="rounded-xl border border-white/[0.08] bg-[#101010] p-5 flex flex-col justify-between hover:border-white/20 transition-all group"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border ${zoneMeta.border} ${zoneMeta.bg} ${zoneMeta.text}`}
                      >
                        {zone.zone_id.replace("T2_", "")}
                      </span>
                      <h4 className="text-sm font-semibold text-white mt-1.5">
                        {ZONE_NAMES[zone.zone_id] || zone.zone_id}
                      </h4>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${badge.border} ${badge.bg} ${badge.text}`}
                    >
                      <badge.icon className="h-3 w-3" />
                      {zone.status}
                    </span>
                  </div>

                  {/* Score & Progress */}
                  <div className="mt-4 flex items-baseline justify-between">
                    <div>
                      <div className="text-2xl font-bold text-white tracking-tight">
                        {zone.current_score.toFixed(1)}
                        <span className="text-xs font-normal text-[#8B949E] ml-1">/ 100</span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-[#8B949E] mt-0.5">
                        <span>Trend:</span>
                        <span className="font-medium text-white flex items-center gap-0.5">
                          {getTrendIcon(zone.trend)}
                          {zone.trend}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-medium text-white flex items-center gap-1 justify-end">
                        <Timer className="h-3 w-3 text-[#8B949E]" />
                        {zone.minutes_since_clean}m
                      </div>
                      <span className="text-[10px] text-[#8B949E]">since clean</span>
                    </div>
                  </div>

                  {/* Score Bar */}
                  <div className="mt-3 w-full bg-[#1A1F26] rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full ${badge.bar}`}
                      style={{ width: `${Math.min(100, Math.max(0, zone.current_score))}%` }}
                    />
                  </div>

                  {/* Telemetry stats */}
                  <div className="mt-4 pt-3 border-t border-white/[0.06] space-y-1.5 text-[11px] text-[#8B949E]">
                    <div className="flex justify-between">
                      <span>Hourly Flushes:</span>
                      <span className="text-white font-medium">{zone.flush_count_last_hour} uses</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Occupancy Load Factor:</span>
                      <span className="text-white font-medium">{(zone.load_factor * 100).toFixed(0)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Missed Cleans (24h):</span>
                      <span className={zone.missed_events_24h > 0 ? "text-[#F04438] font-bold" : "text-white"}>
                        {zone.missed_events_24h}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Action */}
                <div className="mt-4 pt-3 border-t border-white/[0.06]">
                  <button
                    onClick={() => handleCleanNow(zone.zone_id)}
                    disabled={isCleaning}
                    className="w-full py-2 px-3 rounded-lg text-xs font-medium bg-[#1B222C] hover:bg-[#06B6D4]/20 text-[#06B6D4] hover:text-white border border-[#06B6D4]/30 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {isCleaning ? (
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="h-3.5 w-3.5" />
                    )}
                    <span>{isCleaning ? "Sanitizing..." : "Trigger Sanitize Cycle"}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 5. Cleaning Schedule & Audit Trail Table ─────────────────────────── */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <span>Cleaning Operations Log & Audit Trail</span>
              <span className="text-xs text-[#8B949E] font-normal">
                ({filteredEvents.length} events)
              </span>
            </h3>
            <p className="text-xs text-[#8B949E] mt-0.5">
              Historical housekeeping records, scheduled maintenance, and verified score restoration
            </p>
          </div>

          {/* Filters & Search */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="h-3.5 w-3.5 text-[#8B949E] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search staff, notes, zone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-lg text-xs bg-[#101010] border border-white/[0.08] text-white placeholder-[#8B949E] focus:outline-none focus:border-[#06B6D4]/50 w-44"
              />
            </div>

            <select
              value={selectedZone}
              onChange={(e) => setSelectedZone(e.target.value)}
              className="py-1.5 px-3 rounded-lg text-xs bg-[#101010] border border-white/[0.08] text-white focus:outline-none focus:border-[#06B6D4]/50"
            >
              <option value="all">All Zones</option>
              <option value="T2_Restroom_A">Restroom A</option>
              <option value="T2_Restroom_B">Restroom B</option>
              <option value="T2_Family_Room">Family Restroom</option>
              <option value="T2_Staff_WC">Staff WC</option>
            </select>

            <select
              value={eventStatusFilter}
              onChange={(e) => setEventStatusFilter(e.target.value)}
              className="py-1.5 px-3 rounded-lg text-xs bg-[#101010] border border-white/[0.08] text-white focus:outline-none focus:border-[#06B6D4]/50"
            >
              <option value="all">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="missed">Missed</option>
              <option value="scheduled">Scheduled</option>
            </select>
          </div>
        </div>

        {/* Audit Table */}
        <div className="rounded-xl border border-white/[0.08] bg-[#101010] overflow-hidden">
          <div className="overflow-x-auto max-h-[480px]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#161B22] text-[#8B949E] uppercase tracking-wider text-[10px] sticky top-0 z-10 border-b border-white/[0.08]">
                <tr>
                  <th className="py-3 px-4">Zone</th>
                  <th className="py-3 px-4">Scheduled / Completed</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Staff / Attendant</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Score Impact</th>
                  <th className="py-3 px-4">Notes</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {filteredEvents.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-[#8B949E]">
                      No cleaning events match your search or filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredEvents.map((ev) => {
                    const isCompleted = ev.status === "completed";
                    const isMissed = ev.status === "missed";
                    const zoneMeta = ZONE_BADGES[ev.zone_id] || {
                      bg: "bg-white/10",
                      text: "text-white",
                      border: "border-white/20",
                    };
                    const isProcessing = completingEventId === ev.id;

                    return (
                      <tr key={ev.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border ${zoneMeta.border} ${zoneMeta.bg} ${zoneMeta.text}`}
                          >
                            {ev.zone_id.replace("T2_", "")}
                          </span>
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="text-white font-mono text-[11px]">
                            {ev.scheduled_at ? ev.scheduled_at.replace("T", " ").substring(0, 16) : "—"}
                          </div>
                          {ev.completed_at && (
                            <div className="text-[#8B949E] text-[10px]">
                              Completed: {ev.completed_at.replace("T", " ").substring(11, 16)}
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                              isCompleted
                                ? "bg-[#2EB88A]/15 text-[#2EB88A] border-[#2EB88A]/30"
                                : isMissed
                                ? "bg-[#F04438]/15 text-[#F04438] border-[#F04438]/30"
                                : "bg-[#F79009]/15 text-[#F79009] border-[#F79009]/30"
                            }`}
                          >
                            {isCompleted ? (
                              <CheckCircle2 className="h-3 w-3" />
                            ) : isMissed ? (
                              <AlertCircle className="h-3 w-3" />
                            ) : (
                              <Clock className="h-3 w-3" />
                            )}
                            <span className="capitalize">{ev.status}</span>
                          </span>
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap text-white">
                          {ev.completed_by ? (
                            <span className="flex items-center gap-1.5">
                              <UserCheck className="h-3 w-3 text-[#06B6D4]" />
                              {ev.completed_by}
                            </span>
                          ) : (
                            <span className="text-[#8B949E] italic">Unassigned</span>
                          )}
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap text-[#8B949E]">
                          {ev.duration_minutes ? `${ev.duration_minutes} min` : "—"}
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap">
                          {ev.hygiene_score_before !== null || ev.hygiene_score_after !== null ? (
                            <div className="flex items-center gap-1 text-[11px]">
                              <span className="text-[#8B949E]">
                                {ev.hygiene_score_before !== null ? ev.hygiene_score_before.toFixed(0) : "—"}
                              </span>
                              <span className="text-[#8B949E]">→</span>
                              <span className="text-[#2EB88A] font-semibold">
                                {ev.hygiene_score_after !== null ? ev.hygiene_score_after.toFixed(0) : "—"}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[#8B949E]">—</span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-[#8B949E] max-w-xs truncate">
                          {ev.notes || "—"}
                        </td>

                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          {!isCompleted && onCompleteEvent && (
                            <button
                              onClick={() => handleComplete(ev.id)}
                              disabled={isProcessing}
                              className="px-2.5 py-1 rounded text-[11px] font-medium bg-[#2EB88A]/15 hover:bg-[#2EB88A]/25 text-[#2EB88A] border border-[#2EB88A]/30 transition-all inline-flex items-center gap-1 disabled:opacity-50"
                            >
                              {isProcessing ? (
                                <RefreshCw className="h-3 w-3 animate-spin" />
                              ) : (
                                <Check className="h-3 w-3" />
                              )}
                              <span>Mark Done</span>
                            </button>
                          )}
                          {isCompleted && (
                            <span className="text-[#8B949E] text-[11px]">Verified</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
