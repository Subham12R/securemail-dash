import { ChevronRight } from "lucide-react";
import Link from "next/link";
import DateRangeFilter, { type DateRange } from "@/components/ui/date-range-filter";

type DashboardTopbarProps = {
  currentPage: string;
  showDateRange?: boolean;
  range?: DateRange;
};

export default function DashboardTopbar({
  currentPage,
  showDateRange = false,
  range,
}: DashboardTopbarProps) {
  return (
    <header className="sticky top-0 z-20 flex min-h-16 flex-wrap items-center justify-between gap-3 border-b border-zinc-200 bg-white/95 py-3 pl-20 pr-6 backdrop-blur">
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-3 text-sm font-medium"
      >
        <Link
          href="/"
          className="text-zinc-500 transition-colors hover:text-zinc-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
        >
          Dashboard
        </Link>
        <ChevronRight
          aria-hidden="true"
          className="size-4 text-zinc-400"
          strokeWidth={1.75}
        />
        <span aria-current="page" className="text-zinc-900">
          {currentPage}
        </span>
      </nav>

      <div className="flex items-center gap-2">
        {showDateRange ? <DateRangeFilter range={range} /> : null}
      </div>
    </header>
  );
}
