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
  "model_bundle",
  "ml_scores",
  "explanations",
  "rule_score",
  "trigger_details",
  "evidence_ref_count",
] as const;

export type SafeAnalysisEntry = {
  path: string;
  value: string;
};

export type InboxDetailLookup = {
  state: "available" | "not_found" | "unavailable";
  detail: InboxDetailResponse | null;
  reason: string | null;
};

export type AnalysisDetailViewModel = {
  source: AnalysisSourceKind;
  source_label: string;
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
    bundle: SafeAnalysisEntry[];
    scores: SafeAnalysisEntry[];
    explanations: SafeAnalysisEntry[];
    rule_findings: SafeAnalysisEntry[];
    missing_fields: string[];
  };
  inbox: InboxDetailLookup;
};

const MAX_ANALYSIS_DEPTH = 3;
const MAX_ANALYSIS_ENTRIES = 80;
const MAX_ANALYSIS_STRING_LENGTH = 512;
const MAX_ANALYSIS_PATH_LENGTH = 160;
const MAX_REQUEST_ID_LENGTH = 256;

function boundedString(value: string, maxLength = MAX_ANALYSIS_STRING_LENGTH) {
  return value.length > maxLength ? value.slice(0, maxLength) : value;
}

function optionalText(value: string | null) {
  if (!value?.trim()) return null;
  return boundedString(value.trim());
}

function requiredText(value: string) {
  return boundedString(value.trim()) || "Not supplied";
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

function appendEntry(
  entries: SafeAnalysisEntry[],
  path: string,
  value: string,
) {
  if (entries.length >= MAX_ANALYSIS_ENTRIES) return;
  entries.push({
    path: boundedString(path, MAX_ANALYSIS_PATH_LENGTH),
    value: boundedString(value),
  });
}

function flattenValue(
  value: unknown,
  path: string,
  entries: SafeAnalysisEntry[],
  seen: WeakSet<object>,
  depth: number,
) {
  if (entries.length >= MAX_ANALYSIS_ENTRIES || depth > MAX_ANALYSIS_DEPTH) return;

  if (value === null) {
    appendEntry(entries, path, "null");
    return;
  }

  if (typeof value === "string") {
    appendEntry(entries, path, value);
    return;
  }

  if (typeof value === "number") {
    if (Number.isFinite(value)) appendEntry(entries, path, String(value));
    return;
  }

  if (typeof value === "boolean") {
    appendEntry(entries, path, String(value));
    return;
  }

  if (typeof value !== "object") return;
  if (seen.has(value)) return;

  seen.add(value);
  if (Array.isArray(value)) {
    value.forEach((entry, index) => {
      flattenValue(entry, `${path}[${index}]`, entries, seen, depth + 1);
    });
  } else if (depth < MAX_ANALYSIS_DEPTH) {
    Object.entries(value).forEach(([key, entry]) => {
      const safeKey = boundedString(key, MAX_ANALYSIS_PATH_LENGTH);
      flattenValue(entry, `${path}.${safeKey}`, entries, seen, depth + 1);
    });
  }
  seen.delete(value);
}

function flattenField(value: unknown, field: string) {
  const entries: SafeAnalysisEntry[] = [];
  flattenValue(value, field, entries, new WeakSet<object>(), 0);
  return entries;
}

function addMissingFields(
  missing: Set<string>,
  field: string,
  entries: readonly SafeAnalysisEntry[],
) {
  if (entries.length === 0) missing.add(field);
}

export function buildAnalysisDetailViewModel(
  record: AnalysisRecord,
  inbox: InboxDetailLookup,
): AnalysisDetailViewModel {
  const source = classifyAnalysisSource(record);
  const bundle = flattenField(record.model_bundle, "model_bundle");
  const scores = flattenField(record.ml_scores, "ml_scores");
  const explanations = flattenField(record.explanations, "explanations");
  const ruleFindings = flattenField(record.trigger_details, "trigger_details");
  const missingFields = new Set<string>();

  if (!record.capture_id?.trim()) missingFields.add("capture_id");
  if (!record.session_id.trim()) missingFields.add("session_id");
  if (!record.protocol?.trim()) missingFields.add("protocol");
  if (!record.posture?.trim()) missingFields.add("posture");
  if (record.rule_score === null) missingFields.add("rule_score");
  addMissingFields(missingFields, "model_bundle", bundle);
  addMissingFields(missingFields, "ml_scores", scores);
  addMissingFields(missingFields, "explanations", explanations);
  addMissingFields(missingFields, "trigger_details", ruleFindings);

  return {
    source,
    source_label: analysisSourceLabel(source),
    summary: {
      request_id: requiredText(record.request_id),
      session_id: requiredText(record.session_id),
      capture_id: optionalText(record.capture_id),
      client_id: optionalText(record.client_id),
      protocol: optionalText(record.protocol),
      posture: optionalText(record.posture),
      timestamp: requiredText(record.timestamp),
      final_verdict: requiredText(record.final_verdict),
      risk_score: record.risk_score,
      rule_score: record.rule_score,
      evidence_ref_count: record.evidence_ref_count,
      rule_triggers_count: record.rule_triggers_count,
      is_synthetic: record.is_synthetic,
    },
    model: {
      bundle,
      scores,
      explanations,
      rule_findings: ruleFindings,
      missing_fields: [...missingFields],
    },
    inbox,
  };
}
