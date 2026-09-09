"use client";

import { Mail, Send, Inbox, ArrowRight } from "lucide-react";
import type { ProtocolSummary } from "@/lib/protocols-data";

interface ProtocolCardsGridProps {
  summaries: ProtocolSummary[];
  selectedProtocol: string | null;
  onSelectProtocol: (protocol: string | null) => void;
}

export default function ProtocolCardsGrid({
  summaries,
  selectedProtocol,
  onSelectProtocol,
}: ProtocolCardsGridProps) {
  const getIcon = (proto: string) => {
    switch (proto) {
      case "SMTP":
        return <Send className="size-5 text-sky-500" aria-hidden="true" />;
      case "IMAP":
        return <Inbox className="size-5 text-emerald-500" aria-hidden="true" />;
      default:
        return <Mail className="size-5 text-amber-500" aria-hidden="true" />;
    }
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {summaries.map((summary) => {
        const isSelected = selectedProtocol === summary.protocol;

        return (
          <article
            key={summary.protocol}
            className={`flex flex-col justify-between rounded-xl border p-5 transition-all duration-200 shadow-[inset_0px_0px_2px_2px_rgba(0,0,0,0.03)] ${
              isSelected
                ? "border-sky-500 bg-sky-50/40 ring-1 ring-sky-500"
                : "border-zinc-200 bg-white hover:border-zinc-300"
            }`}
          >
            <div>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-9 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50">
                    {getIcon(summary.protocol)}
                  </div>
                  <div>
                    <h3 className="text-base font-semibold tracking-tight text-zinc-900">
                      {summary.protocol}
                    </h3>
                    <p className="text-[11px] text-zinc-500">{summary.name}</p>
                  </div>
                </div>
                <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-semibold tabular-nums text-zinc-700">
                  {summary.percentage}%
                </span>
              </div>

              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-bold tracking-tight text-zinc-900">
                  {summary.sessionCount}
                </span>
                <span className="text-xs text-zinc-500">sessions total</span>
              </div>

              <p className="mt-3 text-xs leading-relaxed text-zinc-600">
                {summary.description}
              </p>

              <div className="mt-4 grid grid-cols-2 gap-2 border-t border-zinc-100 pt-3 text-xs">
                <div>
                  <span className="text-[11px] font-medium text-zinc-400">Standard Ports</span>
                  <p className="font-mono font-medium text-zinc-800">
                    {summary.standardPorts.join(", ") || "None"}
                  </p>
                </div>
                <div>
                  <span className="text-[11px] font-medium text-zinc-400">TLS Ports</span>
                  <p className="font-mono font-medium text-zinc-800">
                    {summary.tlsPorts.join(", ") || "None"}
                  </p>
                </div>
                <div>
                  <span className="text-[11px] font-medium text-zinc-400">With TLS</span>
                  <p className="font-medium text-zinc-800">
                    {summary.withTlsCount} / {summary.sessionCount}
                  </p>
                </div>
                <div>
                  <span className="text-[11px] font-medium text-zinc-400">STARTTLS</span>
                  <p className="font-medium text-zinc-800">
                    {summary.starttlsCount} observed
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onSelectProtocol(isSelected ? null : summary.protocol)}
              className={`mt-5 flex w-full items-center justify-center gap-1.5 rounded-lg border py-2 text-xs font-medium transition-colors ${
                isSelected
                  ? "border-sky-600 bg-sky-600 text-white hover:bg-sky-700"
                  : "border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900"
              }`}
            >
              <span>{isSelected ? "Showing Sessions" : "View Sessions"}</span>
              <ArrowRight className="size-3.5" aria-hidden="true" />
            </button>
          </article>
        );
      })}
    </div>
  );
}
