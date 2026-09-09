import { riskBandForScore } from "./risk.ts";
import type { InboxDetailResponse } from "@/lib/inbox-data";
import type { AnalysisRecord } from "@/lib/securemail-api";

export type AnalysisSourceKind =
  | "email_client"
  | "analysed_pcap"
  | "synthetic"
  | "unknown";

export const ANALYSIS_DETAIL_FIELDS = [
  "capture_id",
  "session_id",
  "protocol",
  "posture",
  "ml_scores",
  "explanations",
  "rule_score",
  "trigger_details",
  "evidence_ref_count",
] as const;

export type AnalysisModelEvaluation = {
  model: string;
  prediction: string | null;
  risk_probability: number | null;
};

export type AnalysisRiskDriver = {
  feature: string;
  observed_value: string;
  contribution: number | null;
  direction: "increases_risk" | "decreases_risk" | "not_supplied";
};

export type AnalysisRuleFinding = {
  label: string;
  severity: string | null;
  detail: string | null;
  evidence: string | null;
};

export type InboxDetailLookup = {
  state: "available" | "not_found" | "unavailable";
  detail: InboxDetailResponse | null;
  reason: string | null;
};

export type AnalysisDetailViewModel = {
  source: AnalysisSourceKind;
  source_label: string;
  summary_text: string;
  summary: {
    request_id: string;
    session_id: string;
    capture_id: string | null;
    client_id: string | null;
    protocol: string | null;
    posture: string | null;
    timestamp: string;
    final_verdict: string;
    risk_score: number;
    rule_score: number | null;
    evidence_ref_count: number;
    rule_triggers_count: number;
    is_synthetic: boolean;
  };
  model: {
    evaluations: AnalysisModelEvaluation[];
    risk_drivers: AnalysisRiskDriver[];
    rule_findings: AnalysisRuleFinding[];
    missing_fields: string[];
  };
  inbox: InboxDetailLookup;
};

const MAX_DISPLAY_LENGTH = 160;
const MAX_MODEL_EVALUATIONS = 8;
const MAX_RISK_DRIVERS = 8;
const MAX_RULE_FINDINGS = 12;
const MAX_RULE_EVIDENCE_LENGTH = 240;
const MAX_REQUEST_ID_LENGTH = 256;

type JsonRecord = Record<string, unknown>;

const LABEL_OVERRIDES: Record<string, string> = {
  dkim: "DKIM",
  dmarc: "DMARC",
  id: "ID",
  imap: "IMAP",
  ip: "IP",
  pop3: "POP3",
  random_forest: "Random forest",
  smtp: "SMTP",
  spf: "SPF",
  tcp: "TCP",
  tls: "TLS",
  xgboost: "XGBoost",
};

function boundedString(value: string, maxLength = MAX_DISPLAY_LENGTH) {
  return value.length > maxLength ? value.slice(0, maxLength) : value;
}

function asRecord(value: unknown): JsonRecord | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as JsonRecord)
    : null;
}

function stringValue(value: unknown, maxLength = MAX_DISPLAY_LENGTH) {
  if (typeof value !== "string" || !value.trim()) return null;
  return boundedString(value.trim(), maxLength);
}

function stringAt(source: JsonRecord, ...keys: string[]) {
  for (const key of keys) {
    const value = stringValue(source[key]);
    if (value) return value;
  }
  return null;
}

function numberAt(source: JsonRecord, ...keys: string[]) {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
  }
  return null;
}

function scalarDisplay(value: unknown) {
  if (value === null) return "Not observed";
  if (typeof value === "string") return stringValue(value) ?? "Not observed";
  if (typeof value === "number" && Number.isFinite(value)) return boundedString(String(value));
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return null;
}

function humanizeLabel(value: string | null) {
  if (!value?.trim()) return null;
  const normalized = value.trim().replace(/[_-]+/g, " ").replace(/\s+/g, " ");
  const exact = LABEL_OVERRIDES[normalized.toLowerCase()];
  if (exact) return exact;

  return boundedString(
    normalized
      .split(" ")
      .map((word) => {
        const lower = word.toLowerCase();
        return LABEL_OVERRIDES[lower] ?? `${lower.charAt(0).toUpperCase()}${lower.slice(1)}`;
      })
      .join(" "),
  );
}

