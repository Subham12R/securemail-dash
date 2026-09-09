import { ChevronRight } from "lucide-react";
import Link from "next/link";
import DashboardRefreshButton from "@/components/ui/dashboard-refresh-button";
import DateRangeFilter, { type DateRange } from "@/components/ui/date-range-filter";

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
  const dark = tone === "dark";

  return (
    <header
      style={{ viewTransitionName: "app-topbar" }}
      className={`sticky top-0 z-20 flex min-h-16 flex-wrap items-center justify-between gap-3 border-b py-3 pl-20 pr-6 backdrop-blur ${
        dark
          ? "border-[#173858] bg-[#08182c]/95 text-slate-100"
          : "border-zinc-200 bg-white/95"
      }`}
    >
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-3 text-sm font-medium"
      >
        <Link
          href="/"
          className={`transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ${
            dark
              ? "text-slate-400 hover:text-white focus-visible:outline-sky-300"
              : "text-zinc-500 hover:text-zinc-900 focus-visible:outline-zinc-900"
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

      <div className="flex items-center gap-2">
        {showRefresh ? <DashboardRefreshButton /> : null}
        {showDateRange ? <DateRangeFilter range={range} /> : null}
      </div>
    </header>
  );
}
