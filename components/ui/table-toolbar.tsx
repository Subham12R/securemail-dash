"use client";

import { Download, Search } from "lucide-react";
import DateRangeFilter, { type SelectedDateRange } from "@/components/ui/date-range-filter";
import { RichButton } from "@/components/ui/rich-button";

export type TableFilter = {
  name: string;
  label: string;
  value: string;
  options: readonly string[];
};

type TableToolbarProps = {
  searchPlaceholder: string;
  filters?: readonly TableFilter[];
  onQueryChange: (query: string) => void;
  onFilterChange: (name: string, value: string) => void;
  onRangeChange?: (range: SelectedDateRange, label: string) => void;
  showDateRange?: boolean;
  showExport?: boolean;
};

export default function TableToolbar({
  searchPlaceholder,
  filters = [],
  onQueryChange,
  onFilterChange,
  onRangeChange,
  showDateRange = true,
  showExport = false,
}: TableToolbarProps) {
  return (
    <div className="flex flex-wrap gap-2 border-b border-zinc-100 p-4">
      <label className="relative min-w-56 flex-1">
        <span className="sr-only">{searchPlaceholder}</span>
        <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
        <input
          type="search"
          placeholder={searchPlaceholder}
          onChange={(event) => onQueryChange(event.target.value)}
          className="h-10 w-full rounded-xl border border-zinc-200 bg-zinc-50 pl-9 pr-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-2 focus:outline-offset-2 focus:outline-zinc-900"
        />
      </label>
      {showDateRange ? <DateRangeFilter variant="compact" onRangeChange={onRangeChange} /> : null}
      {filters.map((filter) => (
        <label key={filter.name} className="sr-only">
          {filter.label}
          <select
            value={filter.value}
            onChange={(event) => onFilterChange(filter.name, event.target.value)}
            className="not-sr-only h-10 min-w-36 rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-700 focus:outline-2 focus:outline-offset-2 focus:outline-zinc-900"
          >
            {filter.options.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </label>
      ))}
      {showExport ? (
        <RichButton type="button" size="icon" disabled aria-label="Export history" title="Export is not available yet">
          <Download aria-hidden="true" className="size-4" />
        </RichButton>
      ) : null}
    </div>
  );
}
