"use client";

import {
  ShieldCheck,
  Activity,
  Clock,
  UserX,
  Gauge,
  Info,
} from "lucide-react";
import { TicketEvidence } from "./types";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/Popover";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/cn";

export interface EvidencePanelProps {
  evidence: TicketEvidence;
  className?: string;
}

export function EvidencePanel({ evidence, className }: EvidencePanelProps) {
  const {
    expected_flow_lpm,
    observed_flow_lpm,
    flow_deviation_lpm,
    duration_minutes,
    occupancy_rate,
    occupancy_mismatch,
    sensor_health,
    normalized_flow_deviation,
    normalized_duration,
    normalized_occupancy_mismatch,
    normalized_sensor_health,
    evidence_strength_score,
    evidence_strength_label,
  } = evidence;

  const strengthBadgeStatus =
    evidence_strength_label === "Strong"
      ? "healthy"
      : evidence_strength_label === "Moderate"
      ? "warning"
      : "info";

  return (
    <div
      className={cn(
        "rounded-[var(--r-md)] border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-4 space-y-4",
        className
      )}
    >
      {/* 1. Header & Evidence Strength & Info Popover */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-hairline)] pb-2.5">
        <div className="flex items-center gap-2">
          <h4 className="text-body font-semibold text-[var(--text-1)]">
            Telemetry evidence breakdown
          </h4>
          {/* Info Popover replacing the inline weighting formula paragraph */}
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="inline-flex items-center text-[var(--text-3)] hover:text-[var(--text-1)] cursor-pointer"
                aria-label="How evidence is weighted"
              >
                <Info className="h-3.5 w-3.5" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-72 text-xs space-y-2 p-3">
              <p className="font-semibold text-[var(--text-1)]">
                How evidence is weighted
              </p>
              <p className="font-mono text-[11px] text-[var(--text-2)]">
                30% Flow deviation + 25% Duration span + 25% Occupancy mismatch + 20% Sensor diagnostic
              </p>
              <p className="text-[var(--text-3)] leading-relaxed">
                Deterministic scores are computed against baseline moving averages for the fixture class.
              </p>
            </PopoverContent>
          </Popover>
        </div>

        {/* Strength Badge */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--text-3)]">Confidence:</span>
          <Badge status={strengthBadgeStatus}>
            {evidence_strength_label} ({evidence_strength_score}/100)
          </Badge>
        </div>
      </div>

      {/* 2. Four Multi-Signal Evidence Bars with Consolidated Telemetry */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Flow Deviation */}
        <div className="space-y-1.5 rounded-[var(--r-sm)] border border-[var(--border-hairline)] bg-[var(--bg-subtle)] p-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[var(--text-2)] flex items-center gap-1.5 font-medium">
              <Activity className="h-3.5 w-3.5 text-[var(--text-1)]" /> Flow
            </span>
            <span className="font-mono num font-semibold text-[var(--text-1)]">
              {normalized_flow_deviation}%
            </span>
          </div>
          <div className="h-1.5 w-full bg-[var(--border-hairline)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--text-1)] rounded-full transition-all"
              style={{
                width: `${Math.min(100, Math.max(0, normalized_flow_deviation))}%`,
              }}
            />
          </div>
          <div className="text-[11px] text-[var(--text-3)] leading-relaxed">
            {observed_flow_lpm.toFixed(2)} L/min vs {expected_flow_lpm.toFixed(2)} L/min base (+{flow_deviation_lpm.toFixed(2)} L/m)
          </div>
        </div>

        {/* Duration */}
        <div className="space-y-1.5 rounded-[var(--r-sm)] border border-[var(--border-hairline)] bg-[var(--bg-subtle)] p-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[var(--text-2)] flex items-center gap-1.5 font-medium">
              <Clock className="h-3.5 w-3.5 text-[var(--text-1)]" /> Duration
            </span>
            <span className="font-mono num font-semibold text-[var(--text-1)]">
              {normalized_duration}%
            </span>
          </div>
          <div className="h-1.5 w-full bg-[var(--border-hairline)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--text-1)] rounded-full transition-all"
              style={{
                width: `${Math.min(100, Math.max(0, normalized_duration))}%`,
              }}
            />
          </div>
          <div className="text-[11px] text-[var(--text-3)] leading-relaxed">
            Continuous for {duration_minutes} minutes
          </div>
        </div>

        {/* Occupancy Mismatch */}
        <div className="space-y-1.5 rounded-[var(--r-sm)] border border-[var(--border-hairline)] bg-[var(--bg-subtle)] p-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[var(--text-2)] flex items-center gap-1.5 font-medium">
              <UserX className="h-3.5 w-3.5 text-[var(--text-1)]" /> Occupancy
            </span>
            <span className="font-mono num font-semibold text-[var(--text-1)]">
              {normalized_occupancy_mismatch}%
            </span>
          </div>
          <div className="h-1.5 w-full bg-[var(--border-hairline)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--text-1)] rounded-full transition-all"
              style={{
                width: `${Math.min(100, Math.max(0, normalized_occupancy_mismatch))}%`,
              }}
            />
          </div>
          <div className="text-[11px] text-[var(--text-3)] leading-relaxed">
            {occupancy_mismatch === 1.0 || occupancy_rate === 0.0
              ? "Zero room occupancy during flow"
              : `${Math.round(occupancy_rate * 100)}% occupied (${Math.round(occupancy_mismatch * 100)}% mismatch)`}
          </div>
        </div>

        {/* Sensor Health */}
        <div className="space-y-1.5 rounded-[var(--r-sm)] border border-[var(--border-hairline)] bg-[var(--bg-subtle)] p-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[var(--text-2)] flex items-center gap-1.5 font-medium">
              <Gauge className="h-3.5 w-3.5 text-[var(--text-1)]" /> Diagnostic
            </span>
            <span className="font-mono num font-semibold text-[var(--text-1)]">
              {normalized_sensor_health}%
            </span>
          </div>
          <div className="h-1.5 w-full bg-[var(--border-hairline)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--text-1)] rounded-full transition-all"
              style={{
                width: `${Math.min(100, Math.max(0, normalized_sensor_health))}%`,
              }}
            />
          </div>
          <div className="text-[11px] text-[var(--text-3)] leading-relaxed">
            Sensor telemetry health: {sensor_health}
          </div>
        </div>
      </div>

      {/* 3. Operational Rationale */}
      <div className="text-xs text-[var(--text-2)] bg-[var(--bg-subtle)] p-2.5 rounded-[var(--r-sm)] border border-[var(--border-hairline)]">
        {occupancy_mismatch === 1.0
          ? "Continuous water flow detected while the stall remained completely unoccupied. Inconsistent with human usage — indicates valve diaphragm or seal failure."
          : "Flow rate exceeded historical moving baseline during detected usage."}
      </div>
    </div>
  );
}
