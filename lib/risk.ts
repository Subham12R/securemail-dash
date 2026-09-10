export const RISK_BANDS = [
  "informational",
  "low",
  "medium",
  "high",
  "critical",
] as const;

export type RiskBand = (typeof RISK_BANDS)[number];

export type AnalysisStatus = "healthy" | "medium" | "high" | "critical" | "unknown";

export type RiskScoreDistribution = {
  band: RiskBand;
  count: number;
};

export function riskBandForScore(score: number | null): RiskBand | null {
  if (score === null || !Number.isFinite(score) || score < 0 || score > 1) {
    return null;
  }
  if (score < 0.125) return "informational";
  if (score < 0.375) return "low";
  if (score < 0.625) return "medium";
  if (score < 0.875) return "high";
  return "critical";
}

export function analysisStatusForVerdict(verdict: string | null | undefined): AnalysisStatus {
  switch (verdict?.trim().toLowerCase()) {
    case "benign":
    case "healthy":
    case "informational":
    case "low":
      return "healthy";
    case "medium":
    case "suspicious":
      return "medium";
    case "high":
    case "malicious":
      return "high";
    case "critical":
      return "critical";
    default:
      return "unknown";
  }
}

export function analysisStatusLabel(verdict: string | null | undefined) {
  switch (analysisStatusForVerdict(verdict)) {
    case "healthy":
      return "Healthy";
    case "medium":
      return "Medium";
    case "high":
      return "High";
    case "critical":
      return "Critical";
    default:
      return "Not supplied";
  }
}

export function riskScoreDistribution(
  records: readonly { risk_score: number }[],
): RiskScoreDistribution[] {
  const counts = new Map<RiskBand, number>(RISK_BANDS.map((band) => [band, 0]));
  let validRecordCount = 0;

  for (const record of records) {
    const band = riskBandForScore(record.risk_score);
    if (band) {
      counts.set(band, (counts.get(band) ?? 0) + 1);
      validRecordCount += 1;
    }
  }

  if (validRecordCount === 0) {
    return [];
  }

  return RISK_BANDS.map((band) => ({ band, count: counts.get(band) ?? 0 }));
}

export function riskScoreBarClass(score: number | null) {
  if (score === null || !Number.isFinite(score)) return "bg-zinc-300";
  if (score >= 0.875) return "bg-red-600";
  if (score >= 0.625) return "bg-orange-500";
  if (score >= 0.375) return "bg-yellow-400";
  return "bg-emerald-500";
}

export function riskScoreSegmentCount(score: number | null, totalSegments: number = 18): number {
  if (score === null || !Number.isFinite(score) || score < 0) return 0;
  if (score === 0) return 0;
  return Math.min(totalSegments, Math.max(1, Math.round(score * totalSegments)));
}


