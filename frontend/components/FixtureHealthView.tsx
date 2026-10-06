"use client";

import { useState, useMemo } from "react";
import {
  Activity,
  AlertTriangle,
  OctagonAlert,
  ShieldCheck,
  Info,
  Search,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Minus,
  CheckCircle2,
} from "lucide-react";
import {
  FixtureHealthRecord,
  FacilityHealthSummary,
  FixtureRiskFactors,
} from "./types";
import { Card } from "@/components/ui/Card";
import { Stat, StatStrip } from "@/components/ui/Stat";
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
import { Disclosure } from "@/components/ui/Disclosure";
import { EmptyState } from "@/components/ui/EmptyState";
import { getZoneLabel, getFixtureShortLabel, ZONE_IDS } from "@/lib/names";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/cn";

export interface FixtureHealthViewProps {
  records: FixtureHealthRecord[];
  summary: FacilityHealthSummary | null;
  loading: boolean;
  onOpenTicket?: (ticketId: string) => void;
}

const RISK_FACTOR_LABELS: Record<keyof FixtureRiskFactors, string> = {
  flow_drift_score: "Baseline flow drift",
  slow_drip_score: "Continuous slow drip",
  anomaly_frequency_score: "High anomaly frequency",
  recurrence_score: "Incident recurrence pattern",
  sensor_health_score: "Sensor signal fault",
  unresolved_score: "Prolonged unresolved status",
};

function getTopFactor(factors: FixtureRiskFactors): string {
  let maxKey: keyof FixtureRiskFactors = "flow_drift_score";
  let maxVal = -1;

  for (const [key, val] of Object.entries(factors)) {
    if (typeof val === "number" && val > maxVal) {
      maxVal = val;
      maxKey = key as keyof FixtureRiskFactors;
    }
  }

  return `${RISK_FACTOR_LABELS[maxKey]} (${maxVal.toFixed(0)}/100)`;
}

