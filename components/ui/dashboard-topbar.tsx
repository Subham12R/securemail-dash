"use client";

import { ChevronRight, PanelLeftIcon, PanelRightIcon } from "lucide-react";
import Link from "next/link";
import DashboardRefreshButton from "@/components/ui/dashboard-refresh-button";
import DateRangeFilter, { type DateRange } from "@/components/ui/date-range-filter";
import ThemeToggle from "@/components/ui/theme-toggle";
import { useSidebar } from "@/components/providers/sidebar-provider";

type DashboardTopbarProps = {
  currentPage: string;
  showDateRange?: boolean;
  showRefresh?: boolean;
  range?: DateRange;
  tone?: "light" | "dark";
};

export default function DashboardTopbar({
  currentPage,
  showDateRange = false,
  showRefresh = false,
  range,
  tone = "light",
}: DashboardTopbarProps) {
  const { collapsed, toggleSidebar } = useSidebar();
  const dark = tone === "dark";

  return (
    <header
      style={{ viewTransitionName: "app-topbar" }}
      className={`sticky top-0 z-20 flex min-h-15 flex-wrap items-center justify-between gap-3 border-b px-6 py-3 ${
        dark
          ? "border-[#173858] bg-[#08182c]/95 text-slate-100"
          : "border-black/10 bg-white text-zinc-900 shadow-sm"
      }`}
    >
      <div className="flex min-w-0 shrink-0 items-center gap-4">
        <button
          type="button"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-controls="dashboard-sidebar"
          aria-expanded={!collapsed}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          onClick={toggleSidebar}
          className="inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-black/10 bg-white text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
        >
          {collapsed ? <PanelLeftIcon size={18} aria-hidden="true" /> : <PanelRightIcon size={18} aria-hidden="true" />}
        </button>
        <nav
          aria-label="Breadcrumb"
          className="flex min-w-0 items-center gap-3 whitespace-nowrap text-sm font-medium"
        >
          <Link
            href="/"
            className={`transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ${
              dark
                ? "text-slate-400 hover:text-white focus-visible:outline-[var(--color-lime-pulse)]"
                : "text-zinc-600 hover:text-zinc-900 focus-visible:outline-zinc-900"
            }`}
          >
            Dashboard
          </Link>
          <ChevronRight
            aria-hidden="true"
            className={`size-4 ${dark ? "text-slate-600" : "text-zinc-400"}`}
            strokeWidth={1.75}
          />
          <span aria-current="page" className={dark ? "text-white" : "text-zinc-900"}>
            {currentPage}
          </span>
        </nav>
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-2">
        {showRefresh ? <DashboardRefreshButton /> : null}
        {showDateRange ? <DateRangeFilter range={range} /> : null}
        <ThemeToggle />
      </div>
    </header>
  );
}
