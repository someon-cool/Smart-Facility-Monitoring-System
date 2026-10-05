"use client";

import React, { useState, useMemo } from "react";
import {
  Radio,
  Wifi,
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Search,
  Filter,
  Cpu,
  Gauge,
  Clock,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { SensorRecord, SensorFleetSummary } from "./types";

interface SensorIntelligenceSectionProps {
  summary: SensorFleetSummary | null;
  sensors: SensorRecord[];
  loading: boolean;
}

const ZONE_LABELS: Record<string, string> = {
  T2_Restroom_A: "Restroom A (Departure)",
  T2_Restroom_B: "Restroom B (Arrival)",
  T2_Staff_WC: "Staff WC",
  T2_Family_Room: "Family Room",
};

const SENSOR_TYPE_LABELS: Record<string, string> = {
  infrared: "Infrared Proximity (Sinks)",
  ultrasonic: "Ultrasonic Stall (Toilets)",
  passive_infrared: "Passive IR (Urinals)",
};

export function SensorIntelligenceSection({
  summary,
  sensors,
  loading,
}: SensorIntelligenceSectionProps) {
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedZone, setSelectedZone] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  const filteredSensors = useMemo(() => {
    return sensors.filter((s) => {
      const matchType = selectedType === "all" || s.sensor_type === selectedType;
      const matchZone = selectedZone === "all" || s.zone_id === selectedZone;
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        s.fixture_id.toLowerCase().includes(q) ||
        s.display_name.toLowerCase().includes(q) ||
        s.brand_model.toLowerCase().includes(q) ||
        s.sensor_tech_label.toLowerCase().includes(q);
      return matchType && matchZone && matchQuery;
    });
  }, [sensors, selectedType, selectedZone, searchQuery]);

  if (loading && sensors.length === 0) {
    return (
      <div className="bg-[#101010] rounded-md border border-white/[0.08] p-5 animate-pulse space-y-4">
        <div className="h-6 w-56 bg-[#181818] rounded" />
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-[#181818] rounded" />
          ))}
        </div>
        <div className="h-64 bg-[#181818] rounded" />
      </div>
    );
  }

  const total = summary?.total_sensors ?? sensors.length;
  const online = summary?.online_count ?? sensors.filter((s) => s.status === "OK").length;
  const degraded = summary?.degraded_count ?? sensors.filter((s) => s.status === "DEGRADED").length;
  const fault = summary?.fault_count ?? sensors.filter((s) => s.status === "FAULT" || s.status === "OFFLINE").length;
  const avgUptime = summary?.average_uptime_pct ?? 99.6;

  return (
    <div className="bg-[#101010] rounded-md border border-white/[0.08] p-5 shadow-sm space-y-5">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-[#4D88C7]/15 border border-[#4D88C7]/30 text-[#4D88C7]">
            <Cpu className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-[#F0F6FC] uppercase tracking-wider">
                Sensor Intelligence &amp; Status
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#4D88C7]/10 border border-[#4D88C7]/25 text-[#4D88C7]">
                {total} Commercial IoT Units
              </span>
            </div>
            <p className="text-xs text-[#8B949E] mt-0.5">
              Live telemetry, measurement parameters, and operating status from all integrated fixture sensors
            </p>
          </div>
        </div>

        {/* Quick Fleet Health Badges */}
        <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#080808] border border-white/[0.06] text-xs">
            <span className="h-2 w-2 rounded-full bg-[#2EB88A] animate-pulse" />
            <span className="font-semibold text-[#F0F6FC]">{online}</span>
            <span className="text-[#8B949E]">Online</span>
          </div>

          {degraded > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F59E0B]/10 border border-[#F59E0B]/25 text-xs text-[#F59E0B]">
              <AlertTriangle className="h-3.5 w-3.5" />
              <span className="font-semibold">{degraded}</span> Degraded
            </div>
          )}

          {fault > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F04438]/10 border border-[#F04438]/25 text-xs text-[#F04438]">
              <XCircle className="h-3.5 w-3.5" />
              <span className="font-semibold">{fault}</span> Fault
            </div>
          )}

          <div className="px-3 py-1.5 rounded-lg bg-[#080808] border border-white/[0.06] text-xs font-mono">
            <span className="text-[#8B949E]">Avg Uptime: </span>
            <span className="text-[#2EB88A] font-semibold">{avgUptime.toFixed(1)}%</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-[#080808] p-2.5 rounded-lg border border-white/[0.06]">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#8B949E]" />
          <input
            type="text"
            placeholder="Search by fixture ID, model, or tech (e.g., Sink_01, K-7505, ultrasonic)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#121212] border border-white/[0.08] rounded-md pl-9 pr-3 py-1.5 text-xs text-[#F0F6FC] placeholder-[#8B949E] focus:outline-none focus:border-[#4D88C7]/50"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="bg-[#121212] border border-white/[0.08] rounded-md px-2.5 py-1.5 text-xs text-[#F0F6FC] focus:outline-none focus:border-[#4D88C7]/50"
          >
            <option value="all">All Sensor Types ({sensors.length})</option>
            <option value="infrared">Infrared Proximity (Sinks)</option>
            <option value="ultrasonic">Ultrasonic Stall (Toilets)</option>
            <option value="passive_infrared">Passive IR (Urinals)</option>
          </select>

          <select
            value={selectedZone}
            onChange={(e) => setSelectedZone(e.target.value)}
            className="bg-[#121212] border border-white/[0.08] rounded-md px-2.5 py-1.5 text-xs text-[#F0F6FC] focus:outline-none focus:border-[#4D88C7]/50"
          >
            <option value="all">All Zones</option>
            <option value="T2_Restroom_A">Restroom A</option>
            <option value="T2_Restroom_B">Restroom B</option>
            <option value="T2_Family_Room">Family Room</option>
            <option value="T2_Staff_WC">Staff WC</option>
          </select>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-2.5 py-1.5 rounded-md bg-[#121212] border border-white/[0.08] text-xs text-[#8B949E] hover:text-[#F0F6FC] flex items-center gap-1 transition-colors"
          >
            <span>{isExpanded ? "Collapse" : "Expand"}</span>
            {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
        </div>
      </div>

      {/* Sensor List Grid */}
      {isExpanded && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredSensors.map((sensor) => {
            const isOk = sensor.status === "OK";
            const isDegraded = sensor.status === "DEGRADED";
            const isFault = sensor.status === "FAULT" || sensor.status === "OFFLINE";

            const SensorIcon =
              sensor.sensor_type === "infrared"
                ? Radio
                : sensor.sensor_type === "ultrasonic"
                ? Wifi
                : Activity;

            return (
              <div
                key={sensor.fixture_id}
                className="bg-[#0B0D11] border border-white/[0.06] rounded-md p-4 space-y-3 hover:border-white/[0.12] transition-colors relative"
              >
                {/* Top Row: Fixture ID & Status */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={`p-2 rounded-lg ${
                        sensor.sensor_type === "infrared"
                          ? "bg-[#4D88C7]/15 text-[#4D88C7]"
                          : sensor.sensor_type === "ultrasonic"
                          ? "bg-[#2EB88A]/15 text-[#2EB88A]"
                          : "bg-[#F59E0B]/15 text-[#F59E0B]"
                      }`}
                    >
                      <SensorIcon className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#F0F6FC] flex items-center gap-1.5">
                        <span>{sensor.display_name}</span>
                        <span className="text-[10px] font-mono text-[#8B949E] font-normal">
                          ({sensor.fixture_id})
                        </span>
                      </div>
                      <div className="text-[11px] text-[#8B949E]">
                        {ZONE_LABELS[sensor.zone_id] || sensor.zone_id}
                      </div>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      isOk
                        ? "bg-[#2EB88A]/10 text-[#2EB88A] border border-[#2EB88A]/25"
                        : isDegraded
                        ? "bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/25"
                        : "bg-[#F04438]/10 text-[#F04438] border border-[#F04438]/25"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        isOk ? "bg-[#2EB88A]" : isDegraded ? "bg-[#F59E0B]" : "bg-[#F04438]"
                      }`}
                    />
                    <span>{sensor.status}</span>
                  </span>
                </div>

                {/* Sensor Details */}
                <div className="bg-[#080808] p-2.5 rounded border border-white/[0.04] space-y-1.5 text-[11px]">
                  <div className="flex items-center justify-between text-[#8B949E]">
                    <span>Technology:</span>
                    <span className="text-[#C9D1D9] font-medium truncate max-w-[170px]" title={sensor.sensor_tech_label}>
                      {sensor.sensor_tech_label}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[#8B949E]">
                    <span>Hardware:</span>
                    <span className="text-[#C9D1D9] font-medium truncate max-w-[170px]" title={sensor.brand_model}>
                      {sensor.brand_model.split("(")[0].trim()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[#8B949E]">
                    <span>Parameters:</span>
                    <span className="text-[#C9D1D9] font-medium truncate max-w-[170px]" title={sensor.parameter_measured}>
                      {sensor.parameter_measured}
                    </span>
                  </div>
                </div>

                {/* Latest Reading Telemetry */}
                <div className="grid grid-cols-3 gap-2 text-center bg-[#121212] p-2 rounded border border-white/[0.04]">
                  <div>
                    <div className="text-[10px] text-[#8B949E] uppercase">Flow Rate</div>
                    <div className="text-xs font-mono font-bold text-[#F0F6FC]">
                      {sensor.latest_reading.flow_rate_lpm.toFixed(2)}{" "}
                      <span className="text-[9px] text-[#8B949E] font-normal">LPM</span>
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] text-[#8B949E] uppercase">Presence</div>
                    <div
                      className={`text-xs font-mono font-semibold ${
                        sensor.latest_reading.occupancy === 1 ? "text-[#F59E0B]" : "text-[#8B949E]"
                      }`}
                    >
                      {sensor.latest_reading.occupancy_label}
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] text-[#8B949E] uppercase">Cycles</div>
                    <div className="text-xs font-mono font-bold text-[#F0F6FC]">
                      {sensor.latest_reading.flush_count_cumulative.toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Telemetry Availability / Uptime Footer */}
                <div className="flex items-center justify-between text-[10px] text-[#8B949E] pt-1">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{sensor.latest_reading.timestamp.replace("T", " ")}</span>
                  </div>
                  <div className="font-mono">
                    <span className="text-[#2EB88A] font-semibold">{sensor.uptime_pct.toFixed(1)}%</span>{" "}
                    availability
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {filteredSensors.length === 0 && (
        <div className="p-8 text-center bg-[#080808] rounded-md border border-white/[0.06] text-xs text-[#8B949E]">
          No sensors matching &quot;{searchQuery}&quot; found in selected filters.
        </div>
      )}
    </div>
  );
}
