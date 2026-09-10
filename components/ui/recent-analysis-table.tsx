"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getLocalTimeZone } from "@internationalized/date";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Link2 } from "lucide-react";
import TableToolbar, { type TableFilter } from "@/components/ui/table-toolbar";
import type { SelectedDateRange } from "@/components/ui/date-range-filter";
import AnalysisStatusText from "@/components/ui/analysis-status-text";
import { analysisStatusLabel } from "@/lib/risk";
import { RiskScoreMeter } from "@/components/ui/risk-score-meter";
import { historyDetailHref } from "@/lib/analysis-detail";
import { RichButton } from "@/components/ui/rich-button";

export type RecentAnalysis = {
  requestId: string | null;
  captureId: string;
  sessionId: string;
  date: string | null;
  protocols: readonly string[];
  riskScore: number;
  status: string;
};

function formatTimestamp(timestamp: string) {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(date);
}

function RiskScore({ score }: { score: number }) {
  return <RiskScoreMeter score={score} bars={18} size="sm" showText={false} />;
}

const PAGE_SIZE = 5;

export default function RecentAnalysisTable({
  analyses,
}: {
  analyses: readonly RecentAnalysis[];
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All statuses");
  const [dateRange, setDateRange] = useState<SelectedDateRange | null>(null);
  const [page, setPage] = useState(1);
  const filters: TableFilter[] = [{
    name: "status",
    label: "Status",
    value: status,
    options: ["All statuses", ...Array.from(new Set(analyses.map((analysis) => analysisStatusLabel(analysis.status)))).sort()],
  }];
  const filteredAnalyses = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const timezone = getLocalTimeZone();
    const start = dateRange?.start?.toDate(timezone).getTime();
    const end = dateRange?.end?.toDate(timezone).getTime();

    return analyses.filter((analysis) => {
      const matchesQuery = !normalizedQuery || `${analysis.captureId} ${analysis.sessionId}`.toLowerCase().includes(normalizedQuery);
      const matchesStatus = status === "All statuses" || analysisStatusLabel(analysis.status) === status;
      const recordTime = analysis.date ? new Date(analysis.date).getTime() : Number.NaN;
      const matchesDate = start === undefined || end === undefined || (
        Number.isFinite(recordTime) && recordTime >= start && recordTime < end + 86_400_000
      );
      return matchesQuery && matchesStatus && matchesDate;
    });
  }, [analyses, dateRange, query, status]);

  const pageCount = Math.max(1, Math.ceil(filteredAnalyses.length / PAGE_SIZE));
  const visiblePage = Math.min(page, pageCount);
  const paginatedAnalyses = filteredAnalyses.slice(
    (visiblePage - 1) * PAGE_SIZE,
    visiblePage * PAGE_SIZE,
  );

  return (
    <section
      aria-labelledby="recent-analysis-heading"
      className="px-6 pb-6"
    >
      <Card>
        <CardHeader>
          <CardTitle id="recent-analysis-heading">Recent analysis</CardTitle>
          <CardDescription>
            Status combines the backend final verdict into a single readable severity label; the numeric score remains available for context.
          </CardDescription>
        </CardHeader>
        <TableToolbar
          searchPlaceholder="Search analysis"
          filters={filters}
          onQueryChange={(value) => {
            setQuery(value);
            setPage(1);
          }}
          onFilterChange={(_, value) => {
            setStatus(value);
            setPage(1);
          }}
          onRangeChange={(nextRange) => {
            setDateRange(nextRange);
            setPage(1);
          }}
        />
        <CardContent className="p-0">
          <div
            className="overflow-x-auto"
            role="region"
            tabIndex={0}
            aria-label="Recent analysis table"
          >
            <table className="w-full min-w-[720px] border-collapse text-left text-sm">
              <caption className="sr-only">
                Recent session analysis results
              </caption>
              <thead className="border-y border-zinc-200 bg-zinc-50 text-xs font-medium text-zinc-500">
                <tr>
                  <th scope="col" className="px-5 py-3">Capture / session ID</th>
                  <th scope="col" className="px-5 py-3">Date</th>
                  <th scope="col" className="px-5 py-3">Protocols</th>
                  <th scope="col" className="px-5 py-3">Risk score</th>
                  <th scope="col" className="px-5 py-3">Status</th>
                  <th scope="col" className="px-5 py-3"><span className="sr-only">Details</span><Link2 aria-hidden="true" className="size-4 text-zinc-500" /></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {paginatedAnalyses.length > 0 ? (
                  paginatedAnalyses.map((analysis, index) => {
                    const detailHref = analysis.requestId
                      ? historyDetailHref(analysis.requestId)
                      : null;

                    return (
                    <tr
                      key={analysis.requestId ?? `${analysis.sessionId}-${index}`}
                      style={{ animationDelay: `${Math.min(index, 8) * 18}ms` }}
                      className="animate-row-reveal text-zinc-700 transition-colors duration-150 hover:bg-zinc-50/80"
                    >
                      <th
                        scope="row"
                        className="max-w-64 whitespace-nowrap px-5 py-4 font-mono text-xs font-medium text-zinc-900"
                      >
                        <span className="block truncate" title={`${analysis.captureId} / ${analysis.sessionId}`}>
                          {analysis.captureId} / {analysis.sessionId}
                        </span>
                      </th>
                      <td className="whitespace-nowrap px-5 py-4 text-xs text-zinc-500">
                        {analysis.date ? formatTimestamp(analysis.date) ?? "Not supplied" : "Not supplied"}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-1.5">
                          {analysis.protocols.length > 0 ? (
                            analysis.protocols.map((protocol) => (
                              <RichButton
                                key={protocol}
                                asChild
                                size="sm"
                                className="pointer-events-none h-7 px-2 text-[11px]"
                              >
                                <span>{protocol}</span>
                              </RichButton>
                            ))
                          ) : (
                            <span className="text-xs text-zinc-500">Not supplied</span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <RiskScore score={analysis.riskScore} />
                      </td>
                      <td className="px-5 py-4">
                        <AnalysisStatusText verdict={analysis.status} />
                      </td>
                      <td className="px-5 py-4">
                        {detailHref ? (
                          <Link
                            href={detailHref}
                            aria-label={`View analysis details for ${analysis.captureId}`}
                            title="View analysis details"
                            className="inline-flex rounded-sm text-zinc-700 transition-colors hover:text-zinc-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-lime-pulse)]"
                          >
                            <Link2 aria-hidden="true" className="size-4" />
                            <span className="sr-only">View analysis details</span>
                          </Link>
                        ) : (
                          <span role="status" className="text-xs text-zinc-400">Not available</span>
                        )}
                      </td>
                    </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="px-5 py-10 text-center text-sm text-zinc-500">
                      No analysis records match the current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
        {filteredAnalyses.length > 0 ? (
          <div className="flex items-center justify-between gap-3 border-t border-black/10 px-[18px] py-3 text-xs text-zinc-500">
            <span aria-live="polite">
              Showing {(visiblePage - 1) * PAGE_SIZE + 1}–{Math.min(visiblePage * PAGE_SIZE, filteredAnalyses.length)} of {filteredAnalyses.length}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={visiblePage === 1}
                aria-label="Previous page"
                className="inline-flex size-8 items-center justify-center rounded-md border border-black/10 text-zinc-700 transition-colors hover:bg-zinc-100 disabled:pointer-events-none disabled:opacity-40"
              >
                <ChevronLeft aria-hidden="true" className="size-4" />
              </button>
              <span className="min-w-16 text-center tabular-nums">Page {visiblePage} of {pageCount}</span>
              <button
                type="button"
                onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
                disabled={visiblePage === pageCount}
                aria-label="Next page"
                className="inline-flex size-8 items-center justify-center rounded-md border border-black/10 text-zinc-700 transition-colors hover:bg-zinc-100 disabled:pointer-events-none disabled:opacity-40"
              >
                <ChevronRight aria-hidden="true" className="size-4" />
              </button>
            </div>
          </div>
        ) : null}
      </Card>
    </section>
  );
}
