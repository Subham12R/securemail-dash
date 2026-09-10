import test from "node:test";
import assert from "node:assert/strict";
import {
  buildAnalysisDetailViewModel,
  type InboxDetailLookup,
} from "../lib/analysis-detail.ts";
import {
  generateInitialGreeting,
  processAiQuery,
} from "../lib/ai-assistant-engine.ts";
import type { AnalysisRecord } from "../lib/securemail-api.ts";

const defaultInboxLookup: InboxDetailLookup = {
  state: "not_found",
  detail: null,
  reason: "No matching Inbox item was returned.",
};

function createTestRecord(overrides: Partial<AnalysisRecord> = {}): AnalysisRecord {
  return {
    id: 10,
    request_id: "req-secops-10",
    session_id: "sess-smtp-99",
    client_id: "client-agent-1",
    capture_id: "mail-traffic.pcap",
    protocol: "SMTP",
    posture: "deprecated",
    timestamp: "2026-09-10T14:30:00Z",
    evidence_ref_count: 4,
    risk_score: 0.825,
    final_verdict: "malicious",
    rule_score: 0.9,
    rule_triggers_count: 2,
    trigger_details: [
      { rule: "weak_cipher", detail: "RC4 stream cipher observed in ClientHello", evidence: "pkt:42" },
      { rule: "expired_cert", detail: "X.509 certificate expired 14 days ago", evidence: "cert:0" },
    ],
    ml_scores: { gradient_boost: { probability: 0.83, predicted_class: "malicious" } },
    explanations: { gradient_boost: [{ feature: "cipher_suite", contribution: 0.45 }] },
    model_bundle: { version: "model-v2.1" },
    is_synthetic: false,
    source_label: "Analysed PCAP capture",
    ...overrides,
  };
}

test("generateInitialGreeting synthesizes session verdict and risk score", () => {
  const vm = buildAnalysisDetailViewModel(createTestRecord(), defaultInboxLookup);
  const greeting = generateInitialGreeting(vm);

  assert.ok(greeting.reply.includes("sess-smtp-99"));
  assert.ok(greeting.reply.includes("MALICIOUS"));
  assert.ok(greeting.reply.includes("82.5%"));
  assert.ok(greeting.reply.includes("SMTP"));
  assert.equal(greeting.activitySteps.length, 3);
  assert.ok(greeting.suggestedPrompts && greeting.suggestedPrompts.length > 0);
});

test("processAiQuery handles risk driver inquiries with technical payloads", async () => {
  const vm = buildAnalysisDetailViewModel(createTestRecord(), defaultInboxLookup);
  const response = await processAiQuery("What are the risk drivers?", vm);

  assert.ok(response.reply.includes("Risk Assessment Breakdown"));
  assert.ok(response.reply.includes("MALICIOUS"));
  assert.ok(response.reply.includes("82.5%"));
  assert.ok(response.technicalPayload);
  assert.ok(response.activitySteps.length >= 2);
});

test("processAiQuery handles TLS and cryptographic posture inquiries", async () => {
  const vm = buildAnalysisDetailViewModel(createTestRecord(), defaultInboxLookup);
  const response = await processAiQuery("Tell me about the TLS handshake and ciphers", vm);

  assert.ok(response.reply.includes("Transport & Cryptographic Posture"));
  assert.ok(response.reply.includes("deprecated"));
  assert.ok(response.reply.includes("SMTP"));
  assert.ok(response.technicalPayload);
});

test("processAiQuery generates structured incident report triage note", async () => {
  const vm = buildAnalysisDetailViewModel(createTestRecord(), defaultInboxLookup);
  const response = await processAiQuery("Draft an incident triage report", vm);

  assert.ok(response.reply.includes("Incident Triage Report"));
  assert.ok(response.reply.includes("req-secops-10"));
  assert.ok(response.reply.includes("sess-smtp-99"));
});
