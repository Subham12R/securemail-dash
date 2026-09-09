"use client";

import { useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  FileText,
  Mail,
  Network,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import HistoryAiPanel from "@/components/ui/history-ai-panel";
import InboxDetailPanels from "@/components/ui/inbox-detail-panels";
import { MorphingText } from "@/components/ui/morphing-text";
import { RichButton, type RichButtonColor } from "@/components/ui/rich-button";
import { riskBandForScore, riskScoreBarClass } from "@/lib/risk";
import {
  analysisFieldLabel,
  type AnalysisDetailViewModel,
  type AnalysisModelEvaluation,
  type AnalysisRiskDriver,
} from "@/lib/analysis-detail";

function displayValue(value: string | null | undefined) {
  return value?.trim() || "Not supplied";
}

function formatTimestamp(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not supplied";

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(date);
}

function formatVerdict(value: string) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : "Not supplied";
}

function statusColor(value: string): RichButtonColor {
  switch (value.toLowerCase()) {
    case "malicious":
    case "critical":
      return "danger";
    case "suspicious":
    case "high":
      return "warning";
    case "benign":
    case "complete":
    case "low":
      return "primary";
    case "medium":
      return "warning";
    case "informational":
    case "unknown":
      return "info";
    default:
      return "default";
  }
}

function StatusBadge({ label }: { label: string }) {
  return (
    <RichButton
      asChild
      size="sm"
      color={statusColor(label)}
      className="pointer-events-none"
    >
      <span>
        <MorphingText>{label}</MorphingText>
      </span>
    </RichButton>
  );
}

function RiskScore({ score }: { score: number }) {
  const percentage = Number.isFinite(score)
    ? Math.max(0, Math.min(100, score * 100))
    : null;
  const formatted = percentage === null ? "Not supplied" : `${percentage.toFixed(1)}%`;

  return (
    <div className="flex min-w-44 items-center gap-3">
      <div
        className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-100"
        role="progressbar"
        aria-label={`Risk score ${formatted}`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percentage ?? undefined}
      >
        <div
          className={`h-full rounded-full transition-[width] duration-300 motion-reduce:transition-none ${riskScoreBarClass(score)}`}
          style={{ width: `${percentage ?? 0}%` }}
        />
      </div>
      <span className="w-16 text-right text-xs font-medium tabular-nums text-zinc-700">
        <MorphingText>{formatted}</MorphingText>
      </span>
    </div>
  );
}

