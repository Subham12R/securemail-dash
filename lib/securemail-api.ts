import { riskScoreDistribution, type RiskScoreDistribution } from "@/lib/risk";
import { LIVE_DATA_CACHE_SECONDS } from "@/lib/live-data";

export const SECUREMAIL_CACHE_TAG = "securemailscope:securemail";

export type VerdictCount = {
  verdict: string;
  count: number;
};

export type PostureCount = {
  posture: string;
  count: number;
};

export type AnalysisStats = {
  total_analyses: number;
  flagged_sessions: number | null;
  evidence_archived: number | null;
  avg_risk_score: number | null;
  verdict_distribution: VerdictCount[];
  cryptographic_posture_distribution: PostureCount[];
  total_validations: number;
  validation_pass_rate: number | null;
};

export type AnalysisRecord = {
  id: number;
  request_id: string;
  session_id: string;
  client_id: string | null;
  capture_id: string | null;
  protocol: string | null;
  posture: string | null;
  timestamp: string;
  evidence_ref_count: number;
  risk_score: number;
  final_verdict: string;
  rule_score: number | null;
  rule_triggers_count: number;
  trigger_details: unknown[];
  ml_scores: Record<string, unknown>;
  explanations: Record<string, unknown>;
  model_bundle: Record<string, unknown>;
  is_synthetic: boolean;
  source_label: string | null;
};

export type HealthResponse = {
  status: string;
  bundle_loaded: boolean;
  bundle_version: string | null;
  calibration_loaded: boolean;
  model_names: string[];
};

export type DashboardApiData = {
  stats: AnalysisStats | null;
  records: AnalysisRecord[];
  risk_distribution: RiskScoreDistribution[] | null;
  health: HealthResponse | null;
  error: string | null;
};

export type AnalysisHistoryPage = {
  total: number;
  skip: number;
  limit: number;
  records: AnalysisRecord[];
  error: string | null;
};

export type AnalysisRecordLookup = {
  record: AnalysisRecord | null;
  error: string | null;
};

type JsonObject = Record<string, unknown>;

function isObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null;
}

function parseStats(value: unknown): AnalysisStats | null {
  if (!isObject(value) || typeof value.total_analyses !== "number") {
    return null;
  }

  const distribution = Array.isArray(value.verdict_distribution)
    ? value.verdict_distribution.flatMap((entry) => {
        if (!isObject(entry) || typeof entry.verdict !== "string" || typeof entry.count !== "number") return [];
        return [{ verdict: entry.verdict, count: entry.count }];
      })
    : [];
  const postureDistribution = Array.isArray(value.cryptographic_posture_distribution)
    ? value.cryptographic_posture_distribution.flatMap((entry) => {
        if (!isObject(entry) || typeof entry.posture !== "string" || typeof entry.count !== "number") return [];
        return [{ posture: entry.posture, count: entry.count }];
      })
    : [];

  return {
    total_analyses: value.total_analyses,
    flagged_sessions: typeof value.flagged_sessions === "number" ? value.flagged_sessions : null,
    evidence_archived: typeof value.evidence_archived === "number" ? value.evidence_archived : null,
    avg_risk_score: typeof value.avg_risk_score === "number" ? value.avg_risk_score : null,
    verdict_distribution: distribution,
    cryptographic_posture_distribution: postureDistribution,
    total_validations: typeof value.total_validations === "number" ? value.total_validations : 0,
    validation_pass_rate: typeof value.validation_pass_rate === "number" ? value.validation_pass_rate : null,
  };
}

