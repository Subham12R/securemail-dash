"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { getLocalTimeZone } from "@internationalized/date";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MorphingText } from "@/components/ui/morphing-text";
import TableToolbar, { type TableFilter } from "@/components/ui/table-toolbar";
import type { SelectedDateRange } from "@/components/ui/date-range-filter";
import {
  RichButton,
  type RichButtonColor,
} from "@/components/ui/rich-button";
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

function statusColor(status: string): RichButtonColor {
  switch (status.toLowerCase()) {
    case "malicious":
    case "critical":
      return "danger";
    case "suspicious":
    case "high":
      return "warning";
    case "benign":
      return "primary";
    default:
      return "default";
  }
}

function formatVerdict(verdict: string) {
  return verdict.charAt(0).toUpperCase() + verdict.slice(1);
}

function RiskScore({ score }: { score: number }) {
  const percentage = Math.max(0, Math.min(100, score * 100));

  return (
    <div className="flex min-w-36 items-center gap-3">
      <div
        className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-100"
        role="progressbar"
        aria-label={`Risk score ${percentage.toFixed(1)}%`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percentage}
      >
        <div
          className="h-full rounded-full bg-zinc-800"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="w-12 text-right text-xs font-medium tabular-nums text-zinc-700">
        <MorphingText>{`${percentage.toFixed(1)}%`}</MorphingText>
      </span>
    </div>
  );
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
  const [verdict, setVerdict] = useState("All verdicts");
  const [dateRange, setDateRange] = useState<SelectedDateRange | null>(null);
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const firstRecord = total === 0 ? 0 : (page - 1) * limit + 1;
  const lastRecord = Math.min(page * limit, total);
  const filters: TableFilter[] = [
    {
      name: "verdict",
      label: "Verdict",
      value: verdict,
      options: ["All verdicts", ...Array.from(new Set(records.map((record) => formatVerdict(record.final_verdict)))).sort()],
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
      const matchesVerdict = verdict === "All verdicts" || formatVerdict(record.final_verdict) === verdict;
      const recordTime = new Date(record.timestamp).getTime();
      const matchesDate = start === undefined || end === undefined || (
        Number.isFinite(recordTime) && recordTime >= start && recordTime < end + 86_400_000
      );
      return matchesQuery && matchesVerdict && matchesDate;
    });
  }, [dateRange, query, records, verdict]);

  return (
    <section aria-labelledby="history-heading" className="p-6">
      <Card>
        <CardHeader>
          <CardTitle id="history-heading">Analysis history</CardTitle>
          <CardDescription>
            Persisted analysis records from the SecureMail API
          </CardDescription>
        </CardHeader>
        <TableToolbar
          searchPlaceholder="Search history"
          filters={filters}
          onQueryChange={setQuery}
          onFilterChange={(name, value) => {
            if (name === "verdict") setVerdict(value);
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
            <table className="w-full min-w-[860px] border-collapse text-left text-sm">
              <caption className="sr-only">
                Paginated SecureMail analysis history
              </caption>
              <thead className="border-y border-zinc-200 bg-zinc-50 text-xs font-medium text-zinc-500">
                <tr>
                  <th scope="col" className="px-5 py-3">Date</th>
                  <th scope="col" className="px-5 py-3">Capture / session ID</th>
                  <th scope="col" className="px-5 py-3">Request ID</th>
                  <th scope="col" className="px-5 py-3">Risk score</th>
                  <th scope="col" className="px-5 py-3">Verdict</th>
                  <th scope="col" className="px-5 py-3">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredRecords.length > 0 ? (
                  filteredRecords.map((record) => {
                    const verdict = formatVerdict(record.final_verdict);

                    return (
                      <tr key={record.id} className="text-zinc-700">
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
                          <RichButton
                            asChild
                            size="sm"
                            color={statusColor(record.final_verdict)}
                            className="pointer-events-none"
                          >
                            <span><MorphingText>{verdict}</MorphingText></span>
                          </RichButton>
                        </td>
                        <td className="px-5 py-4">
                          <Link
                            href={`/inbox?requestId=${encodeURIComponent(record.request_id)}&tab=network`}
                            className="font-medium text-sky-700 underline decoration-sky-300 underline-offset-2 transition-colors hover:text-sky-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700"
                          >
                            IP
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="px-5 py-14 text-center text-sm text-zinc-500">
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
