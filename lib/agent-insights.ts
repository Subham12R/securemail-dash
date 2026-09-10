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

export type AgentStepStatus = "pending" | "in_progress" | "completed";

export type AgentActiveStep = {
  id: string;
  title: string;
  status: AgentStepStatus;
  evidence: string[];
};

export type AgentInsight = {
  status: string;
  answer: string | null;
  recommendations: string[];
  threadId: string | null;
  memoryRevision: number;
  memoryPersisted: boolean | null;
  activeStep: AgentActiveStep | null;
  diagnostics: JsonObject;
};

type JsonObject = Record<string, unknown>;

function isObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isSection(value: unknown): value is AgentInsightSection {
  return typeof value === "string" && AGENT_INSIGHT_SECTIONS.includes(value as AgentInsightSection);
}

const AGENT_STEP_STATUSES = ["pending", "in_progress", "completed"] as const;

function parseActiveStep(value: unknown): AgentActiveStep | null {
  if (value === null) return null;
  if (!isObject(value) || typeof value.id !== "string" || typeof value.title !== "string") {
    return null;
  }
  if (!AGENT_STEP_STATUSES.includes(value.status as AgentStepStatus)) return null;

  return {
    id: value.id,
    title: value.title,
    status: value.status as AgentStepStatus,
    evidence: Array.isArray(value.evidence)
      ? value.evidence.filter((item): item is string => typeof item === "string").slice(0, 12)
      : [],
  };
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

  const activeStep = value.active_step === undefined ? null : parseActiveStep(value.active_step);
  if (value.active_step !== undefined && value.active_step !== null && activeStep === null) return null;

  return {
    status: value.status,
    answer: typeof value.answer === "string" ? value.answer.trim() || null : null,
    recommendations: value.recommendations
      .filter((recommendation): recommendation is string => typeof recommendation === "string")
      .map((recommendation) => recommendation.trim())
      .filter(Boolean)
      .slice(0, 12),
    threadId: typeof value.thread_id === "string" ? value.thread_id : null,
    memoryRevision: typeof value.memory_revision === "number" && Number.isSafeInteger(value.memory_revision)
      ? value.memory_revision
      : 0,
    memoryPersisted: typeof value.memory_persisted === "boolean" ? value.memory_persisted : null,
    activeStep,
    diagnostics: isObject(value.diagnostics) ? value.diagnostics : {},
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
