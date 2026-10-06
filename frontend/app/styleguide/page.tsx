"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { Badge } from "@/components/ui/Badge";
import { SeverityMark } from "@/components/ui/SeverityMark";
import { Card } from "@/components/ui/Card";
import { Stat, StatStrip } from "@/components/ui/Stat";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Select, MultiSelectPopover } from "@/components/ui/Select";
import { Toolbar, ToolbarSpacer, ToolbarDivider } from "@/components/ui/Toolbar";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  ExpandableTableRow,
} from "@/components/ui/Table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/Dialog";
import { Drawer, DrawerContent } from "@/components/ui/Drawer";
import { Tooltip, TooltipProvider } from "@/components/ui/Tooltip";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/Popover";
import { Disclosure } from "@/components/ui/Disclosure";
import { Skeleton, SkeletonCard } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { CopyableId } from "@/components/ui/CopyableId";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { ChartFrame } from "@/components/ui/ChartFrame";
import { ChartTooltip } from "@/components/ui/ChartTooltip";
import { VisuallyHidden } from "@/components/ui/VisuallyHidden";
import {
  Sparkles,
  RotateCw,
  Search,
  CheckCircle2,
} from "lucide-react";

export default function StyleguidePage() {
  const [segmentedVal, setSegmentedVal] = useState("all");
  const [selectVal, setSelectVal] = useState("option1");
  const [multiSelectVal, setMultiSelectVal] = useState<string[]>(["opt1"]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <TooltipProvider>
      <div
        className="min-h-screen p-8 space-y-12 max-w-6xl mx-auto font-sans"
        style={{ backgroundColor: "var(--bg-canvas)", color: "var(--text-1)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border-hairline)] pb-6">
          <div>
            <span className="eyebrow text-xs uppercase tracking-wider text-[var(--text-3)] font-semibold">
              Terminal 2 Operations
            </span>
            <h1 className="text-3xl font-bold tracking-tight text-[var(--text-1)] mt-1">
              Design System & UI Primitives
            </h1>
            <p className="text-sm text-[var(--text-2)] mt-1">
              "Porcelain & Brass": Calm, precise, industrial-editorial components.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
          </div>
        </div>

        {/* Buttons */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold border-b border-[var(--border-hairline)] pb-2">
            Buttons & Icon Buttons
          </h2>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="primary">Primary (Ink)</Button>
            <Button variant="ghost">Ghost Hairline</Button>
            <Button variant="text">Text Underline</Button>
            <Button variant="danger">Danger</Button>
            <Button variant="primary" loading>Loading</Button>
            <Button variant="ghost" disabled>Disabled</Button>
            <IconButton label="Ask Copilot">
              <Sparkles className="h-4 w-4 text-[var(--accent-text)]" />
            </IconButton>
            <IconButton label="Refresh">
              <RotateCw className="h-4 w-4" />
            </IconButton>
          </div>
        </section>

        {/* Badges & Severity Marks */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold border-b border-[var(--border-hairline)] pb-2">
            Status Badges & Severity Marks
          </h2>
          <div className="flex flex-wrap items-center gap-4">
            <Badge status="critical">Critical Issue</Badge>
            <Badge status="warning">Warning / Open</Badge>
            <Badge status="healthy">Healthy / Resolved</Badge>
            <Badge status="info">Info / Dispatched</Badge>
          </div>
          <div className="flex flex-wrap items-center gap-6">
            <SeverityMark severity="critical" />
            <SeverityMark severity="high" />
            <SeverityMark severity="medium" />
            <SeverityMark severity="low" />
          </div>
        </section>

        {/* Cards & Tiers */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold border-b border-[var(--border-hairline)] pb-2">
            Card Hierarchy: Hero, Standard, Flat
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card tier="hero">
              <span className="text-xs font-semibold text-[var(--accent-text)] uppercase tracking-wider">
                Hero Tier
              </span>
              <h3 className="text-lg font-semibold mt-1">Attention Now Band</h3>
              <p className="text-sm text-[var(--text-2)] mt-2">
                Reserved for at most 1 hero module per screen. Elevated with shadow-1 and 24px padding.
              </p>
            </Card>
            <Card tier="standard">
              <span className="text-xs font-semibold text-[var(--text-3)] uppercase tracking-wider">
                Standard Tier
              </span>
              <h3 className="text-lg font-semibold mt-1">Standard Module</h3>
              <p className="text-sm text-[var(--text-2)] mt-2">
                Flat background with 1px hairline border and r-md radius. No shadow.
              </p>
            </Card>
            <Card tier="flat">
              <span className="text-xs font-semibold text-[var(--text-3)] uppercase tracking-wider">
                Flat Tier
              </span>
              <h3 className="text-lg font-semibold mt-1">Flat Region</h3>
              <p className="text-sm text-[var(--text-2)] mt-2">
                No border and no background, separated by spacing and hairlines.
              </p>
            </Card>
          </div>
        </section>

        {/* Stats & StatStrip */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold border-b border-[var(--border-hairline)] pb-2">
            KPI Metrics & StatStrip
          </h2>
          <StatStrip>
            <Stat
              hero
              label="Open tickets"
              value={7}
              context="of 17 total flagged"
              delta={{ value: "2 vs yesterday", direction: "down", sentiment: "positive" }}
            />
            <Stat
              label="Facility health index"
              value="91"
              unit="/ 100"
              context="14 optimal · 3 watch"
            />
            <Stat
              label="Water lost"
              value="1,420"
              unit="L"
              context="₹4,260 cost impact"
              delta={{ value: "5%", direction: "up", sentiment: "negative" }}
            />
            <Stat
              label="Emissions"
              value="284"
              unit="kg CO₂e"
              context="Simulated 7 days"
            />
          </StatStrip>
        </section>

        {/* Toolbar & Controls */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold border-b border-[var(--border-hairline)] pb-2">
            Toolbar & Interactive Controls
          </h2>
          <Toolbar>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-[var(--text-3)]" />
              <input
                type="text"
                placeholder="Search fixtures..."
                className="h-10 pl-9 pr-3 rounded-[var(--r-md)] border border-[var(--border-strong)] bg-[var(--bg-surface)] text-sm text-[var(--text-1)] placeholder-[var(--text-3)] focus:outline-2 focus:outline-[var(--accent-ring)]"
              />
            </div>
            <SegmentedControl
              value={segmentedVal}
              onValueChange={setSegmentedVal}
              items={[
                { value: "all", label: "All (17)" },
                { value: "risk", label: "At Risk (3)" },
                { value: "healthy", label: "Healthy (14)" },
              ]}
            />
            <Select
              value={selectVal}
              onValueChange={setSelectVal}
              options={[
                { value: "option1", label: "All Severities" },
                { value: "option2", label: "Critical Only" },
                { value: "option3", label: "Medium & Low" },
              ]}
            />
            <MultiSelectPopover
              label="Zones"
              options={[
                { value: "opt1", label: "Restroom A (Departure)" },
                { value: "opt2", label: "Restroom B (Arrival)" },
                { value: "opt3", label: "Family Room" },
                { value: "opt4", label: "Staff WC" },
              ]}
              selectedValues={multiSelectVal}
              onChange={setMultiSelectVal}
            />
            <ToolbarSpacer />
            <ToolbarDivider />
            <Button variant="ghost" size="sm">Export CSV</Button>
          </Toolbar>
        </section>

        {/* Table & Expandable Rows */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold border-b border-[var(--border-hairline)] pb-2">
            Table & Expandable Rows
          </h2>
          <div className="rounded-[var(--r-md)] border border-[var(--border-hairline)] overflow-hidden bg-[var(--bg-surface)]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8"></TableHead>
                  <TableHead sortable sortDirection="descending">Severity</TableHead>
                  <TableHead>Fixture & Location</TableHead>
                  <TableHead>Flagged Date</TableHead>
                  <TableHead align="right" sortable>Flow Rate</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead align="right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <ExpandableTableRow
                  colSpan={7}
                  severityRail="critical"
                  expandedContent={
                    <div className="space-y-2">
                      <p className="font-medium text-[var(--text-1)]">
                        Continuous flush anomaly detected across 6 hours.
                      </p>
                      <p className="text-xs text-[var(--text-3)]">
                        Water waste rate estimated at 2.4 L/min. Recommendation: Inspect solenoid valve seal.
                      </p>
                      <CopyableId fullId="TKT-948192-A8-D720" />
                    </div>
                  }
                >
                  <TableCell>
                    <SeverityMark severity="critical" />
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium text-[var(--text-1)]">T2-WC-03</div>
                      <div className="text-xs text-[var(--text-3)]">Restroom A (Departure)</div>
                    </div>
                  </TableCell>
                  <TableCell>21 Jan, 09:40</TableCell>
                  <TableCell numeric>2.4 L/min</TableCell>
                  <TableCell>
                    <Badge status="warning">Open</Badge>
                  </TableCell>
                  <TableCell align="right">
                    <Button variant="text" size="sm" onClick={() => setIsDialogOpen(true)}>
                      Resolve
                    </Button>
                  </TableCell>
                </ExpandableTableRow>

                <TableRow severityRail="warning">
                  <TableCell className="w-8"></TableCell>
                  <TableCell>
                    <SeverityMark severity="medium" />
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium text-[var(--text-1)]">T2-FA-02</div>
                      <div className="text-xs text-[var(--text-3)]">Restroom B (Arrival)</div>
                    </div>
                  </TableCell>
                  <TableCell>21 Jan, 11:15</TableCell>
                  <TableCell numeric>0.8 L/min</TableCell>
                  <TableCell>
                    <Badge status="info">Dispatched</Badge>
                  </TableCell>
                  <TableCell align="right">
                    <Button variant="text" size="sm">Details</Button>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </section>

        {/* Modal & Drawer Triggers */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold border-b border-[var(--border-hairline)] pb-2">
            Dialogs & Drawers
          </h2>
          <div className="flex gap-4">
            <Button variant="primary" onClick={() => setIsDialogOpen(true)}>
              Open Resolve Dialog
            </Button>
            <Button variant="ghost" onClick={() => setIsDrawerOpen(true)}>
              Open Fixture Detail Drawer
            </Button>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Resolve Ticket TKT-948192</DialogTitle>
                <DialogDescription>
                  Log your maintenance notes to complete this maintenance incident.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 py-2">
                <label className="text-xs font-medium text-[var(--text-2)]">
                  Resolution notes (required)
                </label>
                <textarea
                  rows={3}
                  placeholder="E.g., Replaced worn solenoid diaphragm and verified zero flow."
                  className="w-full rounded-[var(--r-md)] border border-[var(--border-strong)] bg-[var(--bg-surface)] p-2.5 text-sm text-[var(--text-1)] placeholder-[var(--text-3)] focus:outline-2 focus:outline-[var(--accent-ring)]"
                />
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={() => setIsDialogOpen(false)}>
                  Resolve Ticket
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
            <DrawerContent
              title="Fixture T2-WC-03 Details"
              description="Terminal 2 · Restroom A (Departure)"
            >
              <div className="space-y-4 py-4">
                <Stat
                  hero
                  label="Health Score"
                  value="42"
                  unit="/ 100"
                  context="Status: At Risk"
                />
                <Disclosure title="How score is calculated" defaultOpen>
                  <p className="text-xs text-[var(--text-3)] leading-relaxed">
                    Calculated from 6 weighted telemetry factors: Flush duration anomaly (30%), Continuous leak detection (25%), Sensor health (15%), Temperature drift (10%), Hygiene cycles (10%), Fleet peer deviation (10%).
                  </p>
                </Disclosure>
              </div>
            </DrawerContent>
          </Drawer>
        </section>

        {/* Chart Frame & Tooltip Demo */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold border-b border-[var(--border-hairline)] pb-2">
            Chart Frame & Shared Tooltip
          </h2>
          <ChartFrame
            title="Telemetry Flow Rate"
            unit="L/min"
            subtitle="7-day operational telemetry across Terminal 2 zones"
            ariaLabel="Telemetry flow rate line chart"
            tableData={{
              columns: ["Zone", "Current (L/min)", "Peak (L/min)"],
              rows: [
                ["Restroom A (Departure)", 4.2, 12.8],
                ["Restroom B (Arrival)", 2.1, 8.4],
                ["Family Room", 0.6, 2.3],
                ["Staff WC", 0.2, 1.1],
              ],
            }}
          >
            <div className="h-32 flex items-center justify-center border border-dashed border-[var(--border-hairline)] rounded-[var(--r-md)] text-xs text-[var(--text-3)]">
              [Chart Canvas Area]
            </div>
          </ChartFrame>

          <div className="max-w-xs">
            <span className="text-xs text-[var(--text-3)] block mb-1">Shared Tooltip Preview:</span>
            <ChartTooltip
              title="21 Jan 2024, 14:30"
              rows={[
                { name: "Restroom A", value: 4.2, unit: "L/min", color: "#0072B2" },
                { name: "Restroom B", value: 2.1, unit: "L/min", color: "#B5558C" },
                { name: "Family Room", value: 0.6, unit: "L/min", color: "#B87800" },
              ]}
            />
          </div>
        </section>

        {/* Skeletons & Feedback States */}
        <section className="space-y-4 pb-16">
          <h2 className="text-xl font-semibold border-b border-[var(--border-hairline)] pb-2">
            Skeletons & Feedback States
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SkeletonCard />
            <ErrorState
              message="Could not stream telemetry data for Restroom B."
              onRetry={() => {}}
            />
          </div>
          <EmptyState
            icon={<CheckCircle2 className="h-8 w-8 text-[var(--healthy-fg)]" />}
            title="No open incidents"
            description="All smart fixtures across Terminal 2 are operating within normal baseline parameters."
          />
        </section>
      </div>
    </TooltipProvider>
  );
}
