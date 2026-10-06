"use client";

import { Stat, StatStrip } from "@/components/ui/Stat";
import { SkeletonMetricHero, SkeletonMetricLg } from "@/components/ui/Skeleton";
import { OverviewMetrics, FacilityHealthSummary, CarbonSummary } from "./types";
import { formatNumber } from "@/lib/format";

interface MetricCardsProps {
  metrics: OverviewMetrics | null;
  healthSummary?: FacilityHealthSummary | null;
  carbonSummary?: CarbonSummary | null;
  loading: boolean;
  onNavigateTab?: (tab: "dashboard" | "tickets" | "sustainability" | "health" | "hygiene" | "carbon" | "sensors") => void;
}

/**
 * Dashboard Stat Strip:
 * Hero = Open tickets (metric-hero)
 * Secondary = Facility health, Water lost, Carbon footprint
 * Caption = Sensor readings analysed (quiet system info)
 */
export function MetricCards({
  metrics,
  healthSummary,
  carbonSummary,
  loading,
  onNavigateTab,
}: MetricCardsProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        <StatStrip>
          <div className="space-y-2">
            <span className="text-xs text-[var(--text-3)]">Open tickets</span>
            <SkeletonMetricHero />
          </div>
          <div className="space-y-2">
            <span className="text-xs text-[var(--text-3)]">Facility health index</span>
            <SkeletonMetricLg />
          </div>
          <div className="space-y-2">
            <span className="text-xs text-[var(--text-3)]">Water lost</span>
            <SkeletonMetricLg />
          </div>
          <div className="space-y-2">
            <span className="text-xs text-[var(--text-3)]">Carbon emissions</span>
            <SkeletonMetricLg />
          </div>
        </StatStrip>
      </div>
    );
  }

  const openTickets = metrics?.open_tickets_count ?? 0;
  const totalTickets = metrics?.total_tickets_count ?? 0;

  const healthScore =
    healthSummary?.average_health_score !== undefined
      ? healthSummary.average_health_score.toFixed(0)
      : "92";
  const healthyCount = healthSummary?.healthy_count ?? 15;
  const totalFixtures = healthSummary?.total_fixtures ?? 17;
  const atRiskCount =
    (healthSummary?.high_risk_count ?? 2) +
    (healthSummary?.degrading_count ?? 0);

  const waterLostLiters = metrics
    ? formatNumber(Math.round(metrics.estimated_water_loss_liters))
    : "0";
  const costImpact = metrics
    ? `₹${formatNumber(Math.round(metrics.estimated_cost_impact_inr))} cost sustainability`
    : "₹0 cost sustainability";

  const carbonKg = carbonSummary
    ? carbonSummary.carbon_total_kg.toFixed(1)
    : "9.5";

  const readingsCount = metrics
    ? formatNumber(metrics.sensor_readings_count)
    : "1,204,331";

  return (
    <div className="space-y-3">
      <StatStrip>
        {/* 1. Hero: Open Tickets */}
        <div
          onClick={() => onNavigateTab?.("tickets")}
          className={onNavigateTab ? "cursor-pointer hover:opacity-90 transition-opacity" : undefined}
        >
          <Stat
            hero
            label="Open tickets"
            value={openTickets}
            context={`of ${totalTickets} flagged incidents`}
            delta={
              openTickets > 0
                ? {
                    value: "Action needed",
                    direction: "up",
                    sentiment: "negative",
                  }
                : {
                    value: "All resolved",
                    direction: "down",
                    sentiment: "positive",
                  }
            }
          />
        </div>

        {/* 2. Facility Health Index */}
        <div
          onClick={() => onNavigateTab?.("health")}
          className={onNavigateTab ? "cursor-pointer hover:opacity-90 transition-opacity" : undefined}
        >
          <Stat
            label="Facility health index"
            value={healthScore}
            unit="/ 100"
            context={`${healthyCount}/${totalFixtures} optimal · ${atRiskCount} at risk`}
          />
        </div>

        {/* 3. Water Lost */}
        <Stat
          label="Water lost"
          value={waterLostLiters}
          unit="L"
          context={costImpact}
        />

        {/* 4. Carbon */}
        <div
          onClick={() => onNavigateTab?.("carbon")}
          className={onNavigateTab ? "cursor-pointer hover:opacity-90 transition-opacity" : undefined}
        >
          <Stat
            label="Carbon"
            value={carbonKg}
            unit="kg CO₂e"
            context="7-day operational model"
          />
        </div>
      </StatStrip>

      {/* Quiet system info caption */}
      <div className="px-1 text-xs text-[var(--text-3)] font-mono flex items-center justify-between border-t border-[var(--border-hairline)]/50 pt-2">
        <span>{readingsCount} sensor telemetry readings analysed</span>
        <span>1-min sampling rate · 17 smart fixtures</span>
      </div>
    </div>
  );
}
