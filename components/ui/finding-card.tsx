"use client";

import { useState } from "react";
import Link from "next/link";
import type { FindingItem, FindingStatus } from "@/lib/findings-data";

type Props = {
  finding: FindingItem;
  currentStatus: FindingStatus;
  onStatusChange: (findingId: string, newStatus: FindingStatus) => void;
};

export default function FindingCard({ finding, currentStatus, onStatusChange }: Props) {
  const [expanded, setExpanded] = useState(false);

  const getSeverityBadge = () => {
    switch (finding.severity) {
      case "CRITICAL":
      case "HIGH":
        return "border-rose-500/30 bg-rose-500/10 text-rose-600 dark-soc:text-rose-400";
      case "MEDIUM":
        return "border-amber-500/30 bg-amber-500/10 text-amber-600 dark-soc:text-amber-400";
      case "LOW":
        return "border-black/10 bg-zinc-100 text-zinc-700";
    }
  };

  const getStatusBadge = () => {
    switch (currentStatus) {
      case "OPEN":
        return "border-rose-500/40 text-rose-600 dark-soc:text-rose-400";
      case "ACKNOWLEDGED":
        return "border-amber-500/40 text-amber-600 dark-soc:text-amber-400";
      case "RESOLVED":
        return "border-emerald-500/40 text-emerald-600 dark-soc:text-emerald-400";
    }
  };

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs transition-colors dark-soc:border-[#1E2D56] dark-soc:bg-[#111C38]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3.5">
          {/* Severity tag */}
          <span
            className={`mt-0.5 inline-flex shrink-0 items-center justify-center rounded border px-2.5 py-1 text-xs font-bold tracking-wider uppercase ${getSeverityBadge()}`}
          >
            {finding.severity}
          </span>

          {/* Details */}
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-semibold text-zinc-900 dark-soc:text-white">
                {finding.title}
              </h3>
              <span className="rounded bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 dark-soc:bg-[#1E2D56] dark-soc:text-zinc-300">
                {finding.category}
              </span>
            </div>

            <p className="mt-1 text-xs sm:text-sm text-zinc-600 dark-soc:text-zinc-300">
              {finding.description}
            </p>

            {/* Meta and Status */}
            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-zinc-500 dark-soc:text-zinc-400">
              <button
                type="button"
                onClick={() => setExpanded(!expanded)}
                className="font-medium text-[var(--color-lime-pulse)] hover:underline"
              >
                {finding.affectedSessionsCount} affected sessions {expanded ? "▲" : "▼"}
              </button>

              <span>•</span>
              <span>Confidence: {finding.confidence}</span>

              <span>•</span>
              <span
                className={`rounded border px-2 py-0.5 text-[11px] font-bold tracking-wider uppercase ${getStatusBadge()}`}
              >
                {currentStatus}
              </span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex shrink-0 items-center gap-2 self-end sm:self-start">
          {currentStatus !== "ACKNOWLEDGED" && currentStatus !== "RESOLVED" && (
            <button
              type="button"
              onClick={() => onStatusChange(finding.id, "ACKNOWLEDGED")}
              className="rounded-full border border-black/10 bg-white px-3 py-1 text-sm font-normal text-zinc-700 hover:bg-zinc-100 dark-soc:border-[#1E2D56] dark-soc:bg-[#0D1735] dark-soc:text-zinc-300 dark-soc:hover:bg-[#1E2D56]"
            >
              Acknowledge
            </button>
          )}

          {currentStatus !== "RESOLVED" && (
            <button
              type="button"
              onClick={() => onStatusChange(finding.id, "RESOLVED")}
              className="rounded-full bg-zinc-900 px-3 py-1 text-sm font-normal text-white hover:bg-zinc-800"
            >
              Resolve
            </button>
          )}

          {currentStatus !== "OPEN" && (
            <button
              type="button"
              onClick={() => onStatusChange(finding.id, "OPEN")}
              className="rounded-full border border-black/10 bg-white px-3 py-1 text-sm font-normal text-zinc-700 hover:bg-zinc-100 dark-soc:border-[#1E2D56] dark-soc:bg-[#0D1735] dark-soc:text-zinc-300 dark-soc:hover:bg-[#1E2D56]"
            >
              Reopen
            </button>
          )}
        </div>
      </div>

      {/* Expanded Affected Sessions Panel */}
      {expanded && (
        <div className="mt-4 rounded-lg border border-zinc-100 bg-zinc-50 p-3 dark-soc:border-[#1E2D56]/60 dark-soc:bg-[#0D1735]">
          <h4 className="text-xs font-semibold text-zinc-700 dark-soc:text-zinc-300">
            Impacted Sessions:
          </h4>
          <div className="mt-2 flex flex-wrap gap-2">
            {finding.affectedSessionIds.map((sesId) => (
              <Link
                key={sesId}
                href={`/history/${sesId}`}
                className="font-mono text-xs text-[var(--color-lime-pulse)] hover:underline"
              >
                {sesId} &rarr;
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
