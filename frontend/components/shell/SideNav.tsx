"use client";

import { useId } from "react";
import {
  LayoutDashboard,
  Ticket,
  Activity,
  ShieldCheck,
  Cpu,
  Leaf,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { Tooltip } from "@/components/ui/Tooltip";

export type TabId =
  | "dashboard"
  | "tickets"
  | "sustainability"
  | "health"
  | "hygiene"
  | "carbon"
  | "sensors";

export interface SideNavProps {
  activeTab: TabId;
  onSelectTab: (tab: TabId) => void;
  openTicketsCount: number;
  hasCriticalTickets?: boolean;
  hygieneAlertCount?: number;
  hasCriticalHygiene?: boolean;
  className?: string;
}

export function SideNav({
  activeTab,
  onSelectTab,
  openTicketsCount,
  hasCriticalTickets = false,
  hygieneAlertCount = 0,
  hasCriticalHygiene = false,
  className,
}: SideNavProps) {
  const isImpactActive =
    activeTab === "sustainability" || activeTab === "carbon";

  const navItemsOperations = [
    {
      id: "dashboard" as TabId,
      label: "Overview",
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: "tickets" as TabId,
      label: "Tickets",
      icon: Ticket,
      badge:
        openTicketsCount > 0 ? (
          <span
            aria-label={`Tickets, ${openTicketsCount} open`}
            className={cn(
              "h-5 min-w-[20px] px-1.5 rounded-full text-xs font-semibold num tabular-nums inline-flex items-center justify-center",
              hasCriticalTickets
                ? "bg-[var(--critical-tint)] text-[var(--critical-fg)]"
                : "bg-[var(--bg-subtle)] text-[var(--text-1)]"
            )}
          >
            {openTicketsCount}
          </span>
        ) : null,
    },
    {
      id: "health" as TabId,
      label: "Fixture health",
      icon: Activity,
      badge: null,
    },
    {
      id: "hygiene" as TabId,
      label: "Hygiene",
      icon: ShieldCheck,
      badge:
        hygieneAlertCount > 0 ? (
          <span
            aria-label={`Hygiene alerts, ${hygieneAlertCount} attention`}
            className={cn(
              "h-5 min-w-[20px] px-1.5 rounded-full text-xs font-semibold num tabular-nums inline-flex items-center justify-center",
              hasCriticalHygiene
                ? "bg-[var(--warning-tint)] text-[var(--warning-fg)]"
                : "bg-[var(--bg-subtle)] text-[var(--text-1)]"
            )}
          >
            {hygieneAlertCount}
          </span>
        ) : null,
    },
    {
      id: "sensors" as TabId,
      label: "Sensors",
      icon: Cpu,
      badge: null,
    },
  ];

  const impactItem = {
    id: (activeTab === "carbon" ? "carbon" : "sustainability") as TabId,
    label: "Water & carbon",
    icon: Leaf,
    badge: null,
  };

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col border-r border-[var(--border-hairline)] bg-[var(--bg-surface)] shrink-0 transition-all select-none",
        "w-16 xl:w-[232px]",
        className
      )}
    >
      {/* Brand Lockup */}
      <div className="h-20 flex flex-col justify-center px-4 xl:px-5 border-b border-[var(--border-hairline)] overflow-hidden">
        <div className="flex items-baseline gap-1.5">
          <span className="text-sm font-semibold tracking-[0.08em] text-[var(--text-1)]">
            FACILITY
          </span>
          <span className="hidden xl:inline text-xs text-[var(--text-3)] font-normal truncate">
            Monitor
          </span>
        </div>
        <p className="hidden xl:block text-caption text-[var(--text-3)] mt-0.5 truncate tracking-tight">
          Terminal 2 · 17 fixtures · 4 zones
        </p>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 py-4 px-2 xl:px-3 flex flex-col gap-6 overflow-y-auto">
        {/* Operations Section */}
        <div className="flex flex-col gap-1">
          <span className="hidden xl:block px-3 py-1 text-[11px] font-semibold text-[var(--text-3)] tracking-wider uppercase">
            Operations
          </span>
          {navItemsOperations.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <Tooltip key={item.id} content={item.label} side="right">
                <button
                  type="button"
                  id={`nav-item-${item.id}`}
                  onClick={() => onSelectTab(item.id)}
                  className={cn(
                    "group relative flex items-center h-10 w-full rounded-[var(--r-md)] px-3 text-sm transition-colors cursor-pointer text-left",
                    isActive
                      ? "bg-[var(--bg-subtle)] text-[var(--text-1)] font-semibold"
                      : "text-[var(--text-2)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-1)]",
                    isActive &&
                      "before:absolute before:left-0 before:top-2 before:bottom-2 before:w-[2px] before:bg-[var(--accent-ring)]"
                  )}
                >
                  <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.5} />
                  <span className="hidden xl:inline ml-3 flex-1 truncate">
                    {item.label}
                  </span>
                  <span className="hidden xl:inline ml-auto shrink-0">
                    {item.badge}
                  </span>
                </button>
              </Tooltip>
            );
          })}
        </div>

        {/* Hairline Divider */}
        <div className="h-px bg-[var(--border-hairline)] mx-2" />

        {/* Sustainability Section */}
        <div className="flex flex-col gap-1">
          <span className="hidden xl:block px-3 py-1 text-caption font-semibold text-[var(--text-3)] tracking-wider uppercase">
            Sustainability
          </span>
          <Tooltip content="Water & carbon" side="right">
            <button
              type="button"
              id="nav-item-sustainability"
              onClick={() => onSelectTab(impactItem.id)}
              className={cn(
                "group relative flex items-center h-10 w-full rounded-[var(--r-md)] px-3 text-sm transition-colors cursor-pointer text-left",
                isImpactActive
                  ? "bg-[var(--bg-subtle)] text-[var(--text-1)] font-semibold"
                  : "text-[var(--text-2)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-1)]",
                isImpactActive &&
                  "before:absolute before:left-0 before:top-2 before:bottom-2 before:w-[2px] before:bg-[var(--accent-ring)]"
              )}
            >
              <Leaf className="h-[18px] w-[18px] shrink-0" strokeWidth={1.5} />
              <span className="hidden xl:inline ml-3 flex-1 truncate">
                {impactItem.label}
              </span>
            </button>
          </Tooltip>
        </div>
      </nav>
    </aside>
  );
}
