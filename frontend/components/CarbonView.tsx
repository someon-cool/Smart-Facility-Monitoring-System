"use client";

import { useMemo } from "react";
import { CarbonSummary } from "./types";
import { ImpactSwitcher } from "@/components/impact/ImpactSwitcher";
import { Stat, StatStrip } from "@/components/ui/Stat";
import { Card } from "@/components/ui/Card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/Table";
import { Disclosure } from "@/components/ui/Disclosure";
import { getZoneLabel, ZONE_IDS } from "@/lib/names";
import { formatNumber } from "@/lib/format";

export interface CarbonViewProps {
  summary: CarbonSummary | null;
  loading: boolean;
  onSwitchView?: (view: "sustainability" | "carbon") => void;
}

export function CarbonView({ summary, loading, onSwitchView }: CarbonViewProps) {
  if (loading || !summary) {
    return (
      <div className="space-y-6">
        <ImpactSwitcher
          currentView="carbon"
          onViewChange={onSwitchView || (() => {})}
        />
        <div className="h-64 rounded-[var(--r-md)] border border-[var(--border-hairline)] bg-[var(--bg-surface)] animate-pulse" />
      </div>
    );
  }

  const totalKg = summary.carbon_total_kg;
  const waterKg = summary.carbon_from_water_kg;
  const energyKg = summary.carbon_from_energy_kg;
  const wasteKg = summary.carbon_from_waste_kg;

  const waterPct = totalKg > 0 ? (waterKg / totalKg) * 100 : 0;
  const energyPct = totalKg > 0 ? (energyKg / totalKg) * 100 : 0;
  const wastePct = totalKg > 0 ? (wasteKg / totalKg) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* 1. Header with ImpactSwitcher */}
      <ImpactSwitcher
        currentView="carbon"
        onViewChange={onSwitchView || (() => {})}
      />

      {/* 2. Hero & Stat Strip */}
      <StatStrip>
        <Stat
          hero
          label="Total emissions"
          value={totalKg.toFixed(1)}
          unit="kg CO₂e"
          context="Simulated 7-day operations"
          delta={{
            value: `${Math.abs(summary.vs_benchmark_pct).toFixed(1)}% vs benchmark`,
            direction: summary.vs_benchmark_pct <= 0 ? "down" : "up",
            sentiment: summary.vs_benchmark_pct <= 0 ? "positive" : "negative",
          }}
        />
        <Stat
          label="Water supply embodied"
          value={waterKg.toFixed(1)}
          unit="kg CO₂e"
          context={`${formatNumber(Math.round(summary.total_water_consumed_liters))} L consumed`}
        />
        <Stat
          label="Fixture electrical energy"
          value={energyKg.toFixed(1)}
          unit="kg CO₂e"
          context={`${summary.total_energy_kwh.toFixed(1)} kWh consumed`}
        />
        <Stat
          label="Unresolved water waste"
          value={wasteKg.toFixed(1)}
          unit="kg CO₂e"
          context={`${formatNumber(Math.round(summary.total_water_wasted_liters))} L lost`}
          delta={
            wasteKg > 0
              ? { value: "Actionable", direction: "up", sentiment: "negative" }
              : undefined
          }
        />
      </StatStrip>

      {/* 3. Stacked Horizontal Contributor Bar */}
      <Card tier="standard" className="space-y-4">
        <div>
          <h3 className="text-base font-semibold text-[var(--text-1)] tracking-tight">
            Emissions Contributor Breakdown
          </h3>
          <p className="text-xs text-[var(--text-3)] mt-0.5">
            Apportioned across municipal water extraction, facility electric power, and leak waste.
          </p>
        </div>

        {/* Direct labels row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 font-medium text-[var(--text-1)]">
              <span className="h-2.5 w-2.5 rounded-full bg-[#0ea5e9] inline-block shrink-0" />
              <span>Municipal water:</span>
              <span className="font-mono num font-semibold">{waterKg.toFixed(1)} kg</span>
              <span className="text-[var(--text-3)]">({waterPct.toFixed(0)}%)</span>
            </div>
            <p className="text-caption text-[var(--text-3)]">Pumping, filtration, distribution</p>
          </div>

          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 font-medium text-[var(--text-1)]">
              <span className="h-2.5 w-2.5 rounded-full bg-[#f59e0b] inline-block shrink-0" />
              <span>Electric power:</span>
              <span className="font-mono num font-semibold">{energyKg.toFixed(1)} kg</span>
              <span className="text-[var(--text-3)]">({energyPct.toFixed(0)}%)</span>
            </div>
            <p className="text-caption text-[var(--text-3)]">Sensors, solenoid valves, telemetry</p>
          </div>

          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 font-medium text-[var(--text-1)]">
              <span className="h-2.5 w-2.5 rounded-full bg-[#ef4444] inline-block shrink-0" />
              <span>Leakage waste:</span>
              <span className="font-mono num font-semibold">{wasteKg.toFixed(1)} kg</span>
              <span className="text-[var(--text-3)]">({wastePct.toFixed(0)}%)</span>
            </div>
            <p className="text-caption text-[var(--text-3)]">Avoidable carbon loss from tickets</p>
          </div>
        </div>

        {/* Stacked bar: Distinct communicative colors */}
        <div className="h-7 w-full rounded-[var(--r-sm)] overflow-hidden flex bg-[var(--bg-subtle)] border border-[var(--border-hairline)] shadow-inner">
          <div
            style={{ width: `${waterPct}%` }}
            className="bg-[#0ea5e9] h-full transition-all flex items-center justify-center text-[11px] font-semibold text-white/90 border-r border-[var(--bg-canvas)]"
            title={`Municipal water: ${waterKg.toFixed(1)} kg (${waterPct.toFixed(1)}%)`}
          >
            {waterPct > 15 && `${waterPct.toFixed(0)}%`}
          </div>
          <div
            style={{ width: `${energyPct}%` }}
            className="bg-[#f59e0b] h-full transition-all flex items-center justify-center text-[11px] font-semibold text-white/90 border-r border-[var(--bg-canvas)]"
            title={`Electric power: ${energyKg.toFixed(1)} kg (${energyPct.toFixed(1)}%)`}
          >
            {energyPct > 15 && `${energyPct.toFixed(0)}%`}
          </div>
          <div
            style={{ width: `${wastePct}%` }}
            className="bg-[#ef4444] h-full transition-all flex items-center justify-center text-[11px] font-semibold text-white/90"
            title={`Leakage waste: ${wasteKg.toFixed(1)} kg (${wastePct.toFixed(1)}%)`}
          >
            {wastePct > 8 && `${wastePct.toFixed(0)}%`}
          </div>
        </div>
      </Card>

      {/* 4. Zone Breakdown Table */}
      <section className="space-y-3">
        <h3 className="text-body font-semibold text-[var(--text-1)]">
          Zone emissions apportionment
        </h3>

        <div className="rounded-[var(--r-md)] border border-[var(--border-hairline)] bg-[var(--bg-surface)] overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Zone</TableHead>
                <TableHead align="right">Total emissions</TableHead>
                <TableHead align="right">Water embodied</TableHead>
                <TableHead align="right">Energy embodied</TableHead>
                <TableHead align="right">Water consumed</TableHead>
                <TableHead>Share of total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ZONE_IDS.map((zoneId) => {
                // Find matching breakdown or approximate from proportions
                const zoneData = summary.zone_breakdown?.find(
                  (z: { zone_id: string }) => z.zone_id === zoneId
                );
                const zoneTotal = zoneData?.carbon_total_kg ?? (totalKg * 0.25);
                const zoneWater = zoneData?.carbon_water_kg ?? (waterKg * 0.25);
                const zoneEnergy = zoneData?.carbon_energy_kg ?? (energyKg * 0.25);
                const zoneLiters = zoneData?.water_consumed_liters ?? (summary.total_water_consumed_liters * 0.25);
                const zoneShare = totalKg > 0 ? (zoneTotal / totalKg) * 100 : 25;

                return (
                  <TableRow key={zoneId}>
                    <TableCell>
                      <span className="font-medium text-[var(--text-1)]">
                        {getZoneLabel(zoneId)}
                      </span>
                    </TableCell>
                    <TableCell numeric>{zoneTotal.toFixed(2)} kg</TableCell>
                    <TableCell numeric>{zoneWater.toFixed(2)} kg</TableCell>
                    <TableCell numeric>{zoneEnergy.toFixed(2)} kg</TableCell>
                    <TableCell numeric>{formatNumber(Math.round(zoneLiters))} L</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 rounded-full bg-[var(--border-hairline)] overflow-hidden">
                          <div
                            className="h-full rounded-full bg-[var(--n-600)]"
                            style={{ width: `${zoneShare}%` }}
                          />
                        </div>
                        <span className="font-mono text-xs text-[var(--text-3)] num">
                          {zoneShare.toFixed(0)}%
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </section>

      {/* 5. Methodology Disclosure */}
      <Disclosure title="How we estimate this (CEA 2023 & IPCC BIS Standards)">
        <div className="text-xs text-[var(--text-2)] space-y-2 pt-2 leading-relaxed">
          <p>
            Emissions calculations are deterministic and aligned with Central Electricity
            Authority (CEA) India CO₂ Baseline Database (Version 19, 2023) and municipal
            supply factors:
          </p>
          <ul className="list-disc pl-4 space-y-1 text-[var(--text-3)] font-mono text-[11px]">
            <li>Municipal water embodied intensity: 0.000298 kg CO₂e / Liter</li>
            <li>Indian Northern Regional Grid factor: 0.716 kg CO₂e / kWh</li>
            <li>Standby fixture sensor power: 1.8W continuous</li>
            <li>Active solenoid flush power: 12.0W</li>
          </ul>
        </div>
      </Disclosure>
    </div>
  );
}
