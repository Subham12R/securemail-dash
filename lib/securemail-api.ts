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

function parseRecords(value: unknown): AnalysisRecord[] {
  if (!isObject(value) || !Array.isArray(value.records)) return [];

  return value.records.flatMap((entry) => {
    if (
      !isObject(entry) ||
      typeof entry.id !== "number" ||
      typeof entry.request_id !== "string" ||
      typeof entry.session_id !== "string" ||
      typeof entry.timestamp !== "string" ||
      typeof entry.risk_score !== "number" ||
      typeof entry.final_verdict !== "string"
    ) {
      return [];
    }

    return [
      {
        id: entry.id,
        request_id: entry.request_id,
        session_id: entry.session_id,
        client_id: typeof entry.client_id === "string" ? entry.client_id : null,
        capture_id: typeof entry.capture_id === "string" ? entry.capture_id : null,
        protocol: typeof entry.protocol === "string" ? entry.protocol : null,
        posture: typeof entry.posture === "string" ? entry.posture : null,
        timestamp: entry.timestamp,
        evidence_ref_count: typeof entry.evidence_ref_count === "number" ? entry.evidence_ref_count : 0,
        risk_score: entry.risk_score,
        final_verdict: entry.final_verdict,
        rule_score:
          typeof entry.rule_score === "number" ? entry.rule_score : null,
        rule_triggers_count:
          typeof entry.rule_triggers_count === "number"
            ? entry.rule_triggers_count
            : 0,
        trigger_details: Array.isArray(entry.trigger_details)
          ? entry.trigger_details
          : [],
        ml_scores: isObject(entry.ml_scores) ? entry.ml_scores : {},
        explanations: isObject(entry.explanations) ? entry.explanations : {},
        model_bundle: isObject(entry.model_bundle) ? entry.model_bundle : {},
        is_synthetic: entry.is_synthetic === true,
        source_label:
          typeof entry.source_label === "string" ? entry.source_label : null,
      },
    ];
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
    cache: "no-store",
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

export async function getDashboardApiData({
  range,
}: {
  range?: "7d" | "30d";
} = {}): Promise<DashboardApiData> {
  const from = range
    ? new Date(Date.now() - (range === "7d" ? 7 : 30) * 86_400_000).toISOString()
    : null;
  const filter = from ? `&from=${encodeURIComponent(from)}` : "";
  const [statsResult, recordsResult, healthResult] = await Promise.allSettled([
    getJson(`analyses/stats${from ? `?from=${encodeURIComponent(from)}` : ""}`),
    getJson(`analyses?limit=5${filter}`),
    getJson("health"),
  ]);

  const stats =
    statsResult.status === "fulfilled" ? parseStats(statsResult.value) : null;
  const records =
    recordsResult.status === "fulfilled"
      ? parseRecords(recordsResult.value)
      : [];
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
      health: null,
      error: errors[0] ?? "SecureMail API returned an invalid response",
    };
  }

  return {
    stats,
    records,
    health,
    error: errors.length > 0 ? "Some SecureMail API data is unavailable" : null,
  };
}