function parseAnalysisRecord(value: unknown): AnalysisRecord | null {
  if (
    !isObject(value) ||
    typeof value.id !== "number" ||
    typeof value.request_id !== "string" ||
    typeof value.session_id !== "string" ||
    typeof value.timestamp !== "string" ||
    typeof value.risk_score !== "number" ||
    typeof value.final_verdict !== "string"
  ) {
    return null;
  }

  return {
    id: value.id,
    request_id: value.request_id,
    session_id: value.session_id,
    client_id: typeof value.client_id === "string" ? value.client_id : null,
    capture_id: typeof value.capture_id === "string" ? value.capture_id : null,
    protocol: typeof value.protocol === "string" ? value.protocol : null,
    posture: typeof value.posture === "string" ? value.posture : null,
    timestamp: value.timestamp,
    evidence_ref_count:
      typeof value.evidence_ref_count === "number" ? value.evidence_ref_count : 0,
    risk_score: value.risk_score,
    final_verdict: value.final_verdict,
    rule_score: typeof value.rule_score === "number" ? value.rule_score : null,
    rule_triggers_count:
      typeof value.rule_triggers_count === "number" ? value.rule_triggers_count : 0,
    trigger_details: Array.isArray(value.trigger_details) ? value.trigger_details : [],
    ml_scores: isObject(value.ml_scores) ? value.ml_scores : {},
    explanations: isObject(value.explanations) ? value.explanations : {},
    model_bundle: isObject(value.model_bundle) ? value.model_bundle : {},
    is_synthetic: value.is_synthetic === true,
    source_label: typeof value.source_label === "string" ? value.source_label : null,
  };
}

function parseRecords(value: unknown): AnalysisRecord[] {
  if (!isObject(value) || !Array.isArray(value.records)) return [];
  return value.records.flatMap((entry) => {
    const record = parseAnalysisRecord(entry);
    return record ? [record] : [];
  });
}

function parseAnalysisHistoryPage(value: unknown): Omit<AnalysisHistoryPage, "error"> | null {
  if (
    !isObject(value) ||
    typeof value.total !== "number" ||
    typeof value.skip !== "number" ||
    typeof value.limit !== "number" ||
    !Array.isArray(value.records)
  ) {
    return null;
  }

  return {
    total: value.total,
    skip: value.skip,
    limit: value.limit,
    records: parseRecords(value),
  };
}

function parseHealth(value: unknown): HealthResponse | null {
  if (
    !isObject(value) ||
    typeof value.status !== "string" ||
    typeof value.bundle_loaded !== "boolean" ||
    typeof value.calibration_loaded !== "boolean" ||
    !Array.isArray(value.model_names)
  ) {
    return null;
  }

  return {
    status: value.status,
    bundle_loaded: value.bundle_loaded,
    bundle_version:
      typeof value.bundle_version === "string" ? value.bundle_version : null,
    calibration_loaded: value.calibration_loaded,
    model_names: value.model_names.filter(
      (model): model is string => typeof model === "string",
    ),
  };
}

async function getJson(path: string): Promise<unknown> {
  const baseUrl = process.env.SECUREMAILSCOPE_API_URL?.replace(/\/+$/, "");
  const apiKey = process.env.SECUREMAILSCOPE_API_KEY;

  if (!baseUrl || !apiKey) {
    throw new Error("SecureMail API environment is not configured");
  }

  const response = await fetch(`${baseUrl}/${path.replace(/^\/+/, "")}`, {
    headers: {
      accept: "application/json",
      Authorization: apiKey,
    },
    next: {
      revalidate: LIVE_DATA_CACHE_SECONDS,
      tags: [SECUREMAIL_CACHE_TAG],
    },
    signal: AbortSignal.timeout(5000),
  });

  if (!response.ok) {
    throw new Error(`SecureMail API returned ${response.status}`);
  }

  return response.json();
}

export async function getAnalysisHistory({
  skip = 0,
  limit = 10,
}: {
  skip?: number;
  limit?: number;
} = {}): Promise<AnalysisHistoryPage> {
  const safeSkip = Math.max(0, Math.floor(skip));
  const safeLimit = Math.min(200, Math.max(1, Math.floor(limit)));

  try {
    const payload = await getJson(
      `analyses?skip=${safeSkip}&limit=${safeLimit}`,
    );
    const parsed = parseAnalysisHistoryPage(payload);

    if (!parsed) {
      throw new Error("SecureMail API returned an invalid analyses page");
    }

    return { ...parsed, error: null };
  } catch (error) {
    return {
      total: 0,
      skip: safeSkip,
      limit: safeLimit,
      records: [],
      error: error instanceof Error ? error.message : "Unknown API error",
    };
  }
}

