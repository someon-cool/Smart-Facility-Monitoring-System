"use client";

import { useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Brush,
  ReferenceLine,
} from "recharts";
import { Reading } from "./types";
import { ChartFrame } from "@/components/ui/ChartFrame";
import { ChartTooltip } from "@/components/ui/ChartTooltip";
import { Select } from "@/components/ui/Select";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { MultiSelectPopover } from "@/components/ui/Select";
import { getZoneLabel, ZONE_LABELS_SHORT, ZONE_IDS } from "@/lib/names";
import { formatDate, formatDateTime } from "@/lib/format";

interface FlowRateChartProps {
  readings: Reading[];
  zoneTotals: { timestamp_str: string; zone_id: string; flow_rate_lpm: number }[];
  loading: boolean;
  viewMode?: "full" | "replay";
  onViewModeChange?: (mode: "full" | "replay") => void;
  isReplay?: boolean;
  replayCutoffDate?: Date;
  replayHours?: number;
  onJumpReplayHours?: (hours: number) => void;
}

// Okabe-Ito subset (colour-blind safe) with secondary dash encoding
const ZONE_CHART_CONFIG: Record<
  string,
  { name: string; color: string; dash?: string }
> = {
  T2_Restroom_A: {
    name: "Restroom A (Departure)",
    color: "#0072B2",
    dash: undefined,
  },
  T2_Restroom_B: {
    name: "Restroom B (Arrival)",
    color: "#B5558C",
    dash: "6 3",
  },
  T2_Family_Room: {
    name: "Family room",
    color: "#B87800",
    dash: "2 2",
  },
  T2_Staff_WC: {
    name: "Staff WC",
    color: "#3A9AD0",
    dash: "6 2 2 2",
  },
};

const RANGE_OPTIONS = [
  { value: "all", label: "Full 7 days (1–7 Oct)" },
  { value: "last24h", label: "Last 24 hours (7 Oct)" },
  { value: "day1", label: "1 Oct (Day 1)" },
  { value: "day2", label: "2 Oct (Day 2)" },
  { value: "day3", label: "3 Oct (Day 3)" },
  { value: "day4", label: "4 Oct (Day 4)" },
  { value: "day5", label: "5 Oct (Day 5)" },
  { value: "day6", label: "6 Oct (Day 6)" },
  { value: "day7", label: "7 Oct (Day 7)" },
];

const isTimestampInRange = (tsStr: string, range: string) => {
  if (range === "all") return true;
  if (range === "last24h") return tsStr.startsWith("2024-10-07");
  if (range === "day1") return tsStr.startsWith("2024-10-01");
  if (range === "day2") return tsStr.startsWith("2024-10-02");
  if (range === "day3") return tsStr.startsWith("2024-10-03");
  if (range === "day4") return tsStr.startsWith("2024-10-04");
  if (range === "day5") return tsStr.startsWith("2024-10-05");
  if (range === "day6") return tsStr.startsWith("2024-10-06");
  if (range === "day7") return tsStr.startsWith("2024-10-07");
  return true;
};

