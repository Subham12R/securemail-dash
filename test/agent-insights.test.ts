import test from "node:test";
import assert from "node:assert/strict";
import {
  buildAgentInsightRequest,
  isAgentInsightRequest,
  parseAgentInsightResponse,
} from "../lib/agent-insights.ts";
import type { AnalysisRecord } from "../lib/securemail-api.ts";

const analysis: AnalysisRecord = {
  id: 10,
  request_id: "req-secops-10",
  session_id: "sess-smtp-99",
  client_id: "client-agent-1",
  capture_id: "mail-traffic.pcap",
  protocol: "SMTP",
  posture: "deprecated",
  timestamp: "2026-09-10T14:30:00Z",
  record_count: 1,
  evidence_ref_count: 4,
  risk_score: 0.825,
  final_verdict: "malicious",
  rule_score: 0.9,
  rule_triggers_count: 2,
  trigger_details: [],
  ml_scores: {},
  explanations: {},
  model_bundle: {},
  tls_details: null,
  certificate_details: null,
  is_synthetic: false,
  source_label: "Analysed PCAP capture",
};

test("buildAgentInsightRequest sends the selected persisted record unchanged", () => {
  const request = buildAgentInsightRequest(
    analysis,
    "Explain the main risk drivers and recommend next steps.",
  );

  assert.deepEqual(request, {
    schema_version: "agent-insight-request.v1",
    analysis,
    section: "risk",
    question: "Explain the main risk drivers and recommend next steps.",
  });
});

test("rejects persisted insight requests without required record fields", () => {
  assert.equal(isAgentInsightRequest({
    schema_version: "agent-insight-request.v1",
    analysis: { ...analysis, record_count: undefined },
    section: "risk",
    question: "Explain the main risk drivers.",
  }), false);

  const { tls_details, ...withoutTlsDetails } = analysis;
  assert.equal(isAgentInsightRequest({
    schema_version: "agent-insight-request.v1",
    analysis: withoutTlsDetails,
    section: "risk",
    question: "Explain the main risk drivers.",
  }), false);
});

test("parseAgentInsightResponse preserves real answers and recommendations", () => {
  const insight = parseAgentInsightResponse({
    schema_version: "agent-insight-response.v1",
    request_id: "req-secops-10",
    status: "complete",
    section: "risk",
    answer: "Certificate validation failed.",
    recommendations: ["Replace the certificate."],
    evidence: [],
    provider: "securemail",
    model: "risk-agent",
    diagnostics: {},
  });

  assert.deepEqual(insight, {
    status: "complete",
    answer: "Certificate validation failed.",
    recommendations: ["Replace the certificate."],
  });
});

test("parseAgentInsightResponse preserves an explicit degraded response", () => {
  const insight = parseAgentInsightResponse({
    schema_version: "agent-insight-response.v1",
    request_id: "req-secops-10",
    status: "unavailable",
    section: "risk",
    answer: null,
    recommendations: [],
    evidence: [],
    provider: null,
    model: null,
    diagnostics: { reason: "provider unavailable" },
  });

  assert.deepEqual(insight, {
    status: "unavailable",
    answer: null,
    recommendations: [],
  });
});