export async function getAnalysisByRequestId(
  requestId: string,
): Promise<AnalysisRecordLookup> {
  const safeRequestId = requestId.trim();
  if (!safeRequestId) {
    return { record: null, error: "Analysis request ID is missing" };
  }

  try {
    const payload = await getJson(`analyses/${encodeURIComponent(safeRequestId)}`);
    const record = parseAnalysisRecord(payload);
    if (!record) throw new Error("SecureMail API returned an invalid analysis record");
    return { record, error: null };
  } catch (error) {
    return {
      record: null,
      error: error instanceof Error ? error.message : "Unknown API error",
    };
  }
}

const DASHBOARD_RECORD_PAGE_SIZE = 200;
const MAX_DASHBOARD_SCORE_RECORDS = 10_000;

async function getDashboardRecords(filter: string) {
  const records: AnalysisRecord[] = [];
  let skip = 0;
  let total = 0;

  do {
    const parsed = parseAnalysisHistoryPage(
      await getJson(`analyses?skip=${skip}&limit=${DASHBOARD_RECORD_PAGE_SIZE}${filter}`),
    );
    if (!parsed || parsed.limit < 1) {
      throw new Error("SecureMail API returned an invalid analyses page");
    }
    if (parsed.total > MAX_DASHBOARD_SCORE_RECORDS) {
      throw new Error("SecureMail API returned too many analysis records for this dashboard");
    }
    if (parsed.records.length === 0 && parsed.total > skip) {
      throw new Error("SecureMail API returned an incomplete analyses page");
    }

    records.push(...parsed.records);
    total = parsed.total;
    skip += parsed.limit;
  } while (skip < total);

  return records;
}

export async function getDashboardApiData({
  range,
  includeRiskDistribution = true,
}: {
  range?: "7d" | "30d";
  includeRiskDistribution?: boolean;
} = {}): Promise<DashboardApiData> {
  const cacheWindowStart =
    Math.floor(Date.now() / (LIVE_DATA_CACHE_SECONDS * 1000)) *
    LIVE_DATA_CACHE_SECONDS *
    1000;
  const from = range
    ? new Date(cacheWindowStart - (range === "7d" ? 7 : 30) * 86_400_000).toISOString()
    : null;
  const filter = from ? `&from=${encodeURIComponent(from)}` : "";
  const recordsRequest = includeRiskDistribution
    ? getDashboardRecords(filter)
    : getJson(`analyses?limit=5${filter}`).then(parseRecords);
  const [statsResult, recordsResult, healthResult] = await Promise.allSettled([
    getJson(`analyses/stats${from ? `?from=${encodeURIComponent(from)}` : ""}`),
    recordsRequest,
    getJson("health"),
  ]);

  const stats =
    statsResult.status === "fulfilled" ? parseStats(statsResult.value) : null;
  const allRecords =
    recordsResult.status === "fulfilled" ? recordsResult.value : [];
  const records = allRecords.slice(0, 5);
  const riskDistribution = includeRiskDistribution && recordsResult.status === "fulfilled"
    ? riskScoreDistribution(allRecords)
    : null;
  const health =
    healthResult.status === "fulfilled" ? parseHealth(healthResult.value) : null;

  const errors = [statsResult, recordsResult, healthResult]
    .filter(
      (result): result is PromiseRejectedResult => result.status === "rejected",
    )
    .map((result) =>
      result.reason instanceof Error ? result.reason.message : "Unknown API error",
    );

  if (!stats && !records.length && !health) {
    return {
      stats: null,
      records: [],
      risk_distribution: riskDistribution,
      health: null,
      error: errors[0] ?? "SecureMail API returned an invalid response",
    };
  }

  return {
    stats,
    records,
    risk_distribution: riskDistribution,
    health,
    error: errors.length > 0 ? "Some SecureMail API data is unavailable" : null,
  };
}
