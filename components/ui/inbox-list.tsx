"use client";

import { Flag, Mail, MoreHorizontal, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { MorphingText } from "@/components/ui/morphing-text";
import { cn } from "@/lib/utils";
import type {
  InboxFilter,
  InboxListItem,
  InboxListResponse,
  InboxSource,
} from "@/lib/inbox-data";

type InboxListProps = {
  items: readonly InboxListItem[];
  counts: InboxListResponse["counts"];
  filter: InboxFilter;
  selectedId: string | null;
  source?: InboxSource;
  isLoading: boolean;
  hasLoaded: boolean;
  error: string | null;
  onFilterChange: (filter: InboxFilter) => void;
  onSelect: (itemId: string, trigger: HTMLButtonElement) => void;
  onRetry: () => void;
};

const filters: Array<{ value: InboxFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "flagged", label: "Flagged" },
  { value: "healthy", label: "Healthy" },
];

const desktopGridClass =
  "sm:grid-cols-[minmax(0,1.3fr)_16rem_minmax(0,1.5fr)_8rem]";

function formatTime(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  const elapsed = Date.now() - date.getTime();
  if (elapsed >= 0 && elapsed < 7 * 24 * 60 * 60 * 1000) {
    const minutes = Math.floor(elapsed / 60_000);
    if (minutes < 1) return "now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function TriageBadge({ item }: { item: InboxListItem }) {
  const flagged = item.triage_state === "flagged";
  const Icon = flagged ? Flag : ShieldCheck;

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-full border px-2 py-1 text-[11px] font-semibold sm:justify-self-center",
        flagged
          ? "border-rose-200 bg-rose-50 text-rose-700"
          : item.triage_state === "healthy"
            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
            : "border-zinc-200 bg-zinc-50 text-zinc-600",
      )}
    >
      <Icon aria-hidden="true" className="size-3.5" />
      <span>
        {item.triage_state === "unavailable"
          ? "Unavailable"
          : flagged
            ? "Flagged"
            : "Healthy"}
      </span>
    </span>
  );
}

function ListSkeleton() {
  return (
    <ul aria-label="Loading Inbox messages" className="divide-y divide-zinc-200">
      {Array.from({ length: 7 }, (_, index) => (
        <li key={index} className="space-y-3 px-5 py-5">
          <div className="h-3 w-2/5 animate-pulse rounded bg-zinc-200" />
          <div className="h-3 w-4/5 animate-pulse rounded bg-zinc-200" />
          <div className="h-3 w-3/5 animate-pulse rounded bg-zinc-200" />
        </li>
      ))}
    </ul>
  );
}

