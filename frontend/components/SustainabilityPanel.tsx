"use client";

import { SustainabilitySummary } from "./types";
import { ImpactSwitcher } from "@/components/impact/ImpactSwitcher";
import { Stat, StatStrip } from "@/components/ui/Stat";
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

export interface SustainabilityPanelProps {
  summary: SustainabilitySummary | null;
  loading: boolean;
  onSwitchView?: (view: "sustainability" | "carbon") => void;
}

export function SustainabilityPanel({
  summary,
  loading,
  onSwitchView,
}: SustainabilityPanelProps) {
  if (loading || !summary) {
    return (
      <div className="space-y-6">
        <ImpactSwitcher
          currentView="sustainability"
          onViewChange={onSwitchView || (() => {})}
        />
        <div className="h-64 rounded-[var(--r-md)] border border-[var(--border-hairline)] bg-[var(--bg-surface)] animate-pulse" />
      </div>
    );
  }

  const {
    water_waste_liters,
    water_saved_liters,
    cost_impact_inr,
    avoided_cost_inr,
    projected_unresolved_loss_24h_liters,
    zone_breakdown,
  } = summary;

  return (
    <div className="space-y-6">
      {/* 1. Header with ImpactSwitcher */}
      <ImpactSwitcher
        currentView="sustainability"
        onViewChange={onSwitchView || (() => {})}
      />

      {/* 2. Hero & Stat Strip */}
      <StatStrip>
        <Stat
          hero
          label="Water saved / avoided"
          value={formatNumber(Math.round(water_saved_liters))}
          unit="L"
          context={`₹${formatNumber(Math.round(avoided_cost_inr))} cost avoided`}
          delta={{
            value: "Preventive sustainability",
            direction: "up",
            sentiment: "positive",
          }}
        />
        <Stat
          label="Active water waste"
          value={formatNumber(Math.round(water_waste_liters))}
          unit="L"
          context={`₹${formatNumber(Math.round(cost_impact_inr))} cost sustainability`}
          delta={
            water_waste_liters > 0
              ? { value: "Loss", direction: "up", sentiment: "negative" }
              : undefined
          }
        />
        <Stat
          label="Projected 24h loss (unresolved)"
          value={formatNumber(Math.round(projected_unresolved_loss_24h_liters))}
          unit="L"
          context="Without crew dispatch"
        />
        <Stat
          label="Avoided tariff sustainability"
          value={`₹${formatNumber(Math.round(avoided_cost_inr))}`}
          context="Municipal utility savings"
        />
      </StatStrip>

      {/* 3. Zone Breakdown Table */}
      <section className="space-y-3">
        <h3 className="text-body font-semibold text-[var(--text-1)]">
          Zone water conservation breakdown
        </h3>

        <div className="rounded-[var(--r-md)] border border-[var(--border-hairline)] bg-[var(--bg-surface)] overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Zone</TableHead>
                <TableHead align="right">Water waste</TableHead>
                <TableHead align="right">Water avoided</TableHead>
                <TableHead align="right">Cost sustainability</TableHead>
                <TableHead align="right">Avoided tariff</TableHead>
                <TableHead>Recovery ratio</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ZONE_IDS.map((zoneId) => {
                const zone = zone_breakdown?.find((z) => z.zone_id === zoneId);
                const waste = zone?.water_waste_liters ?? 0;
                const saved = zone?.water_saved_liters ?? 0;
                const cost = zone?.cost_impact_inr ?? 0;
                const avoided = zone?.avoided_cost_inr ?? 0;

                const total = waste + saved;
                const recoveryPct = total > 0 ? (saved / total) * 100 : 100;

                return (
                  <TableRow key={zoneId}>
                    <TableCell>
                      <span className="font-medium text-[var(--text-1)]">
                        {getZoneLabel(zoneId)}
                      </span>
                    </TableCell>
                    <TableCell numeric>{formatNumber(Math.round(waste))} L</TableCell>
                    <TableCell numeric>
                      <span className="text-[var(--healthy-fg)] font-semibold">
                        {formatNumber(Math.round(saved))} L
                      </span>
                    </TableCell>
                    <TableCell numeric>₹{formatNumber(Math.round(cost))}</TableCell>
                    <TableCell numeric>₹{formatNumber(Math.round(avoided))}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 rounded-full bg-[var(--border-hairline)] overflow-hidden">
                          <div
                            className="h-full rounded-full bg-[var(--healthy-solid)]"
                            style={{ width: `${recoveryPct}%` }}
                          />
                        </div>
                        <span className="font-mono text-xs text-[var(--text-3)] num">
                          {recoveryPct.toFixed(0)}%
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

      {/* 4. Methodology & Baseline Model Disclosure */}
      <Disclosure title="How we estimate this (Counterfactual 24h Baseline Model)">
        <div className="text-xs text-[var(--text-2)] space-y-2 pt-2 leading-relaxed">
          <p>
            Conservation metrics are determined counterfactually by computing the volume
            of water that would have been lost if an anomaly went uncorrected across a
            standard 24-hour operational shift:
          </p>
          <div className="p-3 rounded-[var(--r-sm)] bg-[var(--bg-subtle)] text-[var(--text-3)] font-mono text-[11px] space-y-1">
            <div>Avoided Volume (L) = (Observed LPM − Baseline LPM) × (24h − Duration min)</div>
            <div>Municipal Tariff: ₹3.00 / 1000 Liters (Tier 2 commercial rate)</div>
          </div>
          <p className="text-[11px] text-[var(--text-3)]">
            Verified ticket resolutions freeze the loss counter and credit the remainder
            of the 24-hour horizon to facility water recovery.
          </p>
        </div>
      </Disclosure>
    </div>
  );
}
