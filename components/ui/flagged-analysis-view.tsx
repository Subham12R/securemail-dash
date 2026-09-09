import { AlertTriangle, ArrowUpRight, Flag, Network, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { MorphingText } from "@/components/ui/morphing-text";
import type { InboxListItem, InboxListResponse, ViewCheck } from "@/lib/inbox-data";

type FlaggedAnalysisViewProps = {
  items: readonly InboxListItem[];
  counts: InboxListResponse["counts"];
  error?: string | null;
};

function formatTime(value: string | null) {
  if (!value) return "Not observed";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not observed";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(date);
}

function CheckChip({ check, label }: { check: ViewCheck; label: string }) {
  const flagged = check.state === "flagged";
  const unavailable = check.state === "unavailable" || check.state === "not_observed";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-medium ${
        flagged
          ? "border-rose-400/20 bg-rose-400/10 text-rose-300"
          : unavailable
            ? "border-slate-500/30 bg-slate-500/10 text-slate-400"
            : "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
      }`}
      title={`${label}: ${check.label ?? check.state}`}
    >
      {flagged ? <AlertTriangle aria-hidden="true" className="size-3" /> : null}
      {label}
    </span>
  );
}

function RiskScore({ score }: { score: number | null }) {
  if (score === null) return <span className="text-xs text-slate-500">No data</span>;
  const percentage = Math.max(0, Math.min(1, score)) * 100;
  return (
    <div className="flex min-w-36 items-center gap-3">
      <div
        className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-800"
        role="progressbar"
        aria-label={`Risk score ${percentage.toFixed(1)}%`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percentage}
      >
        <div className="h-full rounded-full bg-rose-400" style={{ width: `${percentage}%` }} />
      </div>
      <span className="w-12 text-right text-xs tabular-nums text-slate-200">
        <MorphingText>{`${percentage.toFixed(1)}%`}</MorphingText>
      </span>
    </div>
  );
}

export default function FlaggedAnalysisView({
  items,
  counts,
  error = null,
}: FlaggedAnalysisViewProps) {
  return (
    <section aria-labelledby="flagged-analysis-heading" className="min-h-0 flex-1 overflow-y-auto bg-[#061426] text-slate-100">
      <div className="border-b border-[#173858] px-6 py-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Flag aria-hidden="true" className="size-5 text-rose-400" />
              <h1 id="flagged-analysis-heading" className="text-2xl font-semibold tracking-tight text-white">Flagged Emails</h1>
              <span className="rounded border border-sky-400/30 bg-sky-400/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-sky-300">
                Preview data
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-400">
              <MorphingText>{counts.flagged}</MorphingText> items require analyst review · {counts.healthy} healthy items excluded
            </p>
          </div>
          <Link
            href="/inbox"
            className="inline-flex items-center gap-2 rounded-md border border-[#214365] px-3 py-2 text-xs font-medium text-slate-300 transition-colors hover:border-sky-400/50 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300"
          >
            Open Inbox
            <ArrowUpRight aria-hidden="true" className="size-3.5" />
          </Link>
        </div>
      </div>

      <div className="p-6">
        {error ? (
          <div role="alert" className="rounded-lg border border-rose-400/30 bg-rose-500/10 p-5 text-sm text-rose-200">
            Flagged analysis is unavailable. {error}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-lg border border-dashed border-[#214365] px-5 py-12 text-center text-sm text-slate-400">
            No backend-flagged emails are available.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-[#214365]" role="region" tabIndex={0} aria-label="Flagged email analysis table">
            <table className="w-full min-w-[980px] border-collapse text-left text-sm">
              <caption className="sr-only">Backend-flagged email analysis</caption>
              <thead className="border-b border-[#214365] bg-[#0b213e] text-[11px] uppercase tracking-[0.12em] text-slate-500">
                <tr>
                  <th scope="col" className="px-4 py-3">Email</th>
                  <th scope="col" className="px-4 py-3">Checks</th>
                  <th scope="col" className="px-4 py-3">Risk</th>
                  <th scope="col" className="px-4 py-3">Observed</th>
                  <th scope="col" className="px-4 py-3"><span className="sr-only">Links</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#173858]">
                {items.map((item) => (
                  <tr key={item.mail_item_id} className="text-slate-300 transition-colors hover:bg-[#0b213e]">
                    <th scope="row" className="max-w-[22rem] px-4 py-4 align-top font-normal">
                      <div className="flex items-start gap-3">
                        <ShieldAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-rose-400" />
                        <div className="min-w-0">
                          <p className="truncate font-medium text-white" title={item.subject ?? undefined}>{item.subject ?? "Subject unavailable"}</p>
                          <p className="mt-1 truncate text-xs text-slate-400" title={item.sender.address ?? undefined}>{item.sender.address ?? "Sender unavailable"}</p>
                          <p className="mt-1 font-mono text-[10px] text-slate-500" title={item.mail_item_id}>{item.mail_item_id}</p>
                        </div>
                      </div>
                    </th>
                    <td className="px-4 py-4 align-top">
                      <div className="flex max-w-[20rem] flex-wrap gap-1.5">
                        <CheckChip check={item.view_checks.headers} label="Headers" />
                        <CheckChip check={item.view_checks.content} label="Content" />
                        <CheckChip check={item.view_checks.tcp} label="TCP" />
                        <CheckChip check={item.view_checks.tls} label="TLS" />
                      </div>
                      <p className="mt-2 inline-flex items-center gap-1 text-xs text-slate-500"><Network aria-hidden="true" className="size-3" />{item.protocol}</p>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <p className="mb-2 text-xs font-medium text-rose-300">{item.analysis.risk_class ?? "Unavailable"}</p>
                      <RiskScore score={item.analysis.risk_score} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 align-top text-xs text-slate-400">{formatTime(item.observed_at)}</td>
                    <td className="px-4 py-4 align-top">
                      <div className="flex flex-col items-end gap-2">
                        <Link
                          href={`/inbox?itemId=${encodeURIComponent(item.mail_item_id)}`}
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-sky-300 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300"
                        >
                          Inspect
                          <ArrowUpRight aria-hidden="true" className="size-3.5" />
                        </Link>
                        {item.analysis.request_id ? (
                          <Link
                            href={`/analytics?requestId=${encodeURIComponent(item.analysis.request_id)}`}
                            className="text-[11px] text-slate-500 hover:text-slate-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300"
                          >
                            Analysis record
                          </Link>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
