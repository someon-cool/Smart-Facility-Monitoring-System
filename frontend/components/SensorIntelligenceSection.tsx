"use client";

import { useState, useMemo } from "react";
import {
  Search,
  LayoutGrid,
  List as ListIcon,
  CheckCircle2,
  Activity,
  Cpu,
  Layers,
} from "lucide-react";
import { SensorRecord, SensorFleetSummary } from "./types";
import { Stat, StatStrip } from "@/components/ui/Stat";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Toolbar, ToolbarSpacer } from "@/components/ui/Toolbar";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Select } from "@/components/ui/Select";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/Table";
import { Drawer, DrawerContent } from "@/components/ui/Drawer";
import { EmptyState } from "@/components/ui/EmptyState";
import { getZoneLabel, getFixtureShortLabel, ZONE_IDS } from "@/lib/names";
import { formatDateTime, formatNumber } from "@/lib/format";
import { cn } from "@/lib/cn";

export interface SensorIntelligenceSectionProps {
  summary: SensorFleetSummary | null;
  sensors: SensorRecord[];
  loading: boolean;
}

export function SensorIntelligenceSection({
  summary,
  sensors,
  loading,
}: SensorIntelligenceSectionProps) {
  const [selectedZone, setSelectedZone] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<string>("list");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedSensor, setSelectedSensor] = useState<SensorRecord | null>(
    null
  );

  // Summary counts
  const total = summary?.total_sensors ?? sensors.length;
  const onlineCount =
    summary?.online_count ?? sensors.filter((s) => s.status === "OK").length;
  const degradedCount =
    summary?.degraded_count ??
    sensors.filter((s) => s.status === "DEGRADED").length;
  const faultCount =
    (summary?.fault_count ?? 0) + (summary?.offline_count ?? 0) ||
    sensors.filter((s) => s.status === "FAULT" || s.status === "OFFLINE").length;
  const needAttention = degradedCount + faultCount;
  const avgUptime = summary?.average_uptime_pct ?? 99.6;

  // Filtered Sensors
  const filteredSensors = useMemo(() => {
    return sensors.filter((s) => {
      if (selectedZone !== "all" && s.zone_id !== selectedZone) return false;
      if (statusFilter === "online" && s.status !== "OK") return false;
      if (statusFilter === "degraded" && s.status !== "DEGRADED") return false;
      if (
        statusFilter === "fault" &&
        s.status !== "FAULT" &&
        s.status !== "OFFLINE"
      )
        return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const match =
          s.fixture_id.toLowerCase().includes(q) ||
          s.display_name.toLowerCase().includes(q) ||
          s.brand_model.toLowerCase().includes(q) ||
          s.sensor_tech_label.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [sensors, selectedZone, statusFilter, searchQuery]);

  const getStatusBadgeType = (status: string) => {
    switch (status) {
      case "OK":
        return "healthy" as const;
      case "DEGRADED":
        return "warning" as const;
      case "FAULT":
      case "OFFLINE":
      default:
        return "critical" as const;
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="flex flex-wrap items-baseline justify-between gap-4 pb-2 border-b border-[var(--border-hairline)]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-1)]">
            Sensors
          </h1>
          <p className="text-xs text-[var(--text-3)] mt-1 font-mono">
            {onlineCount} online · {needAttention} need attention
          </p>
        </div>
      </div>

      {/* 2. Fleet Summary Strip */}
      <StatStrip>
        <Stat
          hero
          label="Online fleet"
          value={onlineCount}
          context={`of ${total} total smart sensors`}
          delta={
            needAttention > 0
              ? {
                  value: `${needAttention} need check`,
                  direction: "up",
                  sentiment: "negative",
                }
              : {
                  value: "All online",
                  direction: "down",
                  sentiment: "positive",
                }
          }
        />
        <Stat
          label="Degraded signal"
          value={degradedCount}
          context="Telemetry drift / weak signal"
        />
        <Stat
          label="Fault / Offline"
          value={faultCount}
          context="Zero reading transmission"
          delta={
            faultCount > 0
              ? { value: "Critical", direction: "up", sentiment: "negative" }
              : undefined
          }
        />
        <Stat
          label="Average fleet uptime"
          value={`${avgUptime.toFixed(1)}%`}
          context="30-day rolling reliability"
        />
      </StatStrip>

      {/* 3. Toolbar */}
      <Toolbar className="border-b border-[var(--border-hairline)] pb-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-[var(--text-3)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search sensors, models, fixtures..."
            className="h-10 pl-9 pr-3 rounded-[var(--r-md)] border border-[var(--border-strong)] bg-[var(--bg-surface)] text-sm text-[var(--text-1)] placeholder-[var(--text-3)] focus:outline-2 focus:outline-[var(--accent-ring)]"
          />
        </div>

        {/* Zone Select */}
        <Select
          value={selectedZone}
          onValueChange={setSelectedZone}
          options={[
            { value: "all", label: "All zones" },
            ...ZONE_IDS.map((zid) => ({
              value: zid,
              label: getZoneLabel(zid),
            })),
          ]}
          ariaLabel="Filter by zone"
        />

        {/* Status Segmented */}
        <SegmentedControl
          value={statusFilter}
          onValueChange={setStatusFilter}
          items={[
            { value: "all", label: `All (${total})` },
            { value: "online", label: `Online (${onlineCount})` },
            { value: "degraded", label: `Degraded (${degradedCount})` },
            { value: "fault", label: `Fault (${faultCount})` },
          ]}
        />

        <ToolbarSpacer />

        {/* View Toggle (List default | Cards) */}
        <div className="flex items-center rounded-[var(--r-md)] border border-[var(--border-hairline)] bg-[var(--bg-subtle)] p-0.5">
          <button
            type="button"
            onClick={() => setViewMode("list")}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.5 rounded-[var(--r-sm)] text-xs font-medium transition-colors cursor-pointer",
              viewMode === "list"
                ? "bg-[var(--bg-surface)] text-[var(--text-1)] shadow-sm font-semibold"
                : "text-[var(--text-3)] hover:text-[var(--text-1)]"
            )}
            aria-label="List view"
          >
            <ListIcon className="h-3.5 w-3.5" />
            <span>List</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("cards")}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.5 rounded-[var(--r-sm)] text-xs font-medium transition-colors cursor-pointer",
              viewMode === "cards"
                ? "bg-[var(--bg-surface)] text-[var(--text-1)] shadow-sm font-semibold"
                : "text-[var(--text-3)] hover:text-[var(--text-1)]"
            )}
            aria-label="Cards view"
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            <span>Cards</span>
          </button>
        </div>
      </Toolbar>

      {/* 4. Content Area: List Table vs Cards */}
      {filteredSensors.length === 0 ? (
        <EmptyState
          icon={<CheckCircle2 className="h-8 w-8 text-[var(--healthy-fg)]" />}
          title="No sensors found"
          description="Try adjusting your search query or status filter."
        />
      ) : viewMode === "list" ? (
        /* List Mode (Flat Table) */
        <div className="rounded-[var(--r-md)] border border-[var(--border-hairline)] bg-[var(--bg-surface)] overflow-hidden">
          <Table dense>
            <TableHeader>
              <TableRow>
                <TableHead>Sensor</TableHead>
                <TableHead>Fixture</TableHead>
                <TableHead>Zone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last seen</TableHead>
                <TableHead align="right">Telemetry Reading</TableHead>
                <TableHead align="right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSensors.map((sensor) => {
                const zoneName = getZoneLabel(sensor.zone_id);
                const fixtureName = getFixtureShortLabel(sensor.fixture_id);
                const badgeStatus = getStatusBadgeType(sensor.status);
                const lastSeen = sensor.latest_reading?.timestamp
                  ? formatDateTime(sensor.latest_reading.timestamp)
                  : "recently";

                return (
                  <TableRow
                    key={sensor.fixture_id}
                    onClick={() => setSelectedSensor(sensor)}
                    className="cursor-pointer"
                  >
                    <TableCell>
                      <div className="max-w-[200px]">
                        <span className="font-medium text-[var(--text-1)] block line-clamp-2">
                          {sensor.display_name}
                        </span>
                        <span className="font-mono text-[11px] text-[var(--text-3)] block truncate">
                          {sensor.fixture_id}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <span className="font-mono font-medium text-[var(--text-2)]">
                        {fixtureName}
                      </span>
                    </TableCell>

                    <TableCell>{zoneName}</TableCell>

                    <TableCell>
                      <Badge status={badgeStatus}>{sensor.status}</Badge>
                    </TableCell>

                    <TableCell>
                      <span className="font-mono text-xs text-[var(--text-2)]">
                        {lastSeen}
                      </span>
                    </TableCell>

                    <TableCell align="right">
                      <div className="inline-flex items-center gap-2 text-xs text-[var(--text-2)]">
                        <span className="font-mono num font-semibold text-[var(--text-1)]">
                          {sensor.latest_reading?.flow_rate_lpm?.toFixed(1) ?? "0.0"} LPM
                        </span>
                        {sensor.latest_reading?.occupancy_label && (
                          <span className="text-[var(--text-3)]">
                            ({sensor.latest_reading.occupancy_label})
                          </span>
                        )}
                      </div>
                    </TableCell>

                    <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="text"
                        size="sm"
                        onClick={() => setSelectedSensor(sensor)}
                        className="text-xs"
                      >
                        Specs
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      ) : (
        /* Cards Mode (Standard Cards) */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSensors.map((sensor) => {
            const zoneName = getZoneLabel(sensor.zone_id);
            const badgeStatus = getStatusBadgeType(sensor.status);
            const lastSeen = sensor.latest_reading?.timestamp
              ? formatDateTime(sensor.latest_reading.timestamp)
              : "recently";

            return (
              <Card
                key={sensor.fixture_id}
                tier="standard"
                className="flex flex-col justify-between gap-3 cursor-pointer hover:border-[var(--border-strong)] transition-colors"
                onClick={() => setSelectedSensor(sensor)}
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-semibold text-[var(--text-1)] line-clamp-2">
                        {sensor.display_name}
                      </h3>
                      <p className="text-xs text-[var(--text-3)] mt-0.5">
                        {zoneName} · {getFixtureShortLabel(sensor.fixture_id)}
                      </p>
                    </div>
                    <Badge status={badgeStatus}>{sensor.status}</Badge>
                  </div>

                  <div className="pt-2 border-t border-[var(--border-hairline)] flex items-center justify-between text-xs text-[var(--text-3)]">
                    <span className="font-mono">{sensor.fixture_id}</span>
                    <span>Last seen {lastSeen}</span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* 5. Detail Drawer */}
      <Drawer
        open={!!selectedSensor}
        onOpenChange={(open) => !open && setSelectedSensor(null)}
      >
        <DrawerContent
          title={selectedSensor?.display_name || "Sensor Details"}
          description={
            selectedSensor
              ? `${getZoneLabel(selectedSensor.zone_id)} · Fixture ${getFixtureShortLabel(selectedSensor.fixture_id)}`
              : ""
          }
        >
          {selectedSensor && (
            <div className="space-y-6 py-4">
              {/* Header Status */}
              <div className="flex items-center justify-between pb-4 border-b border-[var(--border-hairline)]">
                <div>
                  <span className="text-caption font-medium text-[var(--text-3)]">
                    Uptime reliability
                  </span>
                  <div className="metric-hero font-mono num text-[var(--text-1)] mt-1">
                    {selectedSensor.uptime_pct.toFixed(1)}%
                  </div>
                </div>
                <Badge status={getStatusBadgeType(selectedSensor.status)}>
                  {selectedSensor.status}
                </Badge>
              </div>

              {/* Hardware Specifications */}
              <div className="space-y-3">
                <h4 className="text-body font-semibold text-[var(--text-1)]">
                  Hardware &amp; telemetry profile
                </h4>
                <div className="rounded-[var(--r-md)] border border-[var(--border-hairline)] bg-[var(--bg-subtle)] p-3 space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-[var(--border-hairline)]/50">
                    <span className="text-[var(--text-3)]">Fixture Identifier</span>
                    <span className="font-mono text-[var(--text-1)]">
                      {selectedSensor.fixture_id}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[var(--border-hairline)]/50">
                    <span className="text-[var(--text-3)]">Brand &amp; Model</span>
                    <span className="text-[var(--text-1)] font-medium">
                      {selectedSensor.brand_model}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[var(--border-hairline)]/50">
                    <span className="text-[var(--text-3)]">Sensor Technology</span>
                    <span className="text-[var(--text-1)]">
                      {selectedSensor.sensor_tech_label}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[var(--border-hairline)]/50">
                    <span className="text-[var(--text-3)]">Parameter Measured</span>
                    <span className="text-[var(--text-1)]">
                      {selectedSensor.parameter_measured} ({selectedSensor.parameter_units})
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[var(--border-hairline)]/50">
                    <span className="text-[var(--text-3)]">Nominal Flow Benchmark</span>
                    <span className="font-mono text-[var(--text-1)]">
                      {selectedSensor.nominal_flow_lpm} LPM
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-[var(--text-3)]">Fault Sample Count</span>
                    <span className="font-mono text-[var(--text-1)]">
                      {selectedSensor.fault_samples} events
                    </span>
                  </div>
                </div>
              </div>

              {/* Latest Telemetry Signal */}
              {selectedSensor.latest_reading && (
                <div className="space-y-3">
                  <h4 className="text-body font-semibold text-[var(--text-1)]">
                    Live telemetry snapshot
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-[var(--r-sm)] border border-[var(--border-hairline)] p-3 bg-[var(--bg-surface)]">
                      <div className="text-caption text-[var(--text-3)] flex items-center gap-1">
                        <Activity className="h-3.5 w-3.5" /> Flow Rate
                      </div>
                      <div className="font-mono text-lg font-semibold text-[var(--text-1)] mt-1">
                        {selectedSensor.latest_reading.flow_rate_lpm.toFixed(2)} LPM
                      </div>
                    </div>
                    <div className="rounded-[var(--r-sm)] border border-[var(--border-hairline)] p-3 bg-[var(--bg-surface)]">
                      <div className="text-[11px] text-[var(--text-3)] flex items-center gap-1">
                        <Layers className="h-3.5 w-3.5" /> Total Flushes
                      </div>
                      <div className="font-mono text-lg font-semibold text-[var(--text-1)] mt-1">
                        {formatNumber(selectedSensor.latest_reading.flush_count_cumulative)}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </DrawerContent>
      </Drawer>
    </div>
  );
}
