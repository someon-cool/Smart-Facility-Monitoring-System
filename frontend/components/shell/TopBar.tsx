"use client";

import { Sparkles } from "lucide-react";
import { cn } from "@/lib/cn";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Button } from "@/components/ui/Button";
import { type TabId } from "./SideNav";

export interface TopBarProps {
  activeTab: TabId;
  onOpenCopilot: () => void;
  className?: string;
}

const TAB_TITLES: Record<TabId, string> = {
  dashboard: "Overview",
  tickets: "Tickets",
  health: "Fixture health",
  hygiene: "Hygiene",
  sustainability: "Water savings",
  carbon: "Carbon footprint",
  sensors: "Sensors",
};

export function TopBar({ activeTab, onOpenCopilot, className }: TopBarProps) {
  const title = TAB_TITLES[activeTab] || "Overview";

  return (
    <header
      className={cn(
        "h-14 shrink-0 flex items-center justify-between px-4 md:px-8 border-b border-[var(--border-hairline)] bg-[var(--bg-canvas)] select-none",
        className
      )}
    >
      {/* Page Title */}
      <div className="flex items-center gap-3">
        <h1 className="text-lg md:text-xl font-semibold text-[var(--text-1)] tracking-tight">
          {title}
        </h1>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-3">
        {/* Ghost Copilot Button: hairline border, text-1, sparkle icon in accent-text */}
        <button
          type="button"
          id="btn-ask-copilot"
          onClick={onOpenCopilot}
          className={cn(
            "inline-flex items-center gap-2 h-9 px-3 rounded-[var(--r-md)] border border-[var(--border-strong)]",
            "bg-transparent text-sm font-medium text-[var(--text-1)] hover:bg-[var(--bg-subtle)]",
            "focus-visible:outline-2 focus-visible:outline-[var(--accent-ring)] focus-visible:outline-offset-2",
            "transition-colors cursor-pointer"
          )}
        >
          <Sparkles className="h-4 w-4 text-[var(--accent-text)]" />
          <span>Ask Copilot</span>
        </button>

        <ThemeToggle />
      </div>
    </header>
  );
}
