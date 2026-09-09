"use client";

import { useMemo, useState } from "react";
import { Gauge, LoaderCircle, ShieldAlert } from "lucide-react";
import { AttachmentUpload } from "@/components/motion/attachment-upload";
import { useCaptureQueue } from "@/components/providers/capture-queue-provider";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MorphingText } from "@/components/ui/morphing-text";
import { getQueueProgress, type CaptureQueueItem } from "@/lib/capture-queue";
import TableToolbar, { type TableFilter } from "@/components/ui/table-toolbar";
import { RichButton, type RichButtonColor } from "@/components/ui/rich-button";
import TaskRows, { type TaskRow } from "@/components/ui/task-rows";
import type { AnalysisRecord } from "@/lib/securemail-api";

type AnalysisWorkspaceProps = {
  analysis: AnalysisRecord | null;
  apiError: string | null;
};

const statusColors: Record<string, RichButtonColor> = {
  Complete: "primary",
  Ready: "default",
  Queued: "warning",
  Uploading: "warning",
  Processing: "warning",
  Analyzing: "warning",
  Empty: "default",
  Failed: "danger",
  Benign: "primary",
  Suspicious: "warning",
  Malicious: "danger",
  Informational: "default",
};

function formatFileSize(bytes: number | undefined) {
  if (!bytes) return "Size unavailable";
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatPercentage(score: number | null) {
  if (score === null) return "No data";
  const normalized = score <= 1 ? score * 100 : score;
  return `${Math.max(0, Math.min(100, normalized)).toFixed(1)}%`;
}

function formatVerdict(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function getObject(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : null;
}

function readModelProbability(
  scores: Record<string, unknown>,
  modelName: string,
) {
  const model = getObject(scores[modelName]);
  if (!model) return typeof scores[modelName] === "number" ? scores[modelName] : null;

  for (const key of ["risk_probability", "probability", "score"]) {
    if (typeof model[key] === "number") return model[key];
  }

  return null;
}

function modelBundleVersion(bundle: Record<string, unknown>) {
  for (const key of ["version", "bundle_version", "model_bundle_version"]) {
    if (typeof bundle[key] === "string") return bundle[key];
  }

  return null;
}

function StatusBadge({ label }: { label: string }) {
  return (
    <RichButton
      asChild
      size="sm"
      color={statusColors[label] ?? "default"}
      className="pointer-events-none"
    >
      <span>
        <MorphingText>{label}</MorphingText>
      </span>
    </RichButton>
  );
}

function RiskScoreBar({ score }: { score: number | null }) {
  const percentage = score === null ? 0 : Math.max(0, Math.min(1, score)) * 100;

  return (
    <div className="flex min-w-40 items-center gap-3">
      <div
        className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-100"
        role="progressbar"
        aria-label={`Risk score ${formatPercentage(score)}`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={score === null ? undefined : percentage}
      >
        <div
          className="h-full rounded-full bg-red-600 transition-[width] duration-300 motion-reduce:transition-none"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="w-12 text-right text-xs font-medium tabular-nums text-zinc-700">
        <MorphingText>{formatPercentage(score)}</MorphingText>
      </span>
    </div>
  );
}

function queueDescription(item: CaptureQueueItem | undefined, hasFailed: boolean, allComplete: boolean) {
  if (item) {
    if (item.phase === "uploading") return `Uploading ${item.filename} to the dashboard.`;
    if (item.phase === "queued") return "Waiting for the server extraction worker.";
    if (item.phase === "extracting") return "The server is extracting supported mail sessions.";
    return `Analyzing ${item.analyzedCount} of ${item.sessionCount || "?"} sessions from ${item.filename}.`;
  }
  if (hasFailed) return "A capture needs attention. Expand its row to see the error.";
  if (allComplete) return "All selected captures have finished.";
  return "Select captures, then queue the batch.";
}

function QueuePanel({
  queueItems,
  onRemoveRow,
}: {
  queueItems: CaptureQueueItem[];
  onRemoveRow: (key: string) => void;
}) {
  const processedCount = queueItems.filter((item) => ["complete", "empty"].includes(item.phase)).length;
  const activeItem = queueItems.find((item) =>
    ["uploading", "queued", "extracting", "analyzing"].includes(item.phase),
  );
  const hasFailed = queueItems.some((item) => item.phase === "failed");
  const allComplete = queueItems.length > 0 && queueItems.every((item) =>
    ["complete", "empty"].includes(item.phase),
  );
  const queueLabel = activeItem ? "Processing" : hasFailed ? "Failed" : allComplete ? "Complete" : "Ready";
  const activeProgress = activeItem
    ? getQueueProgress(activeItem)
    : allComplete
      ? { label: "Complete", value: 100, determinate: true }
      : { label: "Waiting", value: null, determinate: false };
  const progressValue = activeProgress.value;
  const taskRows: TaskRow[] = queueItems.map((item, index) => {
    const progress = getQueueProgress(item);
    const terminal = item.phase === "complete" || item.phase === "empty";
    const conversion = item.phase === "ready"
      ? "Not started"
      : item.phase === "uploading"
        ? "Uploading"
        : item.job?.status ?? item.phase;

    return {
      key: item.id,
      label: item.filename,
      amount: formatFileSize(item.size),
      status: item.phase === "failed" ? "failed" : terminal ? "done" : item.phase === "ready" ? "ready" : "running",
      progress: progress.value,
      step: index + 1,
      details: [
        { label: "Current step", meta: progress.label },
        { label: "Conversion", meta: conversion },
        {
          label: "Analysis",
          meta: item.sessionCount > 0
            ? `${item.analyzedCount} / ${item.sessionCount} sessions`
            : item.phase === "empty"
              ? "No supported sessions"
              : "Waiting for extraction",
        },
        ...(item.error ? [{ label: "Error", meta: item.error }] : []),
      ],
    };
  });

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle>Processing queue</CardTitle>
          <StatusBadge label={queueLabel} />
        </div>
        <CardDescription>{queueDescription(activeItem, hasFailed, allComplete)}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
          <div className="flex items-center justify-between gap-3 text-xs">
            <span className="font-medium text-zinc-700">
              <MorphingText>{`${processedCount} / ${queueItems.length} captures complete`}</MorphingText>
            </span>
            <span className="text-right font-medium text-zinc-500">
              {activeItem ? `${activeItem.filename} · ` : "Now "}
              <MorphingText>{activeProgress.label}</MorphingText>
              {progressValue !== null ? ` · ${Math.round(progressValue)}%` : null}
            </span>
          </div>
          <div
            className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-200"
            role="progressbar"
            aria-label={`${activeProgress.label} progress`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={activeProgress.determinate ? progressValue ?? undefined : undefined}
          >
            <div
              className={`h-full rounded-full bg-zinc-900 transition-[width] duration-300 motion-reduce:transition-none ${activeProgress.determinate ? "" : activeItem ? "w-1/3 animate-pulse" : "w-0"}`}
              style={activeProgress.determinate && progressValue !== null ? { width: `${progressValue}%` } : undefined}
            />
          </div>
        </div>

        {taskRows.length > 0 ? (
          <TaskRows rows={taskRows} onRemoveRow={onRemoveRow} />
        ) : (
          <div className="flex min-h-32 items-center justify-center rounded-lg border border-dashed border-zinc-200 px-4 text-center text-xs text-zinc-500">
            No captures queued
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function AnalysisWorkspace({
  analysis,
  apiError,
}: AnalysisWorkspaceProps) {
  const {
    attachments,
    queueItems,
    isProcessing,
    canQueue,
    setAttachments,
    removeAttachment,
    removeQueueItem,
    queueFiles,
    latestAnalysis,
  } = useCaptureQueue();
  const [resultQuery, setResultQuery] = useState("");
  const [resultStatus, setResultStatus] = useState("All statuses");
  const currentAnalysis = latestAnalysis ?? analysis;
  const xgboostScore = currentAnalysis
    ? readModelProbability(currentAnalysis.ml_scores, "xgboost")
    : null;
  const randomForestScore = currentAnalysis
    ? readModelProbability(currentAnalysis.ml_scores, "random_forest")
    : null;
  const bundleVersion = currentAnalysis
    ? modelBundleVersion(currentAnalysis.model_bundle)
    : null;
  const verdict = currentAnalysis ? formatVerdict(currentAnalysis.final_verdict) : null;

  const resultFilters: TableFilter[] = [{
    name: "status",
    label: "Status",
    value: resultStatus,
    options: ["All statuses", ...(verdict ? [verdict] : [])],
  }];
  const showAnalysisResult = useMemo(() => {
    if (!currentAnalysis) return false;
    const matchesQuery = !resultQuery.trim() || `${currentAnalysis.client_id ?? currentAnalysis.session_id} ${currentAnalysis.request_id}`
      .toLowerCase()
      .includes(resultQuery.trim().toLowerCase());
    return matchesQuery && (resultStatus === "All statuses" || resultStatus === verdict);
  }, [currentAnalysis, resultQuery, resultStatus, verdict]);

  return (
    <>
      <section aria-labelledby="analysis-input-heading" className="p-6 pb-0">
        {apiError ? (
          <div role="status" className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {apiError}. No placeholder analysis is shown.
          </div>
        ) : null}
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.65fr)]">
          <Card>
            <CardHeader>
              <CardTitle id="analysis-input-heading">Analyze captures</CardTitle>
              <CardDescription>
                Upload PCAP or PCAPNG files for server-side extraction. Each extracted session is submitted to the analysis API individually.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AttachmentUpload
                value={attachments}
                accept=".pcap,.pcapng,application/vnd.tcpdump.pcap"
                multiple
                maxFiles={12}
                disabled={isProcessing}
                title="Drop PCAP files here or browse"
                description="PCAP and PCAPNG supported · up to 12 files per batch"
                attachmentsLabel="Selected captures"
                onValueChange={setAttachments}
                onRemove={removeAttachment}
                className="[&>section]:hidden"
                classNames={{ dropzone: "min-h-56 rounded-xl bg-zinc-50" }}
              />
            </CardContent>
            <CardFooter className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 pt-4">
              <p className="text-xs text-zinc-500">
                {isProcessing
                  ? "Working through upload, extraction, and session analysis."
                  : "PCAP bytes are sent to capture ingestion; extracted sessions are analyzed separately."}
              </p>
              <RichButton type="button" color="primary" disabled={!canQueue} onClick={() => void queueFiles()}>
                {isProcessing ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : null}
                {isProcessing ? "Processing…" : "Queue batch"}
              </RichButton>
            </CardFooter>
          </Card>

          <QueuePanel queueItems={queueItems} onRemoveRow={removeQueueItem} />
        </div>
      </section>

      <section aria-labelledby="analysis-summary-heading" className="p-6 pb-0">
        <div className="mb-4">
          <h2 id="analysis-summary-heading" className="text-lg font-semibold tracking-tighter text-zinc-900">Latest API analysis</h2>
          <p className="text-sm text-zinc-500">Advisory scores and backend verdict from the latest persisted record.</p>
        </div>

        {!currentAnalysis ? (
          <div className="mb-4 rounded-lg border border-dashed border-zinc-200 px-4 py-8 text-center text-sm text-zinc-500">
            No persisted analysis records are available.
          </div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between text-zinc-500"><span className="text-sm">Ensemble risk</span><Gauge aria-hidden="true" className="size-4" /></div>
              <p className="mt-4 text-3xl font-semibold tracking-tighter text-zinc-900"><MorphingText>{formatPercentage(currentAnalysis?.risk_score ?? null)}</MorphingText></p>
              <p className="mt-1 text-xs text-zinc-500">{verdict ?? "Unavailable"} · backend verdict</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between text-zinc-500"><span className="text-sm">XGBoost</span><ShieldAlert aria-hidden="true" className="size-4" /></div>
              <p className="mt-4 text-3xl font-semibold tracking-tighter text-zinc-900"><MorphingText>{formatPercentage(xgboostScore)}</MorphingText></p>
              <p className="mt-1 text-xs text-zinc-500">API model score when persisted</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between text-zinc-500"><span className="text-sm">Random Forest</span><Gauge aria-hidden="true" className="size-4" /></div>
              <p className="mt-4 text-3xl font-semibold tracking-tighter text-zinc-900"><MorphingText>{formatPercentage(randomForestScore)}</MorphingText></p>
              <p className="mt-1 text-xs text-zinc-500">API model score when persisted</p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section aria-labelledby="analysis-results-heading" className="p-6">
        <Card>
          <CardHeader>
            <CardTitle id="analysis-results-heading">Analysis results</CardTitle>
            <CardDescription>Review the latest persisted record and backend-provided risk score.</CardDescription>
          </CardHeader>
          <TableToolbar searchPlaceholder="Search results" filters={resultFilters} onQueryChange={setResultQuery} onFilterChange={(_, value) => setResultStatus(value)} showDateRange={false} />
          <CardContent className="p-0">
            <div className="overflow-x-auto" role="region" tabIndex={0} aria-label="Analysis results table">
              <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                <caption className="sr-only">Analysis results</caption>
                <thead className="border-y border-zinc-200 bg-zinc-50 text-xs font-medium text-zinc-500"><tr><th scope="col" className="px-5 py-3">Capture / session ID</th><th scope="col" className="px-5 py-3">Protocol</th><th scope="col" className="px-5 py-3">Risk score</th><th scope="col" className="px-5 py-3">Verdict</th></tr></thead>
                <tbody className="divide-y divide-zinc-100">
                  {showAnalysisResult && currentAnalysis ? (
                    <tr className="text-zinc-700">
                      <th scope="row" className="max-w-64 px-5 py-4 font-mono text-xs font-medium text-zinc-900"><span className="block truncate" title={currentAnalysis.session_id}>{currentAnalysis.client_id ?? currentAnalysis.session_id}</span></th>
                      <td className="px-5 py-4 text-zinc-500">{currentAnalysis.protocol ?? "Not supplied"}</td>
                      <td className="px-5 py-4"><RiskScoreBar score={currentAnalysis.risk_score} /></td>
                      <td className="px-5 py-4"><StatusBadge label={verdict ?? "Unavailable"} /></td>
                    </tr>
                  ) : (
                    <tr><td colSpan={4} className="px-5 py-10 text-center text-sm text-zinc-500">{currentAnalysis ? "No analysis results match the current filters." : "No analysis records yet. The API returned an empty result set."}</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
          <CardFooter className="border-t border-zinc-100 pt-4 text-xs text-zinc-500">{currentAnalysis ? `Request ${currentAnalysis.request_id} · source ${currentAnalysis.source_label ?? "not supplied"} · bundle ${bundleVersion ?? "not supplied"} · ${currentAnalysis.rule_triggers_count} rule triggers` : "No persisted analysis metadata available."}</CardFooter>
        </Card>
      </section>
    </>
  );
}
