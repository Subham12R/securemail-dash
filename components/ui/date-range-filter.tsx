"use client";

import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { getLocalTimeZone, today, type CalendarDate } from "@internationalized/date";
import {
  Button,
  CalendarCell,
  CalendarGrid,
  CalendarHeading,
  Dialog,
  DialogTrigger,
  Popover,
  RangeCalendar,
  type RangeValue,
} from "react-aria-components";

export type DateRange = "all" | "7d" | "30d";
export type SelectedDateRange = RangeValue<CalendarDate>;
type Variant = "segmented" | "compact";

type Preset = { label: string; value: DateRange; href: string };
type QuickRange = { label: string; days: number };

const presets: Preset[] = [
  { label: "All", value: "all", href: "/?range=all" },
  { label: "Last 7 days", value: "7d", href: "/?range=7d" },
  { label: "Last 30 days", value: "30d", href: "/?range=30d" },
];

const quickRanges: QuickRange[] = [
  { label: "Today", days: 1 },
  { label: "Yesterday", days: 0 },
  { label: "Last 3 days", days: 3 },
  { label: "Last 7 days", days: 7 },
  { label: "Last 15 days", days: 15 },
  { label: "Last 30 days", days: 30 },
];

function presetClassName(active: boolean) {
  return `rounded px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 ${active ? "bg-zinc-900 text-white" : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"}`;
}

function rangeFor(days: number, currentDay: CalendarDate): RangeValue<CalendarDate> {
  if (days === 0) {
    const yesterday = currentDay.subtract({ days: 1 });
    return { start: yesterday, end: yesterday };
  }

  return { start: currentDay.subtract({ days: days - 1 }), end: currentDay };
}

function formatRange(range: RangeValue<CalendarDate>, timezone: string) {
  const options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  const start = range.start.toDate(timezone).toLocaleDateString("en-US", options);
  const end = range.end.toDate(timezone).toLocaleDateString("en-US", options);
  return `${start} – ${end}`;
}

export default function DateRangeFilter({
  range = "7d",
  variant = "segmented",
  onRangeChange,
}: {
  range?: DateRange;
  variant?: Variant;
  onRangeChange?: (range: SelectedDateRange, label: string) => void;
}) {
  const timezone = getLocalTimeZone();
  const currentDay = today(timezone);
  const [customRange, setCustomRange] = useState<RangeValue<CalendarDate>>(
    rangeFor(range === "30d" ? 30 : 7, currentDay),
  );
  const [isOpen, setIsOpen] = useState(false);
  const [label, setLabel] = useState(
    range === "all" ? "All time" : range === "30d" ? "Last 30 days" : "Last 7 days",
  );

  function selectRange(nextRange: RangeValue<CalendarDate>, nextLabel: string) {
    setCustomRange(nextRange);
    setLabel(nextLabel);
    setIsOpen(false);
    onRangeChange?.(nextRange, nextLabel);
  }

  const calendar = (
    <Popover className="z-30 mt-2 rounded-xl border border-zinc-200 bg-white p-3 shadow-lg outline-none">
      <Dialog aria-label="Choose a date range" className="outline-none">
        <div className="flex gap-4">
          <div className="flex min-w-28 flex-col gap-1 border-r border-zinc-100 pr-3">
            {quickRanges.map((quickRange) => (
              <Button
                key={quickRange.label}
                onPress={() => selectRange(rangeFor(quickRange.days, currentDay), quickRange.label)}
                className="rounded px-2 py-1.5 text-left text-sm text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-2 focus-visible:outline-zinc-900"
              >
                {quickRange.label}
              </Button>
            ))}
          </div>
          <RangeCalendar
            value={customRange}
            onChange={(value) => {
              if (!value) return;
              setCustomRange(value);
              if (value.start && value.end) selectRange(value, formatRange(value, timezone));
            }}
            className="space-y-3"
          >
            <header className="flex items-center justify-between gap-3">
              <Button
                slot="previous"
                aria-label="Previous month"
                className="grid size-8 place-items-center rounded text-zinc-600 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-zinc-900"
              >
                <ChevronLeft aria-hidden="true" className="size-4" />
              </Button>
              <CalendarHeading className="text-sm font-medium text-zinc-900" />
              <Button
                slot="next"
                aria-label="Next month"
                className="grid size-8 place-items-center rounded text-zinc-600 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-zinc-900"
              >
                <ChevronRight aria-hidden="true" className="size-4" />
              </Button>
            </header>
            <CalendarGrid className="border-collapse text-center text-xs text-zinc-600">
              {(date) => (
                <CalendarCell
                  date={date}
                  className="size-8 rounded data-[hovered]:bg-zinc-100 data-[selected]:bg-zinc-900 data-[selected]:text-white focus-visible:outline-2 focus-visible:outline-zinc-900"
                />
              )}
            </CalendarGrid>
          </RangeCalendar>
        </div>
      </Dialog>
    </Popover>
  );

  if (variant === "compact") {
    return (
      <DialogTrigger isOpen={isOpen} onOpenChange={setIsOpen}>
        <Button
          aria-label="Date range"
          className="inline-flex h-10 min-w-44 items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-700 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
        >
          {label}
          <ChevronDown aria-hidden="true" className="size-4" />
        </Button>
        {calendar}
      </DialogTrigger>
    );
  }

  return (
    <nav aria-label="Analysis date range" className="flex rounded-md border border-zinc-200 p-1">
      {presets.map((option) => (
        <Link
          key={option.value}
          href={option.href}
          aria-current={option.value === range ? "page" : undefined}
          className={presetClassName(option.value === range)}
        >
          {option.label}
        </Link>
      ))}
      <DialogTrigger isOpen={isOpen} onOpenChange={setIsOpen}>
        <Button className={presetClassName(false)}>Custom</Button>
        {calendar}
      </DialogTrigger>
    </nav>
  );
}
