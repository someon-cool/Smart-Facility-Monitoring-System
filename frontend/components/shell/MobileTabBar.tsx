"use client";

import { useState } from "react";
import {
  LayoutDashboard,
  Ticket,
  Activity,
  ShieldCheck,
  MoreHorizontal,
  Cpu,
  Leaf,
  X,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { type TabId } from "./SideNav";

export interface MobileTabBarProps {
  activeTab: TabId;
  onSelectTab: (tab: TabId) => void;
  openTicketsCount: number;
  hasCriticalTickets?: boolean;
  hygieneAlertCount?: number;
  hasCriticalHygiene?: boolean;
}

export function MobileTabBar({
  activeTab,
  onSelectTab,
  openTicketsCount,
  hasCriticalTickets = false,
  hygieneAlertCount = 0,
  hasCriticalHygiene = false,
}: MobileTabBarProps) {
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const primaryItems = [
    { id: "dashboard" as TabId, label: "Overview", icon: LayoutDashboard },
    {
      id: "tickets" as TabId,
      label: "Tickets",
      icon: Ticket,
      badge:
        openTicketsCount > 0 ? (
          <span
            className={cn(
              "absolute top-1 right-2 h-4 min-w-[16px] px-1 rounded-full text-caption font-semibold num inline-flex items-center justify-center",
              hasCriticalTickets
                ? "bg-[var(--critical-tint)] text-[var(--critical-fg)]"
                : "bg-[var(--bg-subtle)] text-[var(--text-1)]"
            )}
          >
            {openTicketsCount}
          </span>
        ) : null,
    },
    { id: "health" as TabId, label: "Health", icon: Activity },
    {
      id: "hygiene" as TabId,
      label: "Hygiene",
      icon: ShieldCheck,
      badge:
        hygieneAlertCount > 0 ? (
          <span
            className={cn(
              "absolute top-1 right-2 h-4 min-w-[16px] px-1 rounded-full text-caption font-semibold num inline-flex items-center justify-center",
              hasCriticalHygiene
                ? "bg-[var(--warning-tint)] text-[var(--warning-fg)]"
                : "bg-[var(--bg-subtle)] text-[var(--text-1)]"
            )}
          >
            {hygieneAlertCount}
          </span>
        ) : null,
    },
  ];

  const secondaryItems = [
    { id: "sensors" as TabId, label: "Sensors", icon: Cpu },
    { id: "sustainability" as TabId, label: "Water savings", icon: Leaf },
    { id: "carbon" as TabId, label: "Carbon footprint", icon: Leaf },
  ];

  const isMoreActive =
    activeTab === "sensors" ||
    activeTab === "sustainability" ||
    activeTab === "carbon";

  return (
    <>
      {/* "More" Sheet Overlay */}
      {isMoreOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 md:hidden flex flex-col justify-end">
          <div className="bg-[var(--bg-raised)] border-t border-[var(--border-hairline)] p-4 rounded-t-[var(--r-lg)] space-y-3 shadow-[var(--shadow-3)]">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--border-hairline)]">
              <span className="text-sm font-semibold text-[var(--text-1)]">
                More Views
              </span>
              <button
                type="button"
                onClick={() => setIsMoreOpen(false)}
                className="p-1 text-[var(--text-3)] hover:text-[var(--text-1)] cursor-pointer"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex flex-col gap-1">
              {secondaryItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onSelectTab(item.id);
                      setIsMoreOpen(false);
                    }}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-[var(--r-md)] text-sm transition-colors text-left cursor-pointer",
                      isActive
                        ? "bg-[var(--bg-subtle)] text-[var(--text-1)] font-medium"
                        : "text-[var(--text-2)] hover:bg-[var(--bg-subtle)]"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Tab Bar */}
      <nav
        aria-label="Mobile Navigation"
        className="fixed bottom-0 left-0 right-0 z-30 h-16 md:hidden border-t border-[var(--border-hairline)] bg-[var(--bg-surface)] flex items-center justify-around px-2 select-none"
      >
        {primaryItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setIsMoreOpen(false);
                onSelectTab(item.id);
              }}
              className={cn(
                "relative flex flex-col items-center justify-center flex-1 h-full py-1 text-xs transition-colors cursor-pointer",
                isActive
                  ? "text-[var(--text-1)] font-medium"
                  : "text-[var(--text-3)] hover:text-[var(--text-2)]"
              )}
            >
              <Icon className="h-5 w-5 mb-0.5" strokeWidth={isActive ? 2 : 1.5} />
              <span className="text-[11px] leading-tight">{item.label}</span>
              {item.badge}
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => setIsMoreOpen(!isMoreOpen)}
          className={cn(
            "flex flex-col items-center justify-center flex-1 h-full py-1 text-xs transition-colors cursor-pointer",
            isMoreActive
              ? "text-[var(--text-1)] font-medium"
              : "text-[var(--text-3)] hover:text-[var(--text-2)]"
          )}
        >
          <MoreHorizontal className="h-5 w-5 mb-0.5" />
          <span className="text-[11px] leading-tight">More</span>
        </button>
      </nav>
    </>
  );
}