function MetadataList({
  entries,
}: {
  entries: Array<[label: string, value: string]>;
}) {
  return (
    <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
      {entries.map(([label, value]) => (
        <div key={label} className="min-w-0">
          <dt className="text-[11px] text-zinc-500">{label}</dt>
          <dd className="mt-1 break-words text-sm text-zinc-800">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function formatProbability(value: number | null) {
  if (value === null || !Number.isFinite(value)) return "Not supplied";
  return `${(Math.max(0, Math.min(1, value)) * 100).toFixed(1)}%`;
}

function formatContribution(value: number | null) {
  if (value === null || !Number.isFinite(value)) return "Not supplied";
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}`;
}

function directionLabel(value: AnalysisRiskDriver["direction"]) {
  switch (value) {
    case "increases_risk":
      return "Raises risk";
    case "decreases_risk":
      return "Lowers risk";
    default:
      return "Direction not supplied";
  }
}

function ModelEvaluationList({ evaluations }: { evaluations: readonly AnalysisModelEvaluation[] }) {
  if (evaluations.length === 0) {
    return <p className="text-sm text-zinc-600">No normalized model evaluation was supplied.</p>;
  }

  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {evaluations.map((evaluation) => (
        <li key={evaluation.model} className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
          <p className="font-medium text-zinc-900">{evaluation.model}</p>
          <dl className="mt-3 grid gap-3 text-xs sm:grid-cols-2">
            <div>
              <dt className="text-zinc-500">Prediction</dt>
              <dd className="mt-1 text-sm text-zinc-800">{evaluation.prediction ?? "Not supplied"}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Risk likelihood</dt>
              <dd className="mt-1 text-sm tabular-nums text-zinc-800">{formatProbability(evaluation.risk_probability)}</dd>
            </div>
          </dl>
        </li>
      ))}
    </ul>
  );
}

function RiskDriverList({ drivers }: { drivers: readonly AnalysisRiskDriver[] }) {
  if (drivers.length === 0) {
    return <p className="text-sm text-zinc-600">No normalized model signals were supplied.</p>;
  }

  return (
    <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200">
      {drivers.map((driver) => (
        <li key={`${driver.feature}-${driver.contribution ?? "none"}`} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-4 py-3 text-sm">
          <span className="font-medium text-zinc-900">{driver.feature}</span>
          <span className="text-xs text-zinc-600">
            {directionLabel(driver.direction)} · observed {driver.observed_value} · contribution {formatContribution(driver.contribution)}
          </span>
        </li>
      ))}
    </ul>
  );
}

function AnalysisSummaryCard({ viewModel }: { viewModel: AnalysisDetailViewModel }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Analysis summary</CardTitle>
        <CardDescription>Human-readable interpretation of the persisted analysis output.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <p className="max-w-3xl text-sm leading-6 text-zinc-700">{viewModel.summary_text}</p>
        <div className="border-t border-zinc-100 pt-5">
          <h4 className="text-sm font-semibold text-zinc-900">Model evaluation</h4>
          <p className="mt-1 text-xs text-zinc-500">The available model predictions and risk likelihoods, without raw bundle metadata.</p>
          <div className="mt-4">
            <ModelEvaluationList evaluations={viewModel.model.evaluations} />
          </div>
        </div>
        <div className="border-t border-zinc-100 pt-5">
          <h4 className="text-sm font-semibold text-zinc-900">Key risk signals</h4>
          <p className="mt-1 text-xs text-zinc-500">The strongest supported feature contributions, normalized for review.</p>
          <div className="mt-4">
            <RiskDriverList drivers={viewModel.model.risk_drivers} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function RuleFindingsCard({ viewModel }: { viewModel: AnalysisDetailViewModel }) {
  const { summary } = viewModel;
  const { rule_findings: findings } = viewModel.model;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Deterministic checks</CardTitle>
        <CardDescription>Rule results and evidence counts returned with this record.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <dl className="grid gap-4 sm:grid-cols-3">
          <div>
            <dt className="text-[11px] text-zinc-500">Rule score</dt>
            <dd className="mt-1 text-sm text-zinc-800">{summary.rule_score === null ? "Not supplied" : summary.rule_score.toFixed(3)}</dd>
          </div>
          <div>
            <dt className="text-[11px] text-zinc-500">Triggered checks</dt>
            <dd className="mt-1 text-sm text-zinc-800">{summary.rule_triggers_count}</dd>
          </div>
          <div>
            <dt className="text-[11px] text-zinc-500">Evidence references</dt>
            <dd className="mt-1 text-sm text-zinc-800">{summary.evidence_ref_count}</dd>
          </div>
        </dl>
        <div className="border-t border-zinc-100 pt-5">
          <h4 className="text-sm font-semibold text-zinc-900">Findings</h4>
          {findings.length > 0 ? (
            <ul className="mt-3 divide-y divide-zinc-200 rounded-lg border border-zinc-200">
              {findings.map((finding) => (
                <li key={`${finding.label}-${finding.evidence ?? "none"}`} className="space-y-1 px-4 py-3 text-sm">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="font-medium text-zinc-900">{finding.label}</span>
                    {finding.severity ? <span className="text-xs text-amber-700">{finding.severity}</span> : null}
                  </div>
                  {finding.detail ? <p className="text-xs text-zinc-600">{finding.detail}</p> : null}
                  {finding.evidence ? <p className="text-xs text-zinc-500">Evidence: {finding.evidence}</p> : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-zinc-600">
              {summary.rule_triggers_count === 0 ? "No rule findings were recorded." : "Rule finding details were not supplied."}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function DataAvailabilityCard({ missingFields }: { missingFields: readonly string[] }) {
  const missing = missingFields.map(analysisFieldLabel);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Data availability</CardTitle>
        <CardDescription>Supporting values are shown only when the analysis supplied a meaningful result.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-6 text-zinc-700">
          {missing.length === 0
            ? "The core record and normalized analysis metrics are available."
            : `Not supplied: ${missing.join(", ")}.`}
        </p>
      </CardContent>
    </Card>
  );
}

function UnavailableCard({
  heading,
  reason,
}: {
  heading: string;
  reason: string | null;
}) {
  return (
    <section
      role="status"
      className="rounded-xl border border-zinc-200 bg-zinc-50 p-5"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-amber-600" />
        <div>
          <h2 className="text-sm font-semibold text-zinc-900">{heading}</h2>
          <p className="mt-1 text-sm text-zinc-600">
            {reason ?? "The source did not provide this information."}
          </p>
        </div>
      </div>
    </section>
  );
}

function RecordHeader({ viewModel }: { viewModel: AnalysisDetailViewModel }) {
  const detail = viewModel.inbox.state === "available"
    ? viewModel.inbox.detail
    : null;
  const item = detail?.item ?? null;
  const isEmail = viewModel.source === "email_client";
  const Icon = isEmail ? Mail : viewModel.source === "analysed_pcap" ? Network : FileText;
  const primary = isEmail
    ? item?.sender.address ?? item?.sender.name ?? displayValue(viewModel.summary.client_id)
    : viewModel.source_label;
  const secondary = isEmail
    ? displayValue(item?.subject)
    : `${displayValue(viewModel.summary.protocol)} analysis record`;
  const recipients = item?.recipients
    .map((recipient) => recipient.address ?? recipient.name)
    .filter(Boolean)
    .join(", ") || "Not supplied";
  const riskBand = riskBandForScore(viewModel.summary.risk_score);

  return (
    <header className="rounded-xl border border-zinc-200 bg-white p-5 shadow-[inset_0_0_2px_1px_rgba(0,0,0,0.04)] sm:p-6">
      <div className="flex flex-col gap-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-xl border-2 border-zinc-200 bg-white text-sky-700">
              <Icon aria-hidden="true" className="size-6" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-zinc-600">{viewModel.source_label}</p>
              <h1 id="history-detail-heading" className="mt-1 break-words text-xl font-semibold tracking-tighter text-zinc-900 sm:text-2xl">
                {primary}
              </h1>
              <p className="mt-1 break-words text-sm text-zinc-500">{secondary}</p>
            </div>
          </div>
          <Link
            href="/history"
            className="inline-flex shrink-0 items-center gap-2 rounded-md border border-zinc-300 px-3 py-2 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
          >
            <ArrowLeft aria-hidden="true" className="size-3.5" />
            Back to History
          </Link>
        </div>

        {isEmail && viewModel.inbox.state !== "available" ? (
          <p role="status" className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            Inbox details unavailable for this record. {viewModel.inbox.reason ?? "The source did not return a matching item."}
          </p>
        ) : null}

        {isEmail && item ? (
          <MetadataList
            entries={[
              ["From", displayValue(item.sender.address ?? item.sender.name)],
              ["Subject", displayValue(item.subject)],
              ["To", recipients],
              ["ID", displayValue(item.mail_item_id)],
            ]}
          />
        ) : null}

        <MetadataList
          entries={[
            ["Request ID", displayValue(viewModel.summary.request_id)],
            ["Session ID", displayValue(viewModel.summary.session_id)],
            ["Capture ID", displayValue(viewModel.summary.capture_id)],
            ["Protocol", displayValue(viewModel.summary.protocol)],
            ["Posture", displayValue(viewModel.summary.posture)],
            ["Risk band", formatVerdict(riskBand ?? "Not supplied")],
            ["Observed", formatTimestamp(viewModel.summary.timestamp)],
          ]}
        />

        <div className="flex flex-wrap items-center gap-4 border-t border-zinc-100 pt-4">
          <div className="flex items-center gap-2 text-xs">
            {viewModel.summary.final_verdict.toLowerCase() === "benign" ? (
              <ShieldCheck aria-hidden="true" className="size-4 text-emerald-600" />
            ) : (
              <AlertTriangle aria-hidden="true" className="size-4 text-amber-600" />
            )}
            <span className="text-zinc-500">Final verdict</span>
            <StatusBadge label={formatVerdict(viewModel.summary.final_verdict)} />
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-zinc-500">Risk band</span>
            <StatusBadge label={formatVerdict(riskBand ?? "Not supplied")} />
          </div>
          <RiskScore score={viewModel.summary.risk_score} />
          {item ? (
            <span className="text-xs text-zinc-500">
              Inbox triage: {formatVerdict(item.triage_state)}
            </span>
          ) : null}
        </div>
      </div>
    </header>
  );
}

function EmailRecordView({ viewModel }: { viewModel: AnalysisDetailViewModel }) {
  const detail = viewModel.inbox.state === "available"
    ? viewModel.inbox.detail
    : null;

  return (
    <section aria-labelledby="history-email-heading" className="rounded-xl border border-zinc-200 bg-white shadow-[inset_0_0_2px_1px_rgba(0,0,0,0.04)]">
      <div className="border-b border-zinc-100 px-5 py-4 sm:px-6">
        <h2 id="history-email-heading" className="text-sm font-semibold text-zinc-900">Inbox evidence</h2>
        <p className="mt-1 text-xs text-zinc-500">Safe email and network details for this analysis record.</p>
      </div>
      {detail ? (
        <InboxDetailPanels detail={detail} initialTab="content" idPrefix="history-email" />
      ) : (
        <div className="p-5 sm:p-6">
          <UnavailableCard
            heading="Inbox details unavailable for this record"
            reason={viewModel.inbox.reason}
          />
        </div>
      )}
    </section>
  );
}

function PcapRecordView({ viewModel }: { viewModel: AnalysisDetailViewModel }) {
  const summary = viewModel.summary;
  const relatedInbox = viewModel.inbox.state === "available"
    ? viewModel.inbox.detail
    : null;

  return (
    <section aria-labelledby="history-analysis-detail-heading" className="space-y-4">
      <h2 id="history-analysis-detail-heading" className="sr-only">Analysis record details</h2>
      <Card>
        <CardHeader>
          <CardTitle>Record summary</CardTitle>
          <CardDescription>
            Persisted SecureMail analysis metadata. Model output is advisory.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MetadataList
            entries={[
              ["Capture ID", displayValue(summary.capture_id)],
              ["Session ID", displayValue(summary.session_id)],
              ["Request ID", displayValue(summary.request_id)],
              ["Client ID", displayValue(summary.client_id)],
              ["Protocol", displayValue(summary.protocol)],
              ["Posture", displayValue(summary.posture)],
              ["Risk band", formatVerdict(riskBandForScore(summary.risk_score) ?? "Not supplied")],
              ["Observed", formatTimestamp(summary.timestamp)],
            ]}
          />
        </CardContent>
      </Card>

      <AnalysisSummaryCard viewModel={viewModel} />
      <RuleFindingsCard viewModel={viewModel} />
      <DataAvailabilityCard missingFields={viewModel.model.missing_fields} />

      {relatedInbox ? (
        <Card>
          <CardHeader>
            <CardTitle>Related Inbox evidence</CardTitle>
            <CardDescription>Normalized Inbox details confirmed against this request ID.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <InboxDetailPanels detail={relatedInbox} initialTab="network" idPrefix="history-related" />
          </CardContent>
        </Card>
      ) : (
        <UnavailableCard
          heading="Related Inbox evidence unavailable"
          reason={viewModel.inbox.reason}
        />
      )}
    </section>
  );
}

export default function HistoryAnalysisDetail({
  viewModel,
}: {
  viewModel: AnalysisDetailViewModel;
}) {
  const [assistantOpen, setAssistantOpen] = useState(true);

  return (
    <div className="min-h-0 px-4 py-4 sm:px-6 sm:py-6">
      <div
        className={`mx-auto grid w-full max-w-[1280px] min-h-0 items-start gap-4 lg:gap-5 ${
          assistantOpen
            ? "lg:grid-cols-[minmax(0,1fr)_20.5rem]"
            : "lg:grid-cols-[minmax(0,1fr)_3rem]"
        }`}
      >
        <div className="min-w-0 space-y-4">
          <RecordHeader viewModel={viewModel} />
          {viewModel.source === "email_client" ? (
            <EmailRecordView viewModel={viewModel} />
          ) : (
            <PcapRecordView viewModel={viewModel} />
          )}
        </div>
        <HistoryAiPanel
          viewModel={viewModel}
          expanded={assistantOpen}
          onToggle={() => setAssistantOpen((value) => !value)}
        />
      </div>
    </div>
  );
}
