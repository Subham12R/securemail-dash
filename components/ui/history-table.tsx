"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { getLocalTimeZone } from "@internationalized/date";
import { ChevronLeft, ChevronRight, Link2 } from "lucide-react";
import { MorphingText } from "@/components/ui/morphing-text";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import TableToolbar, { type TableFilter } from "@/components/ui/table-toolbar";
import type { SelectedDateRange } from "@/components/ui/date-range-filter";
import AnalysisStatusText from "@/components/ui/analysis-status-text";
import { formatAnalysisSource, historyDetailHref } from "@/lib/analysis-detail";
import { analysisStatusLabel } from "@/lib/risk";
import { RiskScoreMeter } from "@/components/ui/risk-score-meter";
import type { AnalysisRecord } from "@/lib/securemail-api";

function formatTimestamp(timestamp: string) {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "Not supplied";

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(date);
}

function RiskScore({ score }: { score: number }) {
  return <RiskScoreMeter score={score} bars={18} size="sm" showText={false} />;
}

function PaginationLink({
  page,
  disabled,
  children,
  label,
}: {
  page: number;
  disabled: boolean;
  children: React.ReactNode;
  label: string;
}) {
  const className =
    "inline-flex h-9 items-center gap-1 rounded-md border px-2 text-sm font-medium transition-colors " +
    (disabled
      ? "cursor-not-allowed border-zinc-200 text-zinc-300"
      : "border-zinc-300 text-zinc-700 hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900");

  if (disabled) {
    return (
      <span aria-disabled="true" className={className}>
        {children}
      </span>
    );
  }

  return (
    <Link href={`/history?page=${page}`} aria-label={label} className={className}>
      {children}
    </Link>
  );
}

