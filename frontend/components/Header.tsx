"use client";

import React from "react";
import { Sparkles, LayoutDashboard, Ticket, Leaf, Activity, ShieldCheck, Globe, Cpu } from "lucide-react";

interface HeaderProps {
  activeTab: "dashboard" | "tickets" | "sustainability" | "health" | "hygiene" | "carbon" | "sensors";
  setActiveTab: (tab: "dashboard" | "tickets" | "sustainability" | "health" | "hygiene" | "carbon" | "sensors") => void;
  openCopilot: () => void;
  openTicketsCount: number;
  hygieneAlertCount?: number;
}

export function Header({
  activeTab,
  setActiveTab,
  openCopilot,
  openTicketsCount,
  hygieneAlertCount = 0,
}: HeaderProps) {
  return (
    <header className="border-b border-white/[0.08] bg-[#101010]/95 backdrop-blur-md sticky top-0 z-30 px-6 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Brand Lockup */}
        <div className="shrink-0 flex items-center gap-3">
          <div>
            <h1 className="text-base font-bold tracking-wider text-white uppercase flex items-center gap-1.5">
              SMART <span className="font-light text-[#8B949E]">Facility Monitor</span>
            </h1>
            <p className="text-[10px] text-[#8B949E] hidden lg:block">
              Terminal 2 Airport Restroom · 17 Smart Fixtures
            </p>
          </div>
        </div>

        {/* Main Navigation Tabs */}
        <nav className="flex items-center bg-[#080808] p-1 rounded-lg border border-white/[0.06] gap-0.5 shrink-0 overflow-x-auto no-scrollbar">
          <button
            id="nav-tab-dashboard"
            onClick={() => setActiveTab("dashboard")}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === "dashboard"
                ? "bg-[#1B222C] text-white shadow-sm font-semibold border border-[#4D88C7]/30"
                : "text-[#8B949E] hover:text-white"
            }`}
          >
            <LayoutDashboard className={`h-3.5 w-3.5 ${activeTab === "dashboard" ? "text-[#4D88C7]" : "text-[#8B949E]"}`} />
            <span>Dashboard</span>
          </button>
          <button
            id="nav-tab-tickets"
            onClick={() => setActiveTab("tickets")}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === "tickets"
                ? "bg-[#1B222C] text-white shadow-sm font-semibold border border-[#D4A359]/30"
                : "text-[#8B949E] hover:text-white"
            }`}
          >
            <Ticket className={`h-3.5 w-3.5 ${activeTab === "tickets" ? "text-[#D4A359]" : "text-[#8B949E]"}`} />
            <span>Tickets</span>
            {openTicketsCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[#F04438]/20 border border-[#F04438]/40 text-[#F04438]">
                {openTicketsCount}
              </span>
            )}
          </button>
          <button
            id="nav-tab-sustainability"
            onClick={() => setActiveTab("sustainability")}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === "sustainability"
                ? "bg-[#1B222C] text-white shadow-sm font-semibold border border-[#2EB88A]/30"
                : "text-[#8B949E] hover:text-white"
            }`}
          >
            <Leaf className={`h-3.5 w-3.5 ${activeTab === "sustainability" ? "text-[#2EB88A]" : "text-[#8B949E]"}`} />
            <span>Sustainability</span>
          </button>
          <button
            id="nav-tab-health"
            onClick={() => setActiveTab("health")}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === "health"
                ? "bg-[#1B222C] text-white shadow-sm font-semibold border border-[#4D88C7]/30"
                : "text-[#8B949E] hover:text-white"
            }`}
          >
            <Activity className={`h-3.5 w-3.5 ${activeTab === "health" ? "text-[#4D88C7]" : "text-[#8B949E]"}`} />
            <span>Health</span>
          </button>
          <button
            id="nav-tab-hygiene"
            onClick={() => setActiveTab("hygiene")}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === "hygiene"
                ? "bg-[#1B222C] text-white shadow-sm font-semibold border border-[#06B6D4]/40"
                : "text-[#8B949E] hover:text-white"
            }`}
          >
            <ShieldCheck className={`h-3.5 w-3.5 ${activeTab === "hygiene" ? "text-[#06B6D4]" : "text-[#8B949E]"}`} />
            <span>Hygiene</span>
            {hygieneAlertCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[#F79009]/20 border border-[#F79009]/40 text-[#F79009]">
                {hygieneAlertCount}
              </span>
            )}
          </button>
          <button
            id="nav-tab-carbon"
            onClick={() => setActiveTab("carbon")}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === "carbon"
                ? "bg-[#1B222C] text-white shadow-sm font-semibold border border-[#2EB88A]/40"
                : "text-[#8B949E] hover:text-white"
            }`}
          >
            <Globe className={`h-3.5 w-3.5 ${activeTab === "carbon" ? "text-[#2EB88A]" : "text-[#8B949E]"}`} />
            <span>Carbon</span>
          </button>
          <button
            id="nav-tab-sensors"
            onClick={() => setActiveTab("sensors")}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === "sensors"
                ? "bg-[#1B222C] text-white shadow-sm font-semibold border border-[#4D88C7]/40"
                : "text-[#8B949E] hover:text-white"
            }`}
          >
            <Cpu className={`h-3.5 w-3.5 ${activeTab === "sensors" ? "text-[#4D88C7]" : "text-[#8B949E]"}`} />
            <span>Sensors</span>
          </button>
        </nav>

        {/* Far-Right Control: AI Copilot Trigger */}
        <div className="flex items-center shrink-0">
          <button
            id="btn-open-copilot"
            onClick={openCopilot}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-[#D4A359]/20 via-[#4D88C7]/20 to-[#D4A359]/20 hover:from-[#D4A359]/30 hover:to-[#4D88C7]/30 text-[#F0F6FC] border border-[#D4A359]/50 hover:border-[#D4A359] transition-all shadow-sm shrink-0"
            title="Open AI Facility Copilot"
          >
            <Sparkles className="h-3.5 w-3.5 text-[#D4A359]" />
            <span>AI Copilot</span>
          </button>
        </div>
      </div>
    </header>
  );
}
