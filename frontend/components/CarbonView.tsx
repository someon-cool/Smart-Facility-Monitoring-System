"use client";

import React, { useState } from "react";
import {
  Leaf,
  Zap,
  Droplets,
  AlertTriangle,
  ArrowDownRight,
  ShieldCheck,
  TrendingDown,
  Building2,
  DollarSign,
  Info,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { CarbonSummary } from "./types";

interface CarbonViewProps {
  summary: CarbonSummary | null;
  loading: boolean;
}

const ZONE_LABELS: Record<string, string> = {
  T2_Restroom_A: "Restroom A (Departure)",
  T2_Restroom_B: "Restroom B (Arrival)",
  T2_Staff_WC: "Staff WC",
  T2_Family_Room: "Family Room",
};

const ZONE_COLORS: Record<string, string> = {
  T2_Restroom_A: "#4D88C7",
  T2_Restroom_B: "#2EB88A",
  T2_Staff_WC: "#A855F7",
  T2_Family_Room: "#F59E0B",
};

export function CarbonView({ summary, loading }: CarbonViewProps) {
  const [showMethodology, setShowMethodology] = useState(false);

  if (loading || !summary) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-20 bg-[#101010] rounded-md" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-[#101010] rounded-md" />
          ))}
        </div>
        <div className="h-64 bg-[#101010] rounded-md" />
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
      {/* 1. Header Banner */}
      <div className="bg-[#101010] rounded-md p-5 border border-white/[0.08] shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-[#2EB88A]/15 border border-[#2EB88A]/30 text-[#2EB88A]">
              <Leaf className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#F0F6FC] tracking-wide uppercase">
                  Carbon Footprint &amp; GHG Emissions
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#2EB88A]/10 border border-[#2EB88A]/25 text-[#2EB88A]">
                  7-Day Curated Telemetry
                </span>
              </div>
              <p className="text-xs text-[#8B949E] mt-0.5">
                Comprehensive greenhouse gas accounting based on flow rates, fixture power draws, and Indian emissions benchmarks
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#2EB88A]/10 text-[#2EB88A] border border-[#2EB88A]/25">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>CEA 2023 &amp; IPCC BIS Standards</span>
            </span>
          </div>
        </div>
      </div>

      {/* 2. Top-Level Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Carbon Footprint */}
        <div className="bg-[#101010] rounded-md p-4.5 border border-white/[0.08] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#8B949E] uppercase tracking-wider">
              Total Carbon Footprint
            </span>
            <div className="h-8 w-8 rounded-lg bg-[#2EB88A]/15 border border-[#2EB88A]/30 flex items-center justify-center text-[#2EB88A]">
              <Leaf className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-[#F0F6FC] tracking-tight font-mono">
              {totalKg.toFixed(2)} <span className="text-xs font-normal text-[#8B949E]">kg CO₂e</span>
            </div>
            <div className="flex items-center gap-1 text-xs font-semibold text-[#2EB88A] mt-1">
              <ArrowDownRight className="h-3.5 w-3.5" />
              <span>{Math.abs(summary.vs_benchmark_pct).toFixed(1)}% below peer baseline</span>
            </div>
          </div>
        </div>

        {/* Card 2: Operational Water Carbon */}
        <div className="bg-[#101010] rounded-md p-4.5 border border-white/[0.08] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#8B949E] uppercase tracking-wider">
              Operational Water CO₂
            </span>
            <div className="h-8 w-8 rounded-lg bg-[#4D88C7]/15 border border-[#4D88C7]/30 flex items-center justify-center text-[#4D88C7]">
              <Droplets className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-[#F0F6FC] tracking-tight font-mono">
              {waterKg.toFixed(2)} <span className="text-xs font-normal text-[#8B949E]">kg CO₂e</span>
            </div>
            <p className="text-xs text-[#8B949E] mt-1">
              <span className="text-[#4D88C7] font-semibold">{waterPct.toFixed(1)}%</span> of total ({summary.total_water_consumed_liters.toLocaleString()} L)
            </p>
          </div>
        </div>

        {/* Card 3: Fixture Electricity Carbon */}
        <div className="bg-[#101010] rounded-md p-4.5 border border-white/[0.08] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#8B949E] uppercase tracking-wider">
              Grid Electricity CO₂
            </span>
            <div className="h-8 w-8 rounded-lg bg-[#F59E0B]/15 border border-[#F59E0B]/30 flex items-center justify-center text-[#F59E0B]">
              <Zap className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-[#F0F6FC] tracking-tight font-mono">
              {energyKg.toFixed(2)} <span className="text-xs font-normal text-[#8B949E]">kg CO₂e</span>
            </div>
            <p className="text-xs text-[#8B949E] mt-1">
              <span className="text-[#F59E0B] font-semibold">{energyPct.toFixed(1)}%</span> of total ({summary.total_energy_kwh.toFixed(2)} kWh)
            </p>
          </div>
        </div>

        {/* Card 4: Water Waste Carbon */}
        <div className="bg-[#101010] rounded-md p-4.5 border border-white/[0.08] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#8B949E] uppercase tracking-wider">
              Avoidable Waste CO₂
            </span>
            <div className="h-8 w-8 rounded-lg bg-[#F04438]/15 border border-[#F04438]/30 flex items-center justify-center text-[#F04438]">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-[#F0F6FC] tracking-tight font-mono">
              {wasteKg.toFixed(2)} <span className="text-xs font-normal text-[#8B949E]">kg CO₂e</span>
            </div>
            <p className="text-xs text-[#8B949E] mt-1">
              <span className="text-[#F04438] font-semibold">{wastePct.toFixed(1)}%</span> from {summary.total_water_wasted_liters.toLocaleString()} L leaks
            </p>
          </div>
        </div>
      </div>

      {/* 3. Main Contributors Breakdown Section */}
      <div className="bg-[#101010] rounded-md border border-white/[0.08] p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#C9D1D9]">
            Emission Source Proportions
          </h3>
          <span className="text-xs font-mono text-[#8B949E]">
            Total: {totalKg.toFixed(2)} kg CO₂e
          </span>
        </div>

        {/* Proportion bar */}
        <div className="h-4 w-full bg-[#1A1A1A] rounded-full overflow-hidden flex shadow-inner">
          <div
            style={{ width: `${waterPct}%` }}
            className="bg-[#4D88C7] hover:brightness-110 transition-all"
            title={`Operational Water: ${waterKg.toFixed(2)} kg CO₂e (${waterPct.toFixed(1)}%)`}
          />
          <div
            style={{ width: `${energyPct}%` }}
            className="bg-[#F59E0B] hover:brightness-110 transition-all"
            title={`Fixture Electricity: ${energyKg.toFixed(2)} kg CO₂e (${energyPct.toFixed(1)}%)`}
          />
          <div
            style={{ width: `${wastePct}%` }}
            className="bg-[#F04438] hover:brightness-110 transition-all"
            title={`Wasted Water: ${wasteKg.toFixed(2)} kg CO₂e (${wastePct.toFixed(1)}%)`}
          />
        </div>

        {/* Legend */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="flex items-start gap-2.5">
            <span className="h-3 w-3 rounded-full bg-[#4D88C7] mt-0.5 shrink-0" />
            <div>
              <div className="text-xs font-semibold text-[#F0F6FC]">
                Operational Water Consumption ({waterPct.toFixed(1)}%)
              </div>
              <div className="text-xs text-[#8B949E] mt-0.5">
                {waterKg.toFixed(3)} kg CO₂e · 20,320 L flow across smart faucets &amp; flushes
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <span className="h-3 w-3 rounded-full bg-[#F59E0B] mt-0.5 shrink-0" />
            <div>
              <div className="text-xs font-semibold text-[#F0F6FC]">
                Smart Fixture Electricity ({energyPct.toFixed(1)}%)
              </div>
              <div className="text-xs text-[#8B949E] mt-0.5">
                {energyKg.toFixed(3)} kg CO₂e · 2.98 kWh power draw (8W active / 0.5W idle)
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <span className="h-3 w-3 rounded-full bg-[#F04438] mt-0.5 shrink-0" />
            <div>
              <div className="text-xs font-semibold text-[#F0F6FC]">
                Wasted Water from Leaks ({wastePct.toFixed(1)}%)
              </div>
              <div className="text-xs text-[#8B949E] mt-0.5">
                {wasteKg.toFixed(3)} kg CO₂e · 3,461.6 L loss from anomaly ticket incidents
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Zone Breakdown Table */}
      <div className="bg-[#101010] rounded-md border border-white/[0.08] p-5 shadow-sm space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#C9D1D9]">
          Zone-by-Zone Carbon Contribution
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#F0F6FC]">
            <thead className="bg-[#080808] text-[#8B949E] uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-2.5 px-3">Zone</th>
                <th className="py-2.5 px-3 text-right">Water (L)</th>
                <th className="py-2.5 px-3 text-right">Energy (kWh)</th>
                <th className="py-2.5 px-3 text-right">Water CO₂ (kg)</th>
                <th className="py-2.5 px-3 text-right">Energy CO₂ (kg)</th>
                <th className="py-2.5 px-3 text-right">Waste CO₂ (kg)</th>
                <th className="py-2.5 px-3 text-right font-bold text-[#F0F6FC]">Total CO₂ (kg)</th>
                <th className="py-2.5 px-3 text-right">% of Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {summary.zone_breakdown.map((z) => {
                const pct = totalKg > 0 ? (z.carbon_total_kg / totalKg) * 100 : 0;
                const color = ZONE_COLORS[z.zone_id] || "#4D88C7";
                return (
                  <tr key={z.zone_id} className="hover:bg-[#151515] transition-colors">
                    <td className="py-3 px-3 font-medium flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
                      <span>{ZONE_LABELS[z.zone_id] || z.zone_id}</span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-[#8B949E]">
                      {z.water_consumed_liters.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-[#8B949E]">
                      {z.energy_kwh.toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-[#4D88C7]">
                      {z.carbon_water_kg.toFixed(3)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-[#F59E0B]">
                      {z.carbon_energy_kg.toFixed(3)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-[#F04438]">
                      {z.carbon_waste_kg.toFixed(3)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-[#F0F6FC]">
                      {z.carbon_total_kg.toFixed(3)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-semibold" style={{ color }}>
                      {pct.toFixed(1)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Methodology Disclosure */}
      <div className="bg-[#101010] rounded-md border border-white/[0.08] p-5 shadow-sm">
        <button
          onClick={() => setShowMethodology(!showMethodology)}
          className="flex items-center justify-between w-full text-xs text-[#8B949E] hover:text-[#C9D1D9] transition-colors"
        >
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-[#2EB88A]" />
            <span className="font-semibold uppercase tracking-wider text-[#C9D1D9]">
              Calculation Methodology &amp; Regulatory Benchmark Standards
            </span>
          </div>
          {showMethodology ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>

        {showMethodology && (
          <div className="mt-4 pt-4 border-t border-white/[0.06] text-xs text-[#8B949E] space-y-2">
            <p>
              • <strong className="text-[#F0F6FC]">Water Carbon Factor:</strong> 0.000298 kg CO₂e/L (derived from IPCC 2006 / BIS Indian municipal water conveyance, pumping, and wastewater treatment averages).
            </p>
            <p>
              • <strong className="text-[#F0F6FC]">Grid Electricity Factor:</strong> 0.82 kg CO₂e/kWh (Central Electricity Authority CEA 2023 National Average Grid Emission Factor for India).
            </p>
            <p>
              • <strong className="text-[#F0F6FC]">Fixture Power Specs:</strong> Active solenoid valve draw = 8.0W (during flow events); Idle sensor standby = 0.5W.
            </p>
            <p>
              • <strong className="text-[#F0F6FC]">Peer Baseline:</strong> 2.10 kg CO₂e/day (14.7 kg CO₂e/7-day period for comparable high-traffic airport terminal facilities).
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