export default function HistoryTable({
  records,
  total,
  page,
  limit,
}: {
  records: readonly AnalysisRecord[];
  total: number;
  page: number;
  limit: number;
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All statuses");
  const [source, setSource] = useState("All sources");
  const [dateRange, setDateRange] = useState<SelectedDateRange | null>(null);
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const firstRecord = total === 0 ? 0 : (page - 1) * limit + 1;
  const lastRecord = Math.min(page * limit, total);
  const filters: TableFilter[] = [
    {
      name: "status",
      label: "Status",
      value: status,
      options: ["All statuses", ...Array.from(new Set(records.map((record) => analysisStatusLabel(record.final_verdict)))).sort()],
    },
    {
      name: "source",
      label: "Source",
      value: source,
      options: [
        "All sources",
        "Analysed PCAP capture",
        "Email client",
        "Synthetic",
        "Not supplied",
      ],
    },
  ];
  const filteredRecords = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const timezone = getLocalTimeZone();
    const start = dateRange?.start?.toDate(timezone).getTime();
    const end = dateRange?.end?.toDate(timezone).getTime();

    return records.filter((record) => {
      const identifier = `${record.client_id ?? record.session_id} ${record.request_id}`.toLowerCase();
      const matchesQuery = !normalizedQuery || identifier.includes(normalizedQuery);
      const matchesStatus = status === "All statuses" || analysisStatusLabel(record.final_verdict) === status;
      const matchesSource = source === "All sources" || formatAnalysisSource(record) === source;
      const recordTime = new Date(record.timestamp).getTime();
      const matchesDate = start === undefined || end === undefined || (
        Number.isFinite(recordTime) && recordTime >= start && recordTime < end + 86_400_000
      );
      return matchesQuery && matchesStatus && matchesSource && matchesDate;
    });
  }, [dateRange, query, records, source, status]);

  return (
    <section aria-labelledby="history-heading" className="p-6">
      <Card>
        <CardHeader>
          <h2 id="history-heading" className="font-medium tracking-tighter text-zinc-900">Analysis history</h2>
          <CardDescription>
            Status combines the backend final verdict into a single readable severity label; the numeric score remains available for context.
          </CardDescription>
        </CardHeader>
        <TableToolbar
          searchPlaceholder="Search history"
          filters={filters}
          onQueryChange={setQuery}
          onFilterChange={(name, value) => {
            if (name === "status") setStatus(value);
            if (name === "source") setSource(value);
          }}
          onRangeChange={(nextRange) => setDateRange(nextRange)}
          showExport
        />
        <CardContent className="p-0">
          <div
            className="overflow-x-auto"
            role="region"
            tabIndex={0}
            aria-label="Analysis history table"
          >
            <table className="w-full min-w-[980px] border-collapse text-left text-sm">
              <caption className="sr-only">
                Paginated SecureMail analysis history
              </caption>
              <thead className="border-y border-zinc-200 bg-zinc-50 text-xs font-medium text-zinc-500">
                <tr>
                  <th scope="col" className="px-5 py-3">Date</th>
                  <th scope="col" className="px-5 py-3">Capture / session ID</th>
                  <th scope="col" className="px-5 py-3">Request ID</th>
                  <th scope="col" className="px-5 py-3">Risk score</th>
                  <th scope="col" className="px-5 py-3">Status</th>
                  <th scope="col" className="px-5 py-3">Source</th>
                  <th scope="col" className="px-5 py-3">
                    <span className="sr-only">Analysis details</span>
                    <Link2 aria-hidden="true" className="size-4 text-zinc-500" />
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredRecords.length > 0 ? (
                  filteredRecords.map((record, index) => {
                    const detailHref = historyDetailHref(record.request_id);

                    return (
                      <tr
                        key={record.id}
                        style={{ animationDelay: `${Math.min(index, 8) * 18}ms` }}
                        className="animate-row-reveal text-zinc-700 transition-colors duration-150 hover:bg-zinc-50/80"
                      >
                        <td className="whitespace-nowrap px-5 py-4 text-xs text-zinc-500">
                          {formatTimestamp(record.timestamp)}
                        </td>
                        <th
                          scope="row"
                          className="max-w-56 px-5 py-4 font-mono text-xs font-medium text-zinc-900"
                        >
                          <span
                            className="block truncate"
                            title={record.client_id ?? record.session_id}
                          >
                            {record.client_id ?? record.session_id}
                          </span>
                        </th>
                        <td className="max-w-56 px-5 py-4 font-mono text-xs text-zinc-500">
                          <span className="block truncate" title={record.request_id}>
                            {record.request_id}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <RiskScore score={record.risk_score} />
                        </td>
                        <td className="px-5 py-4">
                          <AnalysisStatusText verdict={record.final_verdict} />
                        </td>
                        <td className="px-5 py-4 text-xs text-zinc-600">
                          {formatAnalysisSource(record)}
                        </td>
                        <td className="px-5 py-4">
                          {detailHref ? (
                            <Link
                              href={detailHref}
                              aria-label={`View analysis details for ${record.client_id ?? record.session_id}`}
                              title="View analysis details"
                              className="inline-flex rounded-sm text-sky-700 transition-all hover:text-sky-900 hover:scale-110 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700"
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
                    <td colSpan={7} className="px-5 py-14 text-center text-sm text-zinc-500">
                      No analysis records match the current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
        <CardFooter className="flex flex-wrap items-center justify-between gap-4 border-t border-zinc-100 pt-4">
          <p className="text-xs text-zinc-500">
            Showing {firstRecord}–{lastRecord} of {total} records
          </p>
          <nav aria-label="Analysis history pagination" className="flex items-center gap-2">
            <PaginationLink
              page={Math.max(1, page - 1)}
              disabled={page <= 1}
              label="Previous history page"
            >
              <ChevronLeft aria-hidden="true" className="size-4" />
            </PaginationLink>
            <span className="px-2 text-sm tabular-nums text-zinc-600">
              Page <MorphingText>{page}</MorphingText> of <MorphingText>{totalPages}</MorphingText>
            </span>
            <PaginationLink
              page={Math.min(totalPages, page + 1)}
              disabled={page >= totalPages}
              label="Next history page"
            >
              <ChevronRight aria-hidden="true" className="size-4" />
            </PaginationLink>
          </nav>
        </CardFooter>
      </Card>
    </section>
  );
}