function normalizeModelEvaluations(value: JsonRecord) {
  return Object.entries(value)
    .slice(0, MAX_MODEL_EVALUATIONS * 2)
    .flatMap(([name, rawValue]): AnalysisModelEvaluation[] => {
      const model = asRecord(rawValue);
      if (!model) return [];

      const prediction = humanizeLabel(stringAt(model, "predicted_class", "prediction"));
      const probability = numberAt(model, "risk_probability", "probability");
      const riskProbability = probability !== null && probability >= 0 && probability <= 1
        ? probability
        : null;
      if (!prediction && riskProbability === null) return [];

      return [{
        model: humanizeLabel(name) ?? "Model",
        prediction,
        risk_probability: riskProbability,
      }];
    })
    .slice(0, MAX_MODEL_EVALUATIONS);
}

function normalizeRiskDrivers(value: JsonRecord) {
  const supervised = value.supervised;
  if (!Array.isArray(supervised)) return [];

  return supervised
    .slice(0, MAX_RISK_DRIVERS * 2)
    .flatMap((rawValue): AnalysisRiskDriver[] => {
      const entry = asRecord(rawValue);
      if (!entry) return [];

      const feature = humanizeLabel(stringAt(entry, "feature", "name"));
      if (!feature) return [];

      const directionValue = stringAt(entry, "direction")?.toLowerCase();
      const direction = directionValue === "increases_risk" || directionValue === "decreases_risk"
        ? directionValue
        : "not_supplied";
      const observedValue = Object.prototype.hasOwnProperty.call(entry, "observed_value")
        ? scalarDisplay(entry.observed_value) ?? "Not supplied"
        : "Not supplied";

      return [{
        feature,
        observed_value: observedValue,
        contribution: numberAt(entry, "contribution"),
        direction,
      }];
    })
    .sort((left, right) => Math.abs(right.contribution ?? 0) - Math.abs(left.contribution ?? 0))
    .slice(0, MAX_RISK_DRIVERS);
}

function normalizeRuleFindings(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value.slice(0, MAX_RULE_FINDINGS).flatMap((rawValue): AnalysisRuleFinding[] => {
    if (typeof rawValue === "string") {
      const detail = stringValue(rawValue);
      return detail ? [{ label: "Rule finding", severity: null, detail, evidence: null }] : [];
    }

    const entry = asRecord(rawValue);
    if (!entry) return [];

    const label = humanizeLabel(stringAt(
      entry,
      "title",
      "rule",
      "name",
      "finding_id",
      "code",
      "category",
      "type",
    ));
    const severity = humanizeLabel(stringAt(entry, "severity", "level"));
    const detail = stringAt(entry, "description", "detail", "reason", "message", "condition");
    const directEvidence = stringAt(entry, "evidence", "evidence_ref", "reference");
    const evidenceRefs = Array.isArray(entry.evidence_refs)
      ? entry.evidence_refs
        .map((reference) => stringValue(reference, MAX_RULE_EVIDENCE_LENGTH))
        .filter((reference): reference is string => reference !== null)
        .join(", ")
      : null;
    const evidence = directEvidence ?? stringValue(evidenceRefs, MAX_RULE_EVIDENCE_LENGTH);

    if (!label && !severity && !detail && !evidence) return [];
    return [{
      label: label ?? "Rule finding",
      severity,
      detail,
      evidence,
    }];
  });
}

function formatScore(value: number | null) {
  if (value === null || !Number.isFinite(value)) return "not supplied";
  if (value >= 0 && value <= 1) return `${(value * 100).toFixed(1)}%`;
  return boundedString(String(value));
}

function formatCount(value: number) {
  return Number.isFinite(value) && value >= 0 ? String(Math.floor(value)) : "an unknown number of";
}

function buildSummaryText(
  record: AnalysisRecord,
  evaluations: readonly AnalysisModelEvaluation[],
  riskDrivers: readonly AnalysisRiskDriver[],
  findings: readonly AnalysisRuleFinding[],
) {
  const protocol = humanizeLabel(record.protocol) ?? "This";
  const verdict = humanizeLabel(record.final_verdict) ?? "Not supplied";
  const riskBand = humanizeLabel(riskBandForScore(record.risk_score));
  const sentences = [
    `${protocol} analysis received a ${formatScore(record.risk_score)} risk score${riskBand ? ` (${riskBand} score band)` : ""} and a backend final verdict of ${verdict}.`,
  ];

  const posture = humanizeLabel(record.posture);
  if (posture) sentences.push(`The recorded security posture is ${posture}.`);

  if (record.rule_score !== null && Number.isFinite(record.rule_score)) {
    sentences.push(
      `Deterministic checks returned a ${formatScore(record.rule_score)} rule score and ${formatCount(record.rule_triggers_count)} trigger${record.rule_triggers_count === 1 ? "" : "s"}.`,
    );
  } else if (record.rule_triggers_count === 0) {
    sentences.push("No deterministic rule triggers were recorded.");
  } else {
    sentences.push("The deterministic rule score was not supplied.");
  }

  if (evaluations.length > 0) {
    sentences.push(`Model evaluation was returned for ${evaluations.map((evaluation) => evaluation.model).join(" and ")}.`);
  } else {
    sentences.push("No normalized model evaluation was supplied.");
  }

  if (riskDrivers.length > 0) {
    sentences.push(`The strongest model signals were ${riskDrivers.slice(0, 3).map((driver) => driver.feature).join(", ")}.`);
  }

  if (findings.length > 0) {
    sentences.push(`${findings.length} deterministic finding${findings.length === 1 ? " was" : "s were"} returned with this record.`);
  }

  return sentences.join(" ");
}

