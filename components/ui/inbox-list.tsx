"use client";

import {
  AlertTriangle,
  Check,
  CircleSlash2,
  Flag,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { MorphingText } from "@/components/ui/morphing-text";
import { cn } from "@/lib/utils";
import type {
  InboxFilter,
  InboxListItem,
  InboxListResponse,
  ViewCheck,
} from "@/lib/inbox-data";

type InboxListProps = {
  items: readonly InboxListItem[];
  counts: InboxListResponse["counts"];
  filter: InboxFilter;
  selectedId: string | null;
  isLoading: boolean;
  error: string | null;
  onFilterChange: (filter: InboxFilter) => void;
  onSelect: (itemId: string) => void;
  onRetry: () => void;
};

const filters: Array<{ value: InboxFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "flagged", label: "Flagged" },
  { value: "healthy", label: "Healthy" },
];

const checkLabels: Array<{
  key: keyof InboxListItem["view_checks"];
  label: string;
}> = [
  { key: "headers", label: "Headers" },
  { key: "content", label: "Content" },
  { key: "tcp", label: "TCP" },
  { key: "tls", label: "TLS" },
];

function formatTime(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(date);
}

function CheckChip({ check, label }: { check: ViewCheck; label: string }) {
  const state = check.state;
  const Icon =
    state === "pass"
      ? Check
      : state === "flagged"
        ? AlertTriangle
        : state === "unavailable"
          ? CircleSlash2
          : CircleSlash2;
  const tone =
    state === "pass"
      ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
      : state === "flagged"
        ? "border-rose-400/20 bg-rose-400/10 text-rose-300"
        : "border-slate-500/30 bg-slate-500/10 text-slate-400";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-medium",
        tone,
      )}
      title={`${label}: ${check.label ?? state}`}
    >
      <Icon aria-hidden="true" className="size-3" />
      <span>{label}</span>
    </span>
  );
}

function TriageBadge({ item }: { item: InboxListItem }) {
  const flagged = item.triage_state === "flagged";
  const Icon = flagged ? Flag : ShieldCheck;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[11px] font-semibold",
        flagged
          ? "border-rose-400/25 bg-rose-500/15 text-rose-300"
          : item.triage_state === "healthy"
            ? "border-emerald-400/25 bg-emerald-500/15 text-emerald-300"
            : "border-slate-500/30 bg-slate-500/15 text-slate-300",
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
    <ul aria-label="Loading Inbox messages" className="divide-y divide-[#173858]">
      {Array.from({ length: 7 }, (_, index) => (
        <li key={index} className="space-y-3 px-5 py-5">
          <div className="h-3 w-2/5 animate-pulse rounded bg-slate-700/60" />
          <div className="h-3 w-4/5 animate-pulse rounded bg-slate-800" />
          <div className="h-3 w-3/5 animate-pulse rounded bg-slate-800" />
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
  isLoading,
  error,
  onFilterChange,
  onSelect,
  onRetry,
}: InboxListProps) {
  return (
    <section
      aria-labelledby="inbox-heading"
      className="flex min-h-0 min-w-0 flex-1 flex-col border-r border-[#173858] bg-[#07182c] lg:max-w-[51%]"
    >
      <header className="shrink-0 border-b border-[#173858] px-5 pb-4 pt-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 id="inbox-heading" className="text-2xl font-semibold tracking-tight text-white">
                Inbox
              </h1>
              <span className="rounded border border-sky-400/30 bg-sky-400/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-sky-300">
                Preview data
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-400">
              <MorphingText>{counts.all}</MorphingText> emails ·{" "}
              <span className="text-rose-300">
                <MorphingText>{counts.flagged}</MorphingText> flagged
              </span>
            </p>
          </div>
          <Mail aria-hidden="true" className="mt-1 size-5 text-slate-500" />
        </div>

        <div className="mt-5 flex flex-wrap gap-2" aria-label="Inbox filters">
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
                  "inline-flex items-center gap-2 rounded-md border px-3 py-2 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300",
                  active
                    ? option.value === "flagged"
                      ? "border-rose-400/50 bg-rose-500/15 text-rose-200"
                      : option.value === "healthy"
                        ? "border-emerald-400/50 bg-emerald-500/15 text-emerald-200"
                        : "border-sky-400/60 bg-sky-500/20 text-white"
                    : "border-[#214365] bg-[#0b213e] text-slate-400 hover:border-slate-500 hover:text-white",
                )}
              >
                {option.value === "flagged" ? <Flag aria-hidden="true" className="size-3.5" /> : null}
                {option.value === "healthy" ? <ShieldCheck aria-hidden="true" className="size-3.5" /> : null}
                <span>{option.label}</span>
                <span className="tabular-nums opacity-75">{count}</span>
              </button>
            );
          })}
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {isLoading ? <ListSkeleton /> : null}

        {!isLoading && error ? (
          <div role="alert" className="m-5 rounded-lg border border-rose-400/30 bg-rose-500/10 p-4 text-sm text-rose-200">
            <p className="font-medium">Inbox unavailable</p>
            <p className="mt-1 text-rose-200/75">{error}</p>
            <button
              type="button"
              onClick={onRetry}
              className="mt-4 rounded-md border border-rose-300/40 px-3 py-2 text-xs font-medium text-rose-100 transition-colors hover:bg-rose-400/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-200"
            >
              Retry
            </button>
          </div>
        ) : null}

        {!isLoading && !error && items.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-slate-400">
            No messages match this filter.
          </p>
        ) : null}

        {!isLoading && !error && items.length > 0 ? (
          <ul aria-label="Inbox messages" className="divide-y divide-[#173858]">
            {items.map((item) => (
              <li key={item.mail_item_id}>
                <button
                  type="button"
                  aria-pressed={selectedId === item.mail_item_id}
                  onClick={() => onSelect(item.mail_item_id)}
                  className={cn(
                    "block w-full border-l-2 px-4 py-4 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-sky-300",
                    selectedId === item.mail_item_id
                      ? "border-l-sky-400 bg-[#0d3d70]"
                      : "border-l-transparent hover:bg-[#0b213e]",
                  )}
                >
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-2">
                    <div className="flex min-w-0 items-center gap-2">
                      {item.triage_state === "flagged" ? (
                        <Flag aria-hidden="true" className="size-4 shrink-0 text-rose-400" />
                      ) : (
                        <Mail aria-hidden="true" className="size-4 shrink-0 text-slate-300" />
                      )}
                      <span className="truncate text-xs font-medium text-slate-200" title={item.sender.address ?? "Sender unavailable"}>
                        {item.sender.address ?? "Sender unavailable"}
                      </span>
                    </div>
                    <time dateTime={item.observed_at ?? undefined} className="whitespace-nowrap text-[11px] text-slate-400">
                      {formatTime(item.observed_at)}
                    </time>
                    <div className="min-w-0 pl-6">
                      <p className="truncate text-sm font-medium text-white" title={item.subject ?? "Subject unavailable"}>
                        {item.subject ?? "Subject unavailable"}
                      </p>
                      <p className="mt-1 truncate text-xs text-slate-400" title={item.preview ?? "Preview unavailable"}>
                        {item.preview ?? "Preview unavailable"}
                      </p>
                    </div>
                    <TriageBadge item={item} />
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-1.5 pl-6">
                    <span className="rounded border border-sky-400/20 bg-sky-400/10 px-1.5 py-0.5 text-[10px] font-medium text-sky-300">
                      {item.protocol}
                    </span>
                    {checkLabels.map(({ key, label }) => (
                      <CheckChip key={key} check={item.view_checks[key]} label={label} />
                    ))}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
