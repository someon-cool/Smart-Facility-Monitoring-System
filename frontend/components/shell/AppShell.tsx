"use client";

import { type ReactNode } from "react";
import { SideNav, type TabId } from "./SideNav";
import { TopBar } from "./TopBar";
import { MobileTabBar } from "./MobileTabBar";
import { TooltipProvider } from "@/components/ui/Tooltip";

export interface AppShellProps {
  activeTab: TabId;
  onSelectTab: (tab: TabId) => void;
  openTicketsCount: number;
  hasCriticalTickets?: boolean;
  hygieneAlertCount?: number;
  hasCriticalHygiene?: boolean;
  onOpenCopilot: () => void;
  copilotOpen?: boolean;
  copilotPanel?: ReactNode;
  children: ReactNode;
}

export function AppShell({
  activeTab,
  onSelectTab,
  openTicketsCount,
  hasCriticalTickets = false,
  hygieneAlertCount = 0,
  hasCriticalHygiene = false,
  onOpenCopilot,
  copilotOpen = false,
  copilotPanel,
  children,
}: AppShellProps) {
  return (
    <TooltipProvider>
      <div
        className="min-h-screen flex font-sans antialiased"
        style={{ backgroundColor: "var(--bg-canvas)", color: "var(--text-1)" }}
      >
        {/* 2.5 Skip Link */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-[var(--bg-surface)] focus:text-[var(--text-1)] focus:border focus:border-[var(--accent-ring)] focus:rounded-[var(--r-md)] focus:shadow-[var(--shadow-2)]"
        >
          Skip to main content
        </a>

        {/* Left Navigation Rail (Desktop & Tablet) */}
        <SideNav
          activeTab={activeTab}
          onSelectTab={onSelectTab}
          openTicketsCount={openTicketsCount}
          hasCriticalTickets={hasCriticalTickets}
          hygieneAlertCount={hygieneAlertCount}
          hasCriticalHygiene={hasCriticalHygiene}
        />

        {/* Main Column */}
        <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
          <TopBar activeTab={activeTab} onOpenCopilot={onOpenCopilot} />

          <div className="flex-1 flex overflow-hidden">
            {/* Main Content Area: 1440px container max */}
            <main
              id="main-content"
              tabIndex={-1}
              className="flex-1 w-full mx-auto px-4 sm:px-6 xl:px-8 py-6 overflow-y-auto focus:outline-none"
              style={{ maxWidth: "var(--container-max, 1440px)" }}
            >
              {children}
            </main>

            {/* Docked AI Copilot (≥1280px) when open */}
            {copilotOpen && copilotPanel && (
              <aside className="hidden xl:block w-[400px] shrink-0 border-l border-[var(--border-hairline)] bg-[var(--bg-surface)] overflow-hidden">
                {copilotPanel}
              </aside>
            )}
          </div>
        </div>

        {/* Mobile Bottom Tab Bar (<768px) */}
        <MobileTabBar
          activeTab={activeTab}
          onSelectTab={onSelectTab}
          openTicketsCount={openTicketsCount}
          hasCriticalTickets={hasCriticalTickets}
          hygieneAlertCount={hygieneAlertCount}
          hasCriticalHygiene={hasCriticalHygiene}
        />
      </div>
    </TooltipProvider>
  );
}
