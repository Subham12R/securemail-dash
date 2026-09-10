"use client";

import {
  ArrowLeft,
  ExternalLink,
  Flag,
  Mail,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import InboxDetailPanels from "@/components/ui/inbox-detail-panels";
import type {
  InboxDetailResponse,
  InboxDetailTab,
} from "@/lib/inbox-data";
import { historyDetailHref } from "@/lib/analysis-detail";

type DetailStatus = "idle" | "loading" | "success" | "error";

type InboxDetailProps = {
  detail: InboxDetailResponse | null;
  status: DetailStatus;
  error: string | null;
  onRetry: () => void;
  onBack: () => void;
  initialTab?: InboxDetailTab;
};

function DetailSkeleton() {
  return (
    <div aria-label="Loading selected message" className="space-y-5 p-6">
      <div className="h-4 w-24 animate-pulse rounded bg-zinc-200" />
      <div className="h-8 w-3/4 animate-pulse rounded bg-zinc-200" />
      <div className="h-4 w-1/2 animate-pulse rounded bg-zinc-200" />
      <div className="mt-8 h-10 animate-pulse rounded bg-zinc-200" />
      <div className="h-56 animate-pulse rounded-lg bg-zinc-200" />
    </div>
  );
}

export default function InboxDetail({
  detail,
  status,
  error,
  onRetry,
  onBack,
  initialTab = "content",
}: InboxDetailProps) {
  if (status === "loading" && !detail) return <DetailSkeleton />;

  if (status === "error") {
    return (
      <section className="flex min-h-full flex-col justify-start p-6" aria-label="Selected message error">
        <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-5 text-rose-800">
          <p className="font-medium">Message detail unavailable</p>
          <p className="mt-1 text-sm text-rose-700">{error ?? "The source did not return this message."}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onRetry}
              className="rounded-md border border-rose-300 px-3 py-2 text-xs font-medium text-rose-800 transition-colors hover:bg-rose-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-700"
            >
              Retry
            </button>
            <button
              type="button"
              onClick={onBack}
              className="rounded-md border border-zinc-300 px-3 py-2 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
            >
              Back to messages
            </button>
          </div>
        </div>
      </section>
    );
  }

  if (!detail) {
    return (
      <section className="flex min-h-full items-center justify-center p-6 text-center" aria-label="No message selected">
        <div>
          <Mail aria-hidden="true" className="mx-auto size-7 text-zinc-400" />
          <h2 className="mt-4 text-lg font-medium text-zinc-900">Select a message</h2>
          <p className="mt-1 max-w-xs text-sm text-zinc-600">Choose an Inbox row to inspect its safe message and network data.</p>
        </div>
      </section>
    );
  }

  const item = detail.item;
  const flagged = item.triage_state === "flagged";
  const analysisHref = detail.analysis_ref.request_id
    ? historyDetailHref(detail.analysis_ref.request_id)
    : null;

  const senderHeading = item.sender.address ?? item.sender.name ?? "Sender unavailable";
  const recipients = item.recipients.map((recipient) => recipient.address ?? "Not observed").join(", ") || "Not observed";

  return (
    <section
      aria-labelledby="selected-message-heading"
      aria-busy={status === "loading"}
      className="min-h-full bg-white"
    >
      <header className="border-b border-zinc-200 px-6 pb-5 pt-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-xl border-2 border-zinc-200 bg-white text-emerald-700 shadow-[inset_0_0_0_4px_rgba(16,185,129,0.08)]">
              <Mail aria-hidden="true" className="size-6" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-zinc-600">Email</p>
              <h2 id="selected-message-heading" className="mt-1 break-words text-xl font-semibold tracking-tighter text-zinc-900">
                {senderHeading}
              </h2>
              <p className="mt-1 truncate text-sm text-zinc-500" title={item.subject ?? undefined}>
                {item.subject ?? "Subject unavailable"}
              </p>
            </div>
          </div>
          {analysisHref ? (
            <Link
              href={analysisHref}
              className="inline-flex shrink-0 items-center gap-2 rounded-full border border-black/10 bg-zinc-100 px-3 py-2 text-sm font-normal text-zinc-800 transition-colors hover:border-black/25 hover:bg-zinc-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-lime-pulse)]"
            >
              Open analysis
              <ExternalLink aria-hidden="true" className="size-3.5" />
            </Link>
          ) : null}
        </div>

        <dl className="mt-6 grid gap-x-6 gap-y-4 text-sm sm:grid-cols-2">
          <div className="min-w-0">
            <dt className="text-[11px] text-zinc-500">From</dt>
            <dd className="mt-1 truncate text-zinc-800" title={item.sender.address ?? undefined}>{item.sender.address ?? "Not observed"}</dd>
          </div>
          <div className="min-w-0">
            <dt className="text-[11px] text-zinc-500">Subject</dt>
            <dd className="mt-1 truncate text-zinc-800" title={item.subject ?? undefined}>{item.subject ?? "Not observed"}</dd>
          </div>
          <div className="min-w-0">
            <dt className="text-[11px] text-zinc-500">To</dt>
            <dd className="mt-1 truncate text-zinc-800" title={recipients}>{recipients}</dd>
          </div>
          <div className="min-w-0">
            <dt className="text-[11px] text-zinc-500">ID</dt>
            <dd className="mt-1 truncate font-mono text-xs text-zinc-600" title={item.mail_item_id}>{item.mail_item_id}</dd>
          </div>
        </dl>

        <div className="mt-5 flex flex-wrap items-center gap-2 text-xs">
          {flagged ? <Flag aria-hidden="true" className="size-3.5 text-rose-600" /> : <ShieldCheck aria-hidden="true" className="size-3.5 text-emerald-600" />}
          <span className={flagged ? "text-rose-700" : "text-emerald-700"}>{flagged ? "Flagged" : "Healthy"}</span>
          <span aria-hidden="true" className="h-px w-2 bg-zinc-300" />
          <span className="text-zinc-500">{item.protocol}</span>
          <span aria-hidden="true" className="h-px w-2 bg-zinc-300" />
          <span className="text-zinc-500">{formatDate(item.observed_at)}</span>
        </div>

        <button
          type="button"
          onClick={onBack}
          className="mt-5 inline-flex items-center gap-2 text-xs font-medium text-zinc-600 transition-colors hover:text-zinc-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-lime-pulse)] lg:hidden"
        >
          <ArrowLeft aria-hidden="true" className="size-3.5" />
          Back to messages
        </button>
      </header>

      <InboxDetailPanels detail={detail} initialTab={initialTab} />
    </section>
  );
}

function formatDate(value: string | null) {
  if (!value) return "Not observed";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not observed";

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(date);
}
