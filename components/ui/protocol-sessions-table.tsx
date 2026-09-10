"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, Search } from "lucide-react";
import type { AnalysisRecord } from "@/lib/securemail-api";
import { historyDetailHref } from "@/lib/analysis-detail";
import { RiskScoreMeter } from "@/components/ui/risk-score-meter";
import AnalysisStatusText from "@/components/ui/analysis-status-text";

interface ProtocolSessionsTableProps {
  records: readonly AnalysisRecord[];
  activeProtocol: string | null;
  onSelectProtocol: (proto: string | null) => void;
}

function formatTimestamp(timestamp: string) {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "Not supplied";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(date);
}

export default function ProtocolSessionsTable({
  records,
  activeProtocol,
  onSelectProtocol,
}: ProtocolSessionsTableProps) {
  const [query, setQuery] = useState("");

  const filteredRecords = useMemo(() => {
    const q = query.trim().toLowerCase();
    return records.filter((r) => {
      const protoMatch = !activeProtocol || (r.protocol ?? "").toUpperCase() === activeProtocol.toUpperCase();
      const identifier = `${r.session_id} ${r.client_id ?? ""} ${r.request_id} ${r.protocol ?? ""}`.toLowerCase();
      const queryMatch = !q || identifier.includes(q);
      return protoMatch && queryMatch;
    });
  }, [activeProtocol, query, records]);

  return (
    <div className="rounded-xl border border-zinc-200 bg-white shadow-[inset_0px_0px_2px_2px_rgba(0,0,0,0.02)]">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-100 p-5">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-zinc-900">
            {activeProtocol ? `${activeProtocol} Sessions` : "All Protocol Sessions"}
          </h2>
          <p className="text-xs text-zinc-500">
            Showing {filteredRecords.length} observed sessions across analyzed mail traffic.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Protocol Filter Tabs */}
          <div className="inline-flex rounded-lg border border-zinc-200 bg-zinc-50 p-0.5 text-xs font-medium">
            <button
              type="button"
              onClick={() => onSelectProtocol(null)}
              className={`rounded-md px-3 py-1.5 transition-colors ${
                !activeProtocol ? "bg-white text-zinc-900 shadow-xs font-semibold" : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              All ({records.length})
            </button>
            {["SMTP", "IMAP", "POP3"].map((proto) => {
              const count = records.filter((r) => (r.protocol ?? "").toUpperCase() === proto).length;
              return (
                <button
                  key={proto}
                  type="button"
                  onClick={() => onSelectProtocol(proto)}
                  className={`rounded-md px-3 py-1.5 transition-colors ${
                    activeProtocol === proto
                      ? "bg-white text-zinc-900 shadow-xs font-semibold"
                      : "text-zinc-600 hover:text-zinc-900"
                  }`}
                >
                  {proto} ({count})
                </button>
              );
            })}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-2.5 size-4 text-zinc-400" />
            <input
              type="search"
              placeholder="Search session or request ID..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-9 w-64 rounded-md border border-zinc-200 bg-white pl-8 pr-3 text-xs text-zinc-800 placeholder:text-zinc-400 focus:border-[var(--color-lime-pulse)] focus:outline-none focus:ring-1 focus:ring-[var(--color-lime-pulse)]"
            />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[780px] border-collapse text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-xs font-medium text-zinc-500">
            <tr>
              <th scope="col" className="px-5 py-3">Session ID</th>
              <th scope="col" className="px-5 py-3">Protocol</th>
              <th scope="col" className="px-5 py-3">Observed Date</th>
              <th scope="col" className="px-5 py-3">Posture</th>
              <th scope="col" className="px-5 py-3">Risk Score</th>
              <th scope="col" className="px-5 py-3">Status</th>
              <th scope="col" className="px-5 py-3 text-right">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {filteredRecords.length > 0 ? (
              filteredRecords.map((record) => {
                const detailHref = historyDetailHref(record.request_id);

                return (
                  <tr
                    key={record.id}
                    className="text-zinc-700 transition-colors hover:bg-zinc-50/80"
                  >
                    <td className="px-5 py-3.5 font-mono text-xs font-medium text-zinc-900">
                      <span className="block truncate max-w-48" title={record.session_id}>
                        {record.session_id}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center rounded-md bg-zinc-100 px-2 py-0.5 text-[11px] font-semibold text-zinc-800">
                        {record.protocol ?? "Unknown"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-xs text-zinc-500">
                      {formatTimestamp(record.timestamp)}
                    </td>
                    <td className="px-5 py-3.5 text-xs font-medium capitalize text-zinc-700">
                      {record.posture ?? "Standard"}
                    </td>
                    <td className="px-5 py-3.5">
                      <RiskScoreMeter score={record.risk_score} bars={18} size="sm" showText={false} />
                    </td>
                    <td className="px-5 py-3.5">
                      <AnalysisStatusText verdict={record.final_verdict} />
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-right">
                      {detailHref ? (
                        <Link
                          href={detailHref}
                          className="inline-flex items-center gap-1 text-xs font-medium text-zinc-700 transition-colors hover:text-zinc-900 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-lime-pulse)]"
                        >
                          <span>Details</span>
                          <ChevronRight aria-hidden="true" className="size-3.5" />
                        </Link>
                      ) : (
                        <span className="text-xs text-zinc-400">Not available</span>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center text-sm text-zinc-500">
                  No sessions match the selected protocol and search query.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