export default function InboxList({
  items,
  counts,
  filter,
  selectedId,
  source,
  isLoading,
  hasLoaded,
  error,
  onFilterChange,
  onSelect,
  onRetry,
}: InboxListProps) {
  return (
    <section
      aria-labelledby="inbox-list-heading"
      aria-busy={isLoading}
      className="flex min-h-0 min-w-0 flex-1 flex-col bg-white p-4 sm:p-6"
    >
      <header className="shrink-0 px-1 pb-4 pt-1 sm:px-0">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <h1 id="inbox-list-heading" className="text-lg font-semibold tracking-tighter text-zinc-900">
                  Inbox
                </h1>
                {source === "fixture" ? (
                  <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-medium tracking-tighter text-amber-700">
                    Preview data
                  </span>
                ) : null}
              </div>
            </div>
            <p className="mt-1 text-sm text-zinc-600">
              <MorphingText>{counts.all}</MorphingText> emails ·{" "}
              <span className="text-rose-700">
                <MorphingText>{counts.flagged}</MorphingText> flagged
              </span>
            </p>
          </div>
          <Mail aria-hidden="true" className="mt-1 size-5 text-zinc-400" />
        </div>

        <fieldset className="mt-5 flex flex-wrap gap-2">
          <legend className="sr-only">Inbox filters</legend>
          {filters.map((option) => {
            const count = counts[option.value];
            const active = filter === option.value;
            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={active}
                onClick={() => onFilterChange(option.value)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-md border px-3 py-2 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700",
                  active
                    ? option.value === "flagged"
                      ? "border-rose-300 bg-rose-50 text-rose-700"
                      : option.value === "healthy"
                        ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                        : "border-sky-500 bg-sky-50 text-sky-800"
                    : "border-zinc-200 bg-zinc-50 text-zinc-600 hover:border-zinc-400 hover:text-zinc-900",
                )}
              >
                {option.value === "flagged" ? <Flag aria-hidden="true" className="size-3.5" /> : null}
                {option.value === "healthy" ? <ShieldCheck aria-hidden="true" className="size-3.5" /> : null}
                <span>{option.label}</span>
                <span className="tabular-nums">{count}</span>
              </button>
            );
          })}
        </fieldset>
      </header>

      <Card className="min-h-0 flex-1 overflow-hidden">
        <div className="min-h-0 h-full overflow-y-auto">
        {isLoading && !hasLoaded ? <ListSkeleton /> : null}

        {!isLoading && error ? (
          <div role="alert" className="m-5 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
            <p className="font-medium">Inbox unavailable</p>
            <p className="mt-1 text-rose-700">{error}</p>
            <button
              type="button"
              onClick={onRetry}
              className="mt-4 rounded-md border border-rose-300 px-3 py-2 text-xs font-medium text-rose-800 transition-colors hover:bg-rose-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-700"
            >
              Retry
            </button>
          </div>
        ) : null}

        {!error && hasLoaded && items.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-zinc-600">
            No messages match this filter.
          </p>
        ) : null}

        {!error && items.length > 0 ? (
          <>
            <div className={cn(
              "hidden gap-3 border-b border-zinc-200 bg-zinc-50 px-5 py-2 pr-14 text-[11px] font-medium text-zinc-500 sm:grid",
              desktopGridClass,
            )}>
              <span>To</span>
              <span className="text-center">Status</span>
              <span>Subject</span>
              <span className="text-right">Received</span>
            </div>
            <ul aria-label="Inbox messages" className="divide-y divide-zinc-200">
              {items.map((item, index) => {
                const recipient = item.recipients[0]?.address ?? "Recipient unavailable";
                return (
                  <li
                    key={item.mail_item_id}
                    style={{ animationDelay: `${Math.min(index, 8) * 16}ms` }}
                    className="animate-row-reveal relative flex items-stretch"
                  >
                    <button
                      type="button"
                      aria-pressed={selectedId === item.mail_item_id}
                      onClick={(event) => onSelect(item.mail_item_id, event.currentTarget)}
                      className={cn(
                        "grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-2 border-l-2 px-4 py-4 pr-14 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-sky-600 sm:items-center sm:gap-3 sm:px-5 sm:py-3.5 sm:pr-14",
                        desktopGridClass,
                        selectedId === item.mail_item_id
                          ? "border-l-sky-600 bg-sky-50"
                          : "border-l-transparent hover:bg-zinc-50",
                      )}
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl border-2 border-zinc-200 bg-white text-emerald-700 shadow-[inset_0_0_0_3px_rgba(16,185,129,0.08)]">
                          <Mail aria-hidden="true" className="size-4" />
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium text-zinc-900" title={recipient}>
                            {recipient}
                          </span>
                          <span className="mt-0.5 block truncate text-xs text-zinc-500" title={item.sender.address ?? "Sender unavailable"}>
                            From {item.sender.address ?? "Sender unavailable"}
                          </span>
                        </span>
                      </span>
                      <TriageBadge item={item} />
                      <span className="min-w-0 pl-12 sm:pl-0">
                        <span className="block truncate text-sm font-medium text-zinc-900" title={item.subject ?? "Subject unavailable"}>
                          {item.subject ?? "Subject unavailable"}
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-zinc-500" title={item.preview ?? "Preview unavailable"}>
                          {item.preview ?? "Preview unavailable"}
                        </span>
                      </span>
                      <time dateTime={item.observed_at ?? undefined} className="whitespace-nowrap pl-12 text-xs text-zinc-500 sm:pl-0 sm:text-right">
                        {formatTime(item.observed_at)}
                      </time>
                    </button>
                    <button
                      type="button"
                      aria-label={`Inspect ${item.subject ?? "message"}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        onSelect(item.mail_item_id, event.currentTarget);
                      }}
                      className="absolute right-3 top-1/2 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-zinc-200 hover:text-zinc-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700"
                    >
                      <MoreHorizontal aria-hidden="true" className="size-4" />
                    </button>
                  </li>
                );
              })}
            </ul>
          </>
        ) : null}
        </div>
      </Card>
    </section>
  );
}
