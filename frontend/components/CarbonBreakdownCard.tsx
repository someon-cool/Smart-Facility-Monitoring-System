"use client";

import React, { useState } from "react";
import { Leaf, Zap, Droplets, AlertTriangle, Info, ChevronDown, ChevronUp, ArrowDownRight } from "lucide-react";
import { CarbonSummary } from "./types";

interface CarbonBreakdownCardProps {
  summary: CarbonSummary | null;
  loading: boolean;
  onExploreMore?: () => void;
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

export function CarbonBreakdownCard({ summary, loading, onExploreMore }: CarbonBreakdownCardProps) {
  const [showMethodology, setShowMethodology] = useState(false);

  if (loading || !summary) {
    return (
      <div className="bg-[#101010] rounded-md p-5 border border-white/[0.08] animate-pulse">
        <div className="h-6 w-48 bg-[#181818] rounded mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="h-24 bg-[#181818] rounded" />
          <div className="h-24 bg-[#181818] rounded" />
          <div className="h-24 bg-[#181818] rounded" />
        </div>
      </div>
    );
  }

  const totalKg = summary.carbon_total_kg;
  const waterKg = summary.carbon_from_water_kg;
  const energyKg = summary.carbon_from_energy_kg;
  const wasteKg = summary.carbon_from_waste_kg;

  // Percentage contributions
  const waterPct = totalKg > 0 ? (waterKg / totalKg) * 100 : 0;
  const energyPct = totalKg > 0 ? (energyKg / totalKg) * 100 : 0;
  const wastePct = totalKg > 0 ? (wasteKg / totalKg) * 100 : 0;

  return (
    <div className="bg-[#101010] rounded-md border border-white/[0.08] p-5 shadow-sm space-y-5">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-[#2EB88A]/15 border border-[#2EB88A]/30 text-[#2EB88A]">
            <Leaf className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-[#F0F6FC] uppercase tracking-wider">
                Estimated Carbon Footprint
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#2EB88A]/10 border border-[#2EB88A]/25 text-[#2EB88A]">
                7-Day Operational Model
              </span>
            </div>
            <p className="text-xs text-[#8B949E] mt-0.5">
              Derived from curated sensor telemetry, power specs, and verified Indian carbon factors (CEA 2023 / IPCC)
            </p>
          </div>
        </div>

        {/* Total Metric Headline */}
        <div className="flex items-center gap-4 bg-[#080808] px-4 py-2.5 rounded-lg border border-white/[0.06] self-start sm:self-auto">
          <div>
            <div className="text-[10px] uppercase font-semibold text-[#8B949E] tracking-wider">Facility Total</div>
            <div className="text-xl font-bold font-mono text-[#F0F6FC]">
              {totalKg.toFixed(2)} <span className="text-xs font-normal text-[#8B949E]">kg CO₂e</span>
            </div>
          </div>
          <div className="h-8 w-px bg-white/[0.08]" />
          <div>
            <div className="text-[10px] uppercase font-semibold text-[#8B949E] tracking-wider">Peer Baseline</div>
            <div className="flex items-center gap-1 text-xs font-semibold text-[#2EB88A]">
              <ArrowDownRight className="h-3.5 w-3.5" />
              <span>{Math.abs(summary.vs_benchmark_pct).toFixed(1)}% vs Airport Avg</span>
            </div>
          </div>
        </div>
      </div>

      {/* Primary Contributor Stacked Visualizer */}
      <div>
        <div className="flex items-center justify-between text-xs text-[#8B949E] mb-2">
          <span className="font-semibold uppercase text-[11px] text-[#C9D1D9] tracking-wider">
            Main Contributor Breakdown
          </span>
          <span className="font-mono text-[11px]">{totalKg.toFixed(2)} kg CO₂e (100%)</span>
        </div>

        {/* Stacked Progress Bar */}
        <div className="h-3 w-full bg-[#1A1A1A] rounded-full overflow-hidden flex shadow-inner">
          <div
            style={{ width: `${waterPct}%` }}
            className="bg-[#4D88C7] hover:brightness-110 transition-all cursor-pointer"
            title={`Operational Water: ${waterKg.toFixed(2)} kg (${waterPct.toFixed(1)}%)`}
          />
          <div
            style={{ width: `${energyPct}%` }}
            className="bg-[#F59E0B] hover:brightness-110 transition-all cursor-pointer"
            title={`Fixture Electricity: ${energyKg.toFixed(2)} kg (${energyPct.toFixed(1)}%)`}
          />
          <div
            style={{ width: `${wastePct}%` }}
            className="bg-[#F04438] hover:brightness-110 transition-all cursor-pointer"
            title={`Fault/Wasted Water: ${wasteKg.toFixed(2)} kg (${wastePct.toFixed(1)}%)`}
          />
        </div>
      </div>

      {/* 3 Main Contributor Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {/* Contributor 1: Water Consumption */}
        <div className="bg-[#0B0D11] border border-[#4D88C7]/20 rounded-md p-3.5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded bg-[#4D88C7]/15 text-[#4D88C7]">
                <Droplets className="h-4 w-4" />
              </div>
              <span className="text-xs font-semibold text-[#F0F6FC]">Operational Water</span>
            </div>
            <span className="text-[11px] font-mono font-bold text-[#4D88C7]">
              {waterPct.toFixed(1)}%
            </span>
          </div>
          <div className="mt-2.5">
            <div className="text-lg font-bold font-mono text-[#F0F6FC]">
              {waterKg.toFixed(3)} <span className="text-xs font-normal text-[#8B949E]">kg CO₂e</span>
            </div>
            <p className="text-[11px] text-[#8B949E] mt-0.5">
              From {summary.total_water_consumed_liters.toLocaleString()} L consumed flow
            </p>
          </div>
        </div>

        {/* Contributor 2: Fixture Electricity */}
        <div className="bg-[#0B0D11] border border-[#F59E0B]/20 rounded-md p-3.5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded bg-[#F59E0B]/15 text-[#F59E0B]">
                <Zap className="h-4 w-4" />
              </div>
              <span className="text-xs font-semibold text-[#F0F6FC]">Fixture Electricity</span>
            </div>
            <span className="text-[11px] font-mono font-bold text-[#F59E0B]">
              {energyPct.toFixed(1)}%
            </span>
          </div>
          <div className="mt-2.5">
            <div className="text-lg font-bold font-mono text-[#F0F6FC]">
              {energyKg.toFixed(3)} <span className="text-xs font-normal text-[#8B949E]">kg CO₂e</span>
            </div>
            <p className="text-[11px] text-[#8B949E] mt-0.5">
              From {summary.total_energy_kwh.toFixed(2)} kWh sensors &amp; solenoid valves
            </p>
          </div>
        </div>

        {/* Contributor 3: Wasted Water from Leaks */}
        <div className="bg-[#0B0D11] border border-[#F04438]/20 rounded-md p-3.5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded bg-[#F04438]/15 text-[#F04438]">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <span className="text-xs font-semibold text-[#F0F6FC]">Wasted Water (Faults)</span>
            </div>
            <span className="text-[11px] font-mono font-bold text-[#F04438]">
              {wastePct.toFixed(1)}%
            </span>
          </div>
          <div className="mt-2.5">
            <div className="text-lg font-bold font-mono text-[#F0F6FC]">
              {wasteKg.toFixed(3)} <span className="text-xs font-normal text-[#8B949E]">kg CO₂e</span>
            </div>
            <p className="text-[11px] text-[#8B949E] mt-0.5">
              From {summary.total_water_wasted_liters.toLocaleString()} L uncontained leaks
            </p>
          </div>
        </div>
      </div>

      {/* Zone Distribution Breakdown */}
      {summary.zone_breakdown && summary.zone_breakdown.length > 0 && (
        <div className="pt-2 border-t border-white/[0.06]">
          <div className="text-[11px] font-semibold uppercase text-[#C9D1D9] tracking-wider mb-2.5">
            Zone Emission Distribution
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {summary.zone_breakdown.map((zone) => {
              const zonePct = totalKg > 0 ? (zone.carbon_total_kg / totalKg) * 100 : 0;
              const color = ZONE_COLORS[zone.zone_id] || "#4D88C7";
              return (
                <div key={zone.zone_id} className="bg-[#080808] p-3 rounded border border-white/[0.05]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-[#F0F6FC]">
                      {ZONE_LABELS[zone.zone_id] || zone.zone_id}
                    </span>
                    <span className="text-[11px] font-mono font-semibold" style={{ color }}>
                      {zonePct.toFixed(1)}%
                    </span>
                  </div>
                  <div className="mt-1 flex items-baseline justify-between">
                    <span className="text-sm font-mono font-bold text-[#F0F6FC]">
                      {zone.carbon_total_kg.toFixed(2)} <span className="text-[10px] text-[#8B949E]">kg</span>
                    </span>
                    <span className="text-[10px] text-[#8B949E]">
                      {zone.water_consumed_liters.toFixed(0)} L · {zone.energy_kwh.toFixed(2)} kWh
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 w-full bg-[#1A1A1A] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${Math.min(100, zonePct)}%`, backgroundColor: color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Calculation Methodology Disclosure */}
      <div className="pt-1">
        <button
          onClick={() => setShowMethodology(!showMethodology)}
          className="flex items-center gap-1.5 text-xs text-[#8B949E] hover:text-[#C9D1D9] transition-colors"
        >
          <Info className="h-3.5 w-3.5 text-[#2EB88A]" />
          <span>Calculation Methodology &amp; Emission Factors</span>
          {showMethodology ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>

        {showMethodology && (
          <div className="mt-3 p-3 bg-[#080808] rounded-md border border-white/[0.06] text-xs text-[#8B949E] space-y-1.5">
            <p>
              • <strong className="text-[#F0F6FC]">Water Carbon Factor:</strong> 0.000298 kg CO₂e/L (IPCC &amp; Bureau of Indian Standards municipal water pumping &amp; treatment benchmark).
            </p>
            <p>
              • <strong className="text-[#F0F6FC]">Electricity Carbon Factor:</strong> 0.82 kg CO₂e/kWh (Central Electricity Authority CEA 2023 national grid average).
            </p>
            <p>
              • <strong className="text-[#F0F6FC]">Peer Baseline:</strong> 2.10 kg CO₂e/day (14.7 kg CO₂e/week standard for comparable Indian airport terminal blocks).
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
