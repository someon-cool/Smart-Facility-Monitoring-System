"use client";

import { useState, useMemo, type KeyboardEvent } from "react";
import { Card } from "@/components/ui/Card";
import { OccupancyHeatmapData } from "./types";
import { getZoneLabel, getFixtureShortLabel } from "@/lib/names";
import { cn } from "@/lib/cn";

interface OccupancyHeatmapProps {
  data: OccupancyHeatmapData | null;
  loading: boolean;
}



function getCellColor(val: number): string {
  if (val <= 0.03) return "transparent";
  // Sequential shades of blue for occupancy intensity
  if (val < 0.15) return "rgba(56, 189, 248, 0.20)"; // Subtle ice/sky wash
  if (val < 0.30) return "rgba(14, 165, 233, 0.38)"; // Muted ocean blue
  if (val < 0.50) return "rgba(2, 132, 199, 0.58)";  // Medium azure blue
  if (val < 0.70) return "rgba(2, 132, 199, 0.82)";  // Vibrant deep blue
  if (val < 0.85) return "#0284c7";                  // Solid royal blue
  return "#38bdf8";                                  // Electric peak cyan-blue
}

// Map fixture to zone for grouping
function getZoneForFixture(fixtureId: string): string {
  if (fixtureId.includes("_RA_") || fixtureId.includes("Restroom_A"))
    return "T2_Restroom_A";
  if (fixtureId.includes("_RB_") || fixtureId.includes("Restroom_B"))
    return "T2_Restroom_B";
  if (fixtureId.includes("_FR_") || fixtureId.includes("Family"))
    return "T2_Family_Room";
  if (fixtureId.includes("_ST_") || fixtureId.includes("Staff"))
    return "T2_Staff_WC";
  return "T2_Restroom_A";
}