export function FlowRateChart({
  readings,
  zoneTotals,
  loading,
  isReplay = false,
  replayCutoffDate,
  replayHours = 0,
}: FlowRateChartProps) {
  const [chartMode, setChartMode] = useState<string>("zone_total");
  const [dateRange, setDateRange] = useState<string>("all");
  const [selectedZones, setSelectedZones] = useState<string[]>([...ZONE_IDS]);

  // Available zone filter options
  const zoneOptions = ZONE_IDS.map((zid) => ({
    value: zid,
    label: getZoneLabel(zid),
  }));

  // Fixture list for per-fixture mode (top 6 by activity)
  const topFixtures = useMemo(() => {
    const fixtureFlowMap = new Map<string, number>();
    for (const r of readings) {
      if (!r.fixture_id) continue;
      const current = fixtureFlowMap.get(r.fixture_id) || 0;
      fixtureFlowMap.set(r.fixture_id, current + r.flow_rate_lpm);
    }
    return Array.from(fixtureFlowMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([id]) => id);
  }, [readings]);

  // Format data for chart
  const { chartData, tableRows } = useMemo(() => {
    if (chartMode === "zone_total") {
      const timeMap = new Map<string, any>();
      for (const item of zoneTotals) {
        if (selectedZones.length > 0 && !selectedZones.includes(item.zone_id)) {
          continue;
        }
        if (!isReplay && !isTimestampInRange(item.timestamp_str, dateRange)) {
          continue;
        }

        if (!timeMap.has(item.timestamp_str)) {
          timeMap.set(item.timestamp_str, { timestamp: item.timestamp_str });
        }
        const row = timeMap.get(item.timestamp_str);

        if (
          isReplay &&
          replayCutoffDate &&
          new Date(item.timestamp_str) > replayCutoffDate
        ) {
          row[item.zone_id] = null;
        } else {
          row[item.zone_id] = Number(item.flow_rate_lpm.toFixed(2));
        }
      }

      const rows = Array.from(timeMap.values()).sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

      // Prepare accessible table rows sample (1 every ~20 points)
      const sampled = rows
        .filter((_, idx) => idx % Math.max(1, Math.floor(rows.length / 20)) === 0)
        .map((r) => [
          formatDateTime(r.timestamp),
          r.T2_Restroom_A ?? 0,
          r.T2_Restroom_B ?? 0,
          r.T2_Family_Room ?? 0,
          r.T2_Staff_WC ?? 0,
        ]);

      return { chartData: rows, tableRows: sampled };
    } else {
      // Per fixture mode
      const timeMap = new Map<string, any>();
      for (const item of readings) {
        if (!item.fixture_id || !topFixtures.includes(item.fixture_id)) continue;
        if (selectedZones.length > 0 && !selectedZones.includes(item.zone_id)) {
          continue;
        }
        if (!isReplay && !isTimestampInRange(item.timestamp_str, dateRange)) {
          continue;
        }

        if (!timeMap.has(item.timestamp_str)) {
          timeMap.set(item.timestamp_str, { timestamp: item.timestamp_str });
        }
        const row = timeMap.get(item.timestamp_str);

        if (
          isReplay &&
          replayCutoffDate &&
          new Date(item.timestamp_str) > replayCutoffDate
        ) {
          row[item.fixture_id] = null;
        } else {
          row[item.fixture_id] = Number(item.flow_rate_lpm.toFixed(2));
        }
      }

      const rows = Array.from(timeMap.values()).sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

      const sampled = rows
        .filter((_, idx) => idx % Math.max(1, Math.floor(rows.length / 20)) === 0)
        .map((r) => [
          formatDateTime(r.timestamp),
          ...topFixtures.map((fid) => r[fid] ?? 0),
        ]);

      return { chartData: rows, tableRows: sampled };
    }
  }, [
    chartMode,
    zoneTotals,
    readings,
    selectedZones,
    dateRange,
    isReplay,
    replayCutoffDate,
    topFixtures,
  ]);

  const activeSeries =
    chartMode === "zone_total"
      ? (selectedZones.length > 0 ? selectedZones : ZONE_IDS).map((zid) => ({
          key: zid,
          name: ZONE_CHART_CONFIG[zid]?.name || zid,
          shortName: ZONE_LABELS_SHORT[zid] || zid,
          color: ZONE_CHART_CONFIG[zid]?.color || "#4A8FB8",
          dash: ZONE_CHART_CONFIG[zid]?.dash,
        }))
      : topFixtures.map((fid, idx) => ({
          key: fid,
          name: fid.replace(/^T2_/, "").replace(/_/g, " "),
          shortName: fid.replace(/^T2_/, ""),
          color:
            ["#0072B2", "#B5558C", "#B87800", "#3A9AD0", "#6B675E", "#2A2926"][
              idx % 6
            ],
          dash: undefined,
        }));

  return (
    <ChartFrame
      title="Flow Telemetry"
      unit="L/min"
      subtitle={
        isReplay
          ? "Replaying flow rate timeline — dimmed area represents future readings"
          : "1-minute resolution flow telemetry across Terminal 2 fixtures"
      }
      ariaLabel="Flow telemetry line chart over time showing liters per minute across zones"
      tier="standard"
      actions={
        <div className="flex flex-wrap items-center gap-2">
          {/* Mode SegmentedControl: Zone totals | Per fixture */}
          <SegmentedControl
            value={chartMode}
            onValueChange={setChartMode}
            items={[
              { value: "zone_total", label: "Zone totals" },
              { value: "per_fixture", label: "Per fixture (Top 6)" },
            ]}
          />

          {/* Zones Popover */}
          <MultiSelectPopover
            label="Zones"
            options={zoneOptions}
            selectedValues={selectedZones}
            onChange={setSelectedZones}
          />

          {/* Range Select (Deriving from simulation dates) */}
          {!isReplay && (
            <Select
              value={dateRange}
              onValueChange={setDateRange}
              options={RANGE_OPTIONS}
              ariaLabel="Select date range"
              size="sm"
            />
          )}
        </div>
      }
      tableData={{
        columns:
          chartMode === "zone_total"
            ? [
                "Timestamp",
                "Restroom A",
                "Restroom B",
                "Family room",
                "Staff WC",
              ]
            : ["Timestamp", ...topFixtures.map((f) => f.replace(/^T2_/, ""))],
        rows: tableRows,
      }}
    >
      <div className="w-full h-80 relative select-none">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 12, right: 24, left: 0, bottom: 8 }}
          >
            {/* Horizontal gridlines only, 60% opacity */}
            <CartesianGrid
              stroke="var(--border-hairline)"
              strokeOpacity={0.6}
              vertical={false}
            />

            <XAxis
              dataKey="timestamp"
              tickLine={false}
              axisLine={{ stroke: "var(--border-hairline)" }}
              tick={{ fill: "var(--text-3)", fontSize: 12 }}
              tickFormatter={(ts) => {
                if (!ts) return "";
                const d = new Date(ts);
                const month = d.toLocaleString("en-US", { month: "short" });
                return `${d.getDate()} ${month} ${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
              }}
              minTickGap={48}
            />

            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--text-3)", fontSize: 12 }}
              domain={[0, "auto"]}
              width={40}
            />

            <Tooltip
              content={<ChartTooltip unit="L/min" />}
              cursor={{
                stroke: "var(--border-strong)",
                strokeWidth: 1,
              }}
            />

            {/* Render lines for active series */}
            {activeSeries.map((s) => (
              <Line
                key={s.key}
                type="linear"
                dataKey={s.key}
                name={s.name}
                stroke={s.color}
                strokeWidth={1.5}
                strokeDasharray={s.dash}
                dot={false}
                activeDot={{ r: 4, stroke: s.color, fill: "var(--bg-surface)" }}
                connectNulls={false}
                isAnimationActive={false}
              />
            ))}

            {/* Replay cutoff line if in replay mode */}
            {isReplay && replayCutoffDate && (
              <ReferenceLine
                x={replayCutoffDate.toISOString().replace("Z", "")}
                stroke="var(--text-1)"
                strokeDasharray="3 3"
                label={{
                  value: "Current",
                  position: "top",
                  fill: "var(--text-1)",
                  fontSize: 11,
                }}
              />
            )}

            {/* Focus + context Brush: replaces day chips */}
            {!isReplay && chartData.length > 30 && (
              <Brush
                dataKey="timestamp"
                height={36}
                stroke="var(--border-strong)"
                fill="var(--bg-subtle)"
                travellerWidth={12}
                tickFormatter={(ts) => (ts ? formatDate(ts) : "")}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Direct labels / legend strip at bottom */}
      <div className="flex flex-wrap items-center justify-center gap-6 pt-2 border-t border-[var(--border-hairline)] text-xs text-[var(--text-2)]">
        {activeSeries.map((s) => (
          <div key={s.key} className="flex items-center gap-2">
            <span
              className="inline-block w-4 h-0.5"
              style={{
                backgroundColor: s.color,
                borderTop: s.dash ? `1px dashed ${s.color}` : undefined,
              }}
            />
            <span className="font-medium text-[var(--text-1)]">
              {s.shortName}
            </span>
          </div>
        ))}
      </div>
    </ChartFrame>
  );
}
