"use client";

import { SegmentedControl } from "@/components/ui/SegmentedControl";

export interface ImpactSwitcherProps {
  currentView: "sustainability" | "carbon";
  onViewChange: (view: "sustainability" | "carbon") => void;
}

export function ImpactSwitcher({
  currentView,
  onViewChange,
}: ImpactSwitcherProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-[var(--border-hairline)]">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text-1)]">
          {currentView === "sustainability" ? "Water Savings" : "Carbon Footprint"}
        </h1>
        <p className="text-xs text-[var(--text-3)] mt-0.5">
          Terminal 2 environmental accounting and conservation impact model
        </p>
      </div>

      <SegmentedControl
        value={currentView}
        onValueChange={(val) => onViewChange(val as "sustainability" | "carbon")}
        items={[
          { value: "sustainability", label: "Water savings" },
          { value: "carbon", label: "Carbon footprint" },
        ]}
      />
    </div>
  );
}