export function FixtureHealthView({
  records,
  summary,
  loading,
}: FixtureHealthViewProps) {
  const [selectedZone, setSelectedZone] = useState<string>("all");
  const [riskSegment, setRiskSegment] = useState<string>("all");
  const [sortOption, setSortOption] = useState<string>("risk_desc");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedFixture, setSelectedFixture] =
    useState<FixtureHealthRecord | null>(null);

  // Summary counts
  const totalFixtures = summary?.total_fixtures ?? records.length;
  const healthyCount = summary?.healthy_count ?? 15;
  const watchCount = summary?.watch_count ?? 0;
  const atRiskCount =
    (summary?.high_risk_count ?? 0) + (summary?.degrading_count ?? 0);
  const healthAvg =
    summary?.average_health_score !== undefined
      ? summary.average_health_score.toFixed(0)
      : "92";

  // Filter & Sort
  const filteredRecords = useMemo(() => {
    return records
      .filter((r) => {
        if (selectedZone !== "all" && r.zone_id !== selectedZone) return false;
        if (riskSegment === "at_risk") {
          if (r.status !== "High Risk" && r.status !== "Degrading") return false;
        } else if (riskSegment === "watch") {
          if (r.status !== "Watch") return false;
        } else if (riskSegment === "healthy") {
          if (r.status !== "Healthy") return false;
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          return (
            r.fixture_id.toLowerCase().includes(q) ||
            getZoneLabel(r.zone_id).toLowerCase().includes(q) ||
            r.recommendation?.toLowerCase().includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => {
        if (sortOption === "risk_desc") return b.risk_score - a.risk_score;
        if (sortOption === "health_asc") return a.health_score - b.health_score;
        return a.fixture_id.localeCompare(b.fixture_id);
      });
  }, [records, selectedZone, riskSegment, sortOption, searchQuery]);

  // At-risk fixtures for the "Needs Attention" card section
  const atRiskFixtures = useMemo(() => {
    return records.filter(
      (r) => r.status === "High Risk" || r.status === "Degrading"
    );
  }, [records]);

  // Group identical recommendations across actionable fixtures
  const groupedRecommendations = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const r of atRiskFixtures) {
      if (r.recommendation) {
        const list = map.get(r.recommendation) || [];
        list.push(getFixtureShortLabel(r.fixture_id));
        map.set(r.recommendation, list);
      }
    }
    return Array.from(map.entries());
  }, [atRiskFixtures]);

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <div className="flex flex-wrap items-baseline justify-between gap-4 pb-2 border-b border-[var(--border-hairline)]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-1)]">
            Fixture Health
          </h1>
          <p className="text-xs text-[var(--text-3)] mt-1 font-mono">
            {healthyCount} of {totalFixtures} healthy · {atRiskCount} at risk
          </p>
        </div>
      </div>

      {/* 2. Flat Summary Strip */}
      <StatStrip>
        <Stat
          hero
          label="Facility health index"
          value={healthAvg}
          unit="/ 100"
          context={`${healthyCount} optimal · ${atRiskCount} at risk`}
        />
        <Stat
          label="Healthy fixtures"
          value={healthyCount}
          context="Optimal baseline"
        />
        <Stat
          label="Watch"
          value={watchCount}
          context="Slight baseline drift"
        />
        <Stat
          label="At risk"
          value={atRiskCount}
          context="Predictive intervention needed"
          delta={
            atRiskCount > 0
              ? { value: `${atRiskCount} fixtures`, direction: "up", sentiment: "negative" }
              : { value: "All optimal", direction: "down", sentiment: "positive" }
          }
        />
      </StatStrip>

      {/* 3. Grouped Shared Recommendations (if any) */}
      {groupedRecommendations.length > 0 && (
        <div className="space-y-2">
          {groupedRecommendations.map(([rec, fixtures], idx) => (
            <div
              key={idx}
              className="flex items-start gap-2.5 p-3 rounded-[var(--r-md)] border border-[var(--warning-solid)]/30 bg-[var(--warning-tint)] text-xs text-[var(--text-1)]"
            >
              <Info className="h-4 w-4 text-[var(--warning-fg)] shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-[var(--warning-fg)]">
                  Recommended for {fixtures.length}{" "}
                  {fixtures.length === 1 ? "fixture" : "fixtures"} ({fixtures.join(", ")}):
                </span>{" "}
                <span>{rec}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 4. "Needs Attention" Section (Standard cards, max 3/row, at-risk only) */}
      {atRiskFixtures.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-body font-semibold text-[var(--text-1)]">
              Needs attention ({atRiskFixtures.length})
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {atRiskFixtures.map((fix) => {
              const shortName = getFixtureShortLabel(fix.fixture_id);
              const zoneLabel = getZoneLabel(fix.zone_id);
              const isHighRisk = fix.status === "High Risk";

              return (
                <Card
                  key={fix.fixture_id}
                  tier="standard"
                  className={cn(
                    "flex flex-col justify-between gap-4 relative",
                    isHighRisk
                      ? "border-t-2 border-t-[var(--critical-solid)]"
                      : "border-t-2 border-t-[var(--warning-solid)]"
                  )}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-base font-semibold text-[var(--text-1)] font-mono">
                          {shortName}
                        </h3>
                        <p className="text-xs text-[var(--text-3)]">{zoneLabel}</p>
                      </div>
                      <Badge status={isHighRisk ? "critical" : "warning"}>
                        {fix.status}
                      </Badge>
                    </div>

                    <div className="pt-1">
                      <div className="text-xs text-[var(--text-3)]">Risk Score</div>
                      <div className="font-mono text-2xl font-bold num text-[var(--text-1)]">
                        {fix.risk_score.toFixed(0)}{" "}
                        <span className="text-xs font-normal text-[var(--text-3)]">
                          / 100
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-[var(--text-2)] leading-relaxed">
                      <strong className="text-[var(--text-1)]">Primary factor:</strong>{" "}
                      {getTopFactor(fix.risk_factors)}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-[var(--border-hairline)] flex items-center justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedFixture(fix)}
                      className="text-xs gap-1"
                    >
                      <span>Inspect breakdown</span>
                      <ArrowRight className="h-3 w-3" />
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      {/* 5. Toolbar */}
      <Toolbar className="border-b border-[var(--border-hairline)] pb-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-[var(--text-3)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search fixtures..."
            className="h-10 pl-9 pr-3 rounded-[var(--r-md)] border border-[var(--border-strong)] bg-[var(--bg-surface)] text-sm text-[var(--text-1)] placeholder-[var(--text-3)] focus:outline-2 focus:outline-[var(--accent-ring)]"
          />
        </div>

        {/* Zone Select */}
        <Select
          value={selectedZone}
          onValueChange={setSelectedZone}
          options={[
            { value: "all", label: "All zones" },
            ...ZONE_IDS.map((zid) => ({ value: zid, label: getZoneLabel(zid) })),
          ]}
          ariaLabel="Filter by zone"
        />

        {/* Risk Level Segmented */}
        <SegmentedControl
          value={riskSegment}
          onValueChange={setRiskSegment}
          items={[
            { value: "all", label: "All (17)" },
            { value: "at_risk", label: `At risk (${atRiskCount})` },
            { value: "watch", label: `Watch (${watchCount})` },
            { value: "healthy", label: `Healthy (${healthyCount})` },
          ]}
        />

        <ToolbarSpacer />

        {/* Sort */}
        <Select
          value={sortOption}
          onValueChange={setSortOption}
          options={[
            { value: "risk_desc", label: "Risk (Highest first)" },
            { value: "health_asc", label: "Health (Lowest first)" },
            { value: "fixture_id", label: "Fixture ID" },
          ]}
          ariaLabel="Sort fixtures"
        />
      </Toolbar>

      {/* 6. "All fixtures" Dense Table */}
      {filteredRecords.length === 0 ? (
        <EmptyState
          icon={<CheckCircle2 className="h-8 w-8 text-[var(--healthy-fg)]" />}
          title="No fixtures found"
          description="Try adjusting your zone or risk level filters."
        />
      ) : (
        <div className="rounded-[var(--r-md)] border border-[var(--border-hairline)] bg-[var(--bg-surface)] overflow-hidden">
          <Table dense>
            <TableHeader>
              <TableRow>
                <TableHead>Fixture</TableHead>
                <TableHead>Zone</TableHead>
                <TableHead align="right">Health score</TableHead>
                <TableHead>Top risk factor</TableHead>
                <TableHead>Trend</TableHead>
                <TableHead>State</TableHead>
                <TableHead align="right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecords.map((fix) => {
                const shortName = getFixtureShortLabel(fix.fixture_id);
                const zoneLabel = getZoneLabel(fix.zone_id);
                const isHighRisk = fix.status === "High Risk";
                const isDegrading = fix.status === "Degrading";

                return (
                  <TableRow
                    key={fix.fixture_id}
                    onClick={() => setSelectedFixture(fix)}
                    className="cursor-pointer"
                  >
                    <TableCell>
                      <span className="font-mono font-medium text-[var(--text-1)]">
                        {shortName}
                      </span>
                    </TableCell>
                    <TableCell>{zoneLabel}</TableCell>

                    {/* Inline health bar (4px) */}
                    <TableCell numeric>
                      <div className="inline-flex items-center gap-2">
                        <span className="font-mono font-semibold">
                          {fix.health_score.toFixed(0)}
                        </span>
                        <div className="w-16 h-1.5 rounded-full bg-[var(--border-hairline)] overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full",
                              fix.health_score < 60
                                ? "bg-[var(--critical-solid)]"
                                : fix.health_score < 80
                                ? "bg-[var(--warning-solid)]"
                                : "bg-[var(--healthy-solid)]"
                            )}
                            style={{ width: `${fix.health_score}%` }}
                          />
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <span className="text-xs text-[var(--text-2)]">
                        {getTopFactor(fix.risk_factors)}
                      </span>
                    </TableCell>

                    <TableCell>
                      <span className="text-xs inline-flex items-center gap-1 text-[var(--text-3)]">
                        {fix.trend === "Deteriorating" ? (
                          <TrendingDown className="h-3.5 w-3.5 text-[var(--critical-fg)]" />
                        ) : fix.trend === "Improving" ? (
                          <TrendingUp className="h-3.5 w-3.5 text-[var(--healthy-fg)]" />
                        ) : (
                          <Minus className="h-3.5 w-3.5" />
                        )}
                        <span>{fix.trend}</span>
                      </span>
                    </TableCell>

                    <TableCell>
                      <Badge
                        status={
                          isHighRisk
                            ? "critical"
                            : isDegrading
                            ? "warning"
                            : fix.status === "Watch"
                            ? "info"
                            : "healthy"
                        }
                      >
                        {fix.status}
                      </Badge>
                    </TableCell>

                    <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="text"
                        size="sm"
                        onClick={() => setSelectedFixture(fix)}
                        className="text-xs"
                      >
                        Inspect
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* 7. Fixture Detail Side Drawer */}
      <Drawer
        open={!!selectedFixture}
        onOpenChange={(open) => !open && setSelectedFixture(null)}
      >
        <DrawerContent
          title={`Fixture ${selectedFixture ? getFixtureShortLabel(selectedFixture.fixture_id) : ""}`}
          description={selectedFixture ? getZoneLabel(selectedFixture.zone_id) : ""}
        >
          {selectedFixture && (
            <div className="space-y-6 py-4">
              {/* Header Score */}
              <div className="flex items-center justify-between pb-4 border-b border-[var(--border-hairline)]">
                <div>
                  <span className="text-caption font-medium text-[var(--text-3)]">
                    Predictive health score
                  </span>
                  <div className="metric-hero font-mono num text-[var(--text-1)] mt-1">
                    {selectedFixture.health_score.toFixed(0)}
                    <span className="text-sm font-sans font-normal text-[var(--text-3)] ml-1">
                      / 100
                    </span>
                  </div>
                </div>
                <Badge
                  status={
                    selectedFixture.status === "High Risk"
                      ? "critical"
                      : selectedFixture.status === "Degrading"
                      ? "warning"
                      : "healthy"
                  }
                >
                  {selectedFixture.status}
                </Badge>
              </div>

              {/* 6 Risk Factors as Horizontal Bars */}
              <div className="space-y-3">
                <h4 className="text-body font-semibold text-[var(--text-1)]">
                  Risk factors (weighted contribution)
                </h4>
                <div className="space-y-2">
                  {Object.entries(selectedFixture.risk_factors)
                    .sort(([, a], [, b]) => (b as number) - (a as number))
                    .map(([key, val]) => {
                      const numVal = val as number;
                      const label =
                        RISK_FACTOR_LABELS[key as keyof FixtureRiskFactors] ||
                        key;
                      return (
                        <div key={key} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-[var(--text-2)]">{label}</span>
                            <span className="font-mono num font-semibold text-[var(--text-1)]">
                              {numVal.toFixed(0)}%
                            </span>
                          </div>
                          <div className="h-1.5 w-full bg-[var(--border-hairline)] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[var(--text-1)] rounded-full transition-all"
                              style={{ width: `${Math.min(100, numVal)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Recommendation */}
              {selectedFixture.recommendation && (
                <div className="p-3 rounded-[var(--r-md)] border border-[var(--border-hairline)] bg-[var(--bg-subtle)] space-y-1 text-xs">
                  <span className="font-semibold text-[var(--text-1)]">
                    Actionable Recommendation:
                  </span>
                  <p className="text-[var(--text-2)] leading-relaxed">
                    {selectedFixture.recommendation}
                  </p>
                </div>
              )}

              {/* Formula & Calculation Disclosure */}
              <Disclosure title="How the score is calculated">
                <div className="text-xs text-[var(--text-2)] space-y-2 pt-2 leading-relaxed">
                  <p>
                    The Predictive Health Index calculates asset degradation probability
                    from 6 continuous telemetry weights:
                  </p>
                  <ul className="list-disc pl-4 space-y-1 text-[var(--text-3)] font-mono text-[11px]">
                    <li>Continuous flow drift: 25%</li>
                    <li>Slow drip recurrence: 20%</li>
                    <li>Anomaly event frequency: 20%</li>
                    <li>Fault pattern recurrence: 15%</li>
                    <li>Sensor diagnostic health: 10%</li>
                    <li>Prolonged unaddressed status: 10%</li>
                  </ul>
                  <p className="text-[11px] text-[var(--text-3)] pt-1">
                    Scores &lt; 60 indicate immediate maintenance required to avoid continuous water loss.
                  </p>
                </div>
              </Disclosure>
            </div>
          )}
        </DrawerContent>
      </Drawer>
    </div>
  );
}