function sourceText(record: AnalysisRecord) {
  return `${record.source_label ?? ""} ${record.capture_id ?? ""} ${record.session_id}`.toLowerCase();
}

export function classifyAnalysisSource(record: AnalysisRecord): AnalysisSourceKind {
  if (record.is_synthetic) return "synthetic";

  const text = sourceText(record);
  if (/pcap|capture/.test(text)) return "analysed_pcap";
  if (/email|mail|client/.test(text) || Boolean(record.client_id?.trim())) {
    return "email_client";
  }

  return "unknown";
}

export function analysisSourceLabel(source: AnalysisSourceKind) {
  switch (source) {
    case "email_client":
      return "Email client";
    case "analysed_pcap":
      return "Analysed PCAP capture";
    case "synthetic":
      return "Synthetic";
    case "unknown":
      return "Not supplied";
  }
}

export function formatAnalysisSource(record: AnalysisRecord) {
  return analysisSourceLabel(classifyAnalysisSource(record));
}

export function historyDetailHref(requestId: string) {
  const safeRequestId = requestId.trim();
  if (!safeRequestId || safeRequestId.length > MAX_REQUEST_ID_LENGTH) return null;
  return `/history/${encodeURIComponent(safeRequestId)}`;
}

export function analysisFieldLabel(field: string) {
  const labels: Record<string, string> = {
    capture_id: "Capture ID",
    evidence_ref_count: "Evidence references",
    explanations: "Risk signals",
    ml_scores: "Model evaluation",
    posture: "Security posture",
    protocol: "Protocol",
    rule_score: "Rule score",
    session_id: "Session ID",
    trigger_details: "Rule findings",
  };
  return labels[field] ?? "Supporting data";
}

export function buildAnalysisDetailViewModel(
  record: AnalysisRecord,
  inbox: InboxDetailLookup,
): AnalysisDetailViewModel {
  const source = classifyAnalysisSource(record);
  const evaluations = normalizeModelEvaluations(record.ml_scores);
  const riskDrivers = normalizeRiskDrivers(record.explanations);
  const ruleFindings = normalizeRuleFindings(record.trigger_details);
  const missingFields = new Set<string>();

  if (!record.capture_id?.trim()) missingFields.add("capture_id");
  if (!record.session_id.trim()) missingFields.add("session_id");
  if (!record.protocol?.trim()) missingFields.add("protocol");
  if (!record.posture?.trim()) missingFields.add("posture");
  if (record.rule_score === null) missingFields.add("rule_score");
  if (evaluations.length === 0) missingFields.add("ml_scores");
  if (riskDrivers.length === 0) missingFields.add("explanations");
  if (ruleFindings.length === 0) missingFields.add("trigger_details");

  return {
    source,
    source_label: analysisSourceLabel(source),
    summary_text: buildSummaryText(record, evaluations, riskDrivers, ruleFindings),
    summary: {
      request_id: boundedString(record.request_id.trim() || "Not supplied"),
      session_id: boundedString(record.session_id.trim() || "Not supplied"),
      capture_id: record.capture_id?.trim() ? boundedString(record.capture_id.trim()) : null,
      client_id: record.client_id?.trim() ? boundedString(record.client_id.trim()) : null,
      protocol: record.protocol?.trim() ? boundedString(record.protocol.trim()) : null,
      posture: record.posture?.trim() ? boundedString(record.posture.trim()) : null,
      timestamp: boundedString(record.timestamp.trim() || "Not supplied"),
      final_verdict: boundedString(record.final_verdict.trim() || "Not supplied"),
      risk_score: record.risk_score,
      rule_score: record.rule_score,
      evidence_ref_count: record.evidence_ref_count,
      rule_triggers_count: record.rule_triggers_count,
      is_synthetic: record.is_synthetic,
    },
    model: {
      evaluations,
      risk_drivers: riskDrivers,
      rule_findings: ruleFindings,
      missing_fields: [...missingFields],
    },
    inbox,
  };
}
