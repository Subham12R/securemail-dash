import type { AnalysisRecord } from "./securemail-api.ts";

export const AGENT_INSIGHT_SECTIONS = [
  "overview",
  "risk",
  "tls",
  "certificate",
  "findings",
] as const;

export type AgentInsightSection = (typeof AGENT_INSIGHT_SECTIONS)[number];

export type AgentInsightRequest = {
  schema_version: "agent-insight-request.v1";
  analysis: AnalysisRecord;
  section: AgentInsightSection;
  question: string;
};

export type AgentInsight = {
  status: string;
  answer: string | null;
  recommendations: string[];
};

type JsonObject = Record<string, unknown>;

function isObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isSection(value: unknown): value is AgentInsightSection {
  return typeof value === "string" && AGENT_INSIGHT_SECTIONS.includes(value as AgentInsightSection);
}

function isSupportedAnalysis(value: unknown) {
  if (!isObject(value)) return false;
  if (typeof value.id === "number") {
    return typeof value.request_id === "string" &&
      typeof value.session_id === "string" &&
      typeof value.record_count === "number" &&
      value.record_count >= 0 &&
      Object.hasOwn(value, "tls_details") &&
      Object.hasOwn(value, "certificate_details");
  }
  return typeof value.status === "string" && isObject(value.session) && isObject(value.result);
}

function boundedQuestion(value: string) {
  const question = value.trim();
  if (!question || question.length > 2_000) {
    throw new Error("Insight question must be between 1 and 2,000 characters");
  }
  return question;
}

export function buildAgentInsightRequest(
  analysis: AnalysisRecord,
  question: string,
): AgentInsightRequest {
  return {
    schema_version: "agent-insight-request.v1",
    analysis,
    section: "risk",
    question: boundedQuestion(question),
  };
}

export function isAgentInsightRequest(value: unknown): value is AgentInsightRequest {
  return isObject(value) &&
    value.schema_version === "agent-insight-request.v1" &&
    isSupportedAnalysis(value.analysis) &&
    isSection(value.section) &&
    typeof value.question === "string" &&
    value.question.trim().length > 0 &&
    value.question.length <= 2_000;
}

export function parseAgentInsightResponse(value: unknown): AgentInsight | null {
  if (
    !isObject(value) ||
    value.schema_version !== "agent-insight-response.v1" ||
    typeof value.status !== "string" ||
    !isSection(value.section) ||
    (typeof value.answer !== "string" && value.answer !== null) ||
    !Array.isArray(value.recommendations)
  ) {
    return null;
  }

  return {
    status: value.status,
    answer: typeof value.answer === "string" ? value.answer.trim() || null : null,
    recommendations: value.recommendations
      .filter((recommendation): recommendation is string => typeof recommendation === "string")
      .map((recommendation) => recommendation.trim())
      .filter(Boolean)
      .slice(0, 12),
  };
}

export async function requestRiskInsight(
  analysis: AnalysisRecord,
  question: string,
): Promise<AgentInsight> {
  const response = await fetch("/api/agent/insights", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(buildAgentInsightRequest(analysis, question)),
  });
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const detail = isObject(payload) && typeof payload.detail === "string"
      ? payload.detail
      : `SecureMail agent returned ${response.status}`;
    throw new Error(detail);
  }

  const insight = parseAgentInsightResponse(payload);
  if (!insight) throw new Error("SecureMail agent returned an invalid insight response");
  return insight;
}
