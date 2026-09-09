"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { getLocalTimeZone } from "@internationalized/date";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Link2 } from "lucide-react";
import { MorphingText } from "@/components/ui/morphing-text";
import TableToolbar, { type TableFilter } from "@/components/ui/table-toolbar";
import type { SelectedDateRange } from "@/components/ui/date-range-filter";
import { riskScoreBarClass } from "@/lib/risk";
import { historyDetailHref } from "@/lib/analysis-detail";
import {
  RichButton,
  type RichButtonColor,
} from "@/components/ui/rich-button";

export type RecentAnalysis = {
  requestId: string | null;
  captureId: string;
  sessionId: string;
  date: string | null;
  protocols: readonly string[];
  riskScore: number;
  status: string;
};

function statusColor(status: string): RichButtonColor {
  switch (status.toLowerCase()) {
    case "malicious":
    case "critical":
      return "danger";
    case "suspicious":
    case "high":
      return "warning";
    case "benign":
    case "complete":
      return "primary";
    case "informational":
    case "unknown":
      return "info";
    default:
      return "default";
  }
}

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
  const percentage = Math.max(0, Math.min(100, score * 100));
  const formattedScore = `${percentage.toFixed(1)}%`;

  return (
    <div className="flex min-w-36 items-center gap-3">
      <div
        className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-100"
        role="progressbar"
        aria-label={`Risk score ${formattedScore}`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percentage}
      >
        <div
          className={`h-full rounded-full transition-[width] duration-300 motion-reduce:transition-none ${riskScoreBarClass(score)}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="w-12 text-right text-xs font-medium tabular-nums text-zinc-700">
        <MorphingText>{formattedScore}</MorphingText>
      </span>
    </div>
  );
}

export default function RecentAnalysisTable({
  analyses,
}: {
  analyses: readonly RecentAnalysis[];
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All statuses");
  const [dateRange, setDateRange] = useState<SelectedDateRange | null>(null);
  const filters: TableFilter[] = [{
    name: "status",
    label: "Status",
    value: status,
    options: ["All statuses", ...Array.from(new Set(analyses.map((analysis) => analysis.status))).sort()],
  }];
  const filteredAnalyses = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const timezone = getLocalTimeZone();
    const start = dateRange?.start?.toDate(timezone).getTime();
    const end = dateRange?.end?.toDate(timezone).getTime();

    return analyses.filter((analysis) => {
      const matchesQuery = !normalizedQuery || `${analysis.captureId} ${analysis.sessionId}`.toLowerCase().includes(normalizedQuery);
      const matchesStatus = status === "All statuses" || analysis.status === status;
      const recordTime = analysis.date ? new Date(analysis.date).getTime() : Number.NaN;
      const matchesDate = start === undefined || end === undefined || (
        Number.isFinite(recordTime) && recordTime >= start && recordTime < end + 86_400_000
      );
      return matchesQuery && matchesStatus && matchesDate;
    });
  }, [analyses, dateRange, query, status]);

  return (
    <section
      aria-labelledby="recent-analysis-heading"
      className="px-6 pb-6"
    >
      <Card>
        <CardHeader>
          <CardTitle id="recent-analysis-heading">Recent analysis</CardTitle>
          <CardDescription>
            Latest persisted records from the SecureMail API
          </CardDescription>
        </CardHeader>
        <TableToolbar
          searchPlaceholder="Search analysis"
          filters={filters}
          onQueryChange={setQuery}
          onFilterChange={(_, value) => setStatus(value)}
          onRangeChange={(nextRange) => setDateRange(nextRange)}
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
                  <th scope="col" className="px-5 py-3">Verdict</th>
                  <th scope="col" className="px-5 py-3"><span className="sr-only">Details</span><Link2 aria-hidden="true" className="size-4 text-zinc-500" /></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredAnalyses.length > 0 ? (
                  filteredAnalyses.map((analysis, index) => {
                    const detailHref = analysis.requestId
                      ? historyDetailHref(analysis.requestId)
                      : null;

                    return (
                    <tr
                      key={analysis.sessionId}
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
                        <RichButton
                          asChild
                          size="sm"
                          color={statusColor(analysis.status)}
                          className="pointer-events-none"
                        >
                          <span><MorphingText>{analysis.status}</MorphingText></span>
                        </RichButton>
                      </td>
                      <td className="px-5 py-4">
                        {detailHref ? (
                          <Link
                            href={detailHref}
                            aria-label={`View analysis details for ${analysis.captureId}`}
                            title="View analysis details"
                            className="inline-flex rounded-sm text-sky-700 transition-colors hover:text-sky-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700"
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
                    <td colSpan={6} className="px-5 py-10 text-center text-sm text-zinc-500">
                      No analysis records match the current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