export function OccupancyHeatmap({ data, loading }: OccupancyHeatmapProps) {
  const [activeCell, setActiveCell] = useState<{
    fixture: string;
    hour: number;
    val: number;
    zone: string;
  } | null>(null);

  // Group fixtures by zone
  const groupedRows = useMemo(() => {
    if (!data || data.fixtures.length === 0) return [];

    const zoneMap = new Map<
      string,
      { fixture: string; rowIdx: number; busiestHour: number }[]
    >();

    data.fixtures.forEach((fixture, rowIdx) => {
      const zone = getZoneForFixture(fixture);
      const row = data.matrix[rowIdx] || [];

      // Find busiest hour for this fixture
      let maxVal = -1;
      let busiestHour = 0;
      row.forEach((val, colIdx) => {
        if (val > maxVal) {
          maxVal = val;
          busiestHour = data.hours[colIdx];
        }
      });

      if (!zoneMap.has(zone)) zoneMap.set(zone, []);
      zoneMap.get(zone)!.push({ fixture, rowIdx, busiestHour });
    });

    return Array.from(zoneMap.entries());
  }, [data]);

  if (!data || data.fixtures.length === 0) {
    return null;
  }

  return (
    <Card tier="standard" className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-hairline)] pb-3">
        <div>
          <h3 className="text-base font-semibold text-[var(--text-1)] tracking-tight">
            Occupancy Heatmap
          </h3>
          <p className="text-xs text-[var(--text-3)] mt-0.5">
            Hourly fixture utilization indexed 0.00 to 1.00. Underline indicates busiest hour.
          </p>
        </div>

        {/* Sequential Gradient Legend */}
        <div className="flex items-center gap-2 text-xs text-[var(--text-3)]">
          <span>0.0 (Idle)</span>
          <div
            className="h-3 w-28 rounded-[var(--r-sm)] border border-[var(--border-hairline)]"
            style={{
              background: "linear-gradient(to right, rgba(56, 189, 248, 0.15), rgba(2, 132, 199, 0.7), #38bdf8)",
            }}
          />
          <span>1.0 (Peak)</span>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="overflow-x-auto">
        <div className="min-w-[840px] space-y-4 py-2">
          {/* Column Header (every 3 hours) */}
          <div className="flex items-center pl-48 pr-2">
            {data.hours.map((hour) => {
              const showLabel = hour % 3 === 0;
              return (
                <div
                  key={hour}
                  className="flex-1 text-center text-xs font-mono text-[var(--text-3)] select-none"
                >
                  {showLabel ? `${hour.toString().padStart(2, "0")}:00` : ""}
                </div>
              );
            })}
          </div>

          {/* Zone Groups */}
          {groupedRows.map(([zoneId, rows], gIdx) => (
            <div key={zoneId} className="space-y-1.5">
              {/* Zone Header divider */}
              <div className="flex items-center gap-2 pt-2 border-t border-[var(--border-hairline)]">
                <span className="text-caption font-semibold text-[var(--text-2)]">
                  {getZoneLabel(zoneId)}
                </span>
                <span className="text-caption text-[var(--text-3)]">
                  ({rows.length} fixtures)
                </span>
              </div>

              {/* Rows within zone */}
              {rows.map(({ fixture, rowIdx, busiestHour }) => {
                const rowData = data.matrix[rowIdx] || [];
                const shortLabel = getFixtureShortLabel(fixture);

                return (
                  <div key={fixture} className="flex items-center gap-2 h-7">
                    {/* Fixture row label */}
                    <div className="w-48 shrink-0 flex items-baseline justify-between pr-3 text-xs text-[var(--text-2)]">
                      <span className="font-mono font-medium truncate">
                        {shortLabel}
                      </span>
                      <span className="text-caption font-mono text-[var(--text-3)]">
                        Peak: {busiestHour.toString().padStart(2, "0")}h
                      </span>
                    </div>

                    {/* 24 Hour Cells */}
                    <div className="flex-1 flex gap-1 h-6">
                      {rowData.map((val, colIdx) => {
                        const hour = data.hours[colIdx];
                        const isBusiest = hour === busiestHour && val > 0.05;
                        const isCellSelected =
                          activeCell?.fixture === fixture &&
                          activeCell?.hour === hour;

                        return (
                          <div
                            key={colIdx}
                            tabIndex={0}
                            role="gridcell"
                            aria-label={`${shortLabel} at ${hour}:00, occupancy ${val.toFixed(2)}`}
                            onFocus={() =>
                              setActiveCell({
                                fixture,
                                hour,
                                val,
                                zone: zoneId,
                              })
                            }
                            onMouseEnter={() =>
                              setActiveCell({
                                fixture,
                                hour,
                                val,
                                zone: zoneId,
                              })
                            }
                            className={cn(
                              "relative flex-1 min-w-[24px] rounded-[var(--r-sm)] border border-[var(--border-hairline)]/30 transition-transform cursor-pointer select-none",
                              "hover:scale-105 hover:z-10 focus-visible:outline-2 focus-visible:outline-[var(--accent-ring)]",
                              isCellSelected && "ring-2 ring-[var(--accent-ring)] z-20",
                              isBusiest &&
                                "after:absolute after:bottom-0 after:left-1 after:right-1 after:h-[2px] after:bg-[var(--text-1)]"
                            )}
                            style={{
                              backgroundColor:
                                val > 0
                                  ? getCellColor(val)
                                  : "var(--bg-subtle)",
                            }}
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Selected/Hovered Cell Tooltip readout strip */}
      <div className="flex items-center justify-between border-t border-[var(--border-hairline)] pt-3 text-xs text-[var(--text-2)] min-h-[32px]">
        {activeCell ? (
          <div className="flex items-center gap-3">
            <span className="font-semibold text-[var(--text-1)]">
              {getFixtureShortLabel(activeCell.fixture)} (
              {getZoneLabel(activeCell.zone)})
            </span>
            <span>·</span>
            <span>
              Time: {activeCell.hour.toString().padStart(2, "0")}:00 –{" "}
              {((activeCell.hour + 1) % 24).toString().padStart(2, "0")}:00
            </span>
            <span>·</span>
            <span className="font-mono font-medium text-[var(--text-1)]">
              Occupancy: {(activeCell.val * 100).toFixed(0)}% ({activeCell.val.toFixed(2)})
            </span>
          </div>
        ) : (
          <span className="text-[var(--text-3)]">
            Hover over or tab into any cell to inspect detailed fixture occupancy at that hour.
          </span>
        )}
      </div>
    </Card>
  );
}
