import test from "node:test";
import assert from "node:assert/strict";
import {
  analysisSourceLabel,
  buildAnalysisDetailViewModel,
  classifyAnalysisSource,
  formatAnalysisSource,
  historyDetailHref,
} from "../lib/analysis-detail.ts";
import type { AnalysisRecord } from "../lib/securemail-api.ts";

function record(overrides: Partial<AnalysisRecord> = {}): AnalysisRecord {
  return {
    id: 7,
    request_id: "request-7",
    session_id: "session-7",
    client_id: null,
    capture_id: "capture-7.pcap",
    protocol: "SMTP",
    posture: "degraded",
    timestamp: "2026-09-10T12:00:00Z",
    evidence_ref_count: 2,
    risk_score: 0.695,
    final_verdict: "suspicious",
    rule_score: 0.4,
    rule_triggers_count: 1,
    trigger_details: [{ rule: "legacy_tls", evidence: "stream:7" }],
    ml_scores: { xgboost: { probability: 0.7, predicted_class: "suspicious" } },
    explanations: { xgboost: [{ feature: "tls_version", contribution: 0.2 }] },
    model_bundle: { version: "bundle-1" },
    is_synthetic: false,
    source_label: "Analysed PCAP capture",
    ...overrides,
  };
}

test("classifies sources without using risk policy", () => {
  assert.equal(
    classifyAnalysisSource(
      record({
        client_id: "smtp-client-1",
        capture_id: null,
        source_label: "Email client",
      }),
    ),
    "email_client",
  );
  assert.equal(classifyAnalysisSource(record()), "analysed_pcap");
  assert.equal(classifyAnalysisSource(record({ is_synthetic: true })), "synthetic");
  assert.equal(
    classifyAnalysisSource(record({ capture_id: null, source_label: null })),
    "unknown",
  );
  assert.equal(analysisSourceLabel("email_client"), "Email client");
  assert.equal(analysisSourceLabel("analysed_pcap"), "Analysed PCAP capture");
  assert.equal(
    formatAnalysisSource(
      record({ client_id: "mail-client", capture_id: null, source_label: null }),
    ),
    "Email client",
  );
});

test("builds an encoded detail URL only for a bounded request ID", () => {
  assert.equal(historyDetailHref("request/7"), "/history/request%2F7");
  assert.equal(historyDetailHref("  request-7  "), "/history/request-7");
  assert.equal(historyDetailHref("   "), null);
  assert.equal(historyDetailHref("x".repeat(257)), null);
});

test("normalizes supported analysis output into human-readable metrics", () => {
  const view = buildAnalysisDetailViewModel(
    record({
      model_bundle: { id: "bundle-secret", version: "do-not-display" },
      ml_scores: {
        xgboost: {
          predicted_class: "high",
          risk_probability: 0.75,
          class_probabilities: { high: 1 },
        },
      },
      explanations: {
        supervised: [
          {
            feature: "handshake_success",
            observed_value: false,
            contribution: 1.5115,
            direction: "increases_risk",
            ignored: { raw: "not displayed" },
          },
        ],
      },
      trigger_details: [
        { rule: "legacy_tls", description: "Legacy protocol", evidence: "stream:7" },
      ],
    }),
    { state: "not_found", detail: null, reason: "No matching Inbox item was returned." },
  );

  assert.equal(view.source, "analysed_pcap");
  assert.deepEqual(view.model.evaluations, [
    { model: "XGBoost", prediction: "High", risk_probability: 0.75 },
  ]);
  assert.deepEqual(view.model.risk_drivers, [
    {
      feature: "Handshake Success",
      observed_value: "No",
      contribution: 1.5115,
      direction: "increases_risk",
    },
  ]);
  assert.deepEqual(view.model.rule_findings, [
    {
      label: "Legacy TLS",
      severity: null,
      detail: "Legacy protocol",
      evidence: "stream:7",
      citations: [],
    },
  ]);
  assert.equal(view.summary_text.includes("Suspicious"), true);
  assert.equal(JSON.stringify(view).includes("model_bundle"), false);
  assert.equal(JSON.stringify(view).includes("bundle-secret"), false);
  assert.equal(JSON.stringify(view).includes("not displayed"), false);
});

test("keeps the numeric score band distinct from a higher backend verdict", () => {
  const view = buildAnalysisDetailViewModel(
    record({
      risk_score: 0.432,
      final_verdict: "high",
      trigger_details: [{
        finding_id: "CERT-003",
        severity: "high",
        title: "Invalid certificate chain",
      }],
    }),
    { state: "not_found", detail: null, reason: "No matching Inbox item was returned." },
  );

  assert.equal(view.summary_text.includes("Medium score band"), true);
  assert.equal(view.summary_text.includes("backend final verdict of High"), true);
});

test("preserves ranked backend citations without exposing unknown sources", () => {
  const view = buildAnalysisDetailViewModel(
    record({
      trigger_details: [{
        finding_id: "CERT-003",
        title: "Invalid certificate chain",
        severity: "high",
        citations: [
          "RFC 5280",
          "NIST SP 800-52r2",
          "RFC 5280",
          "https://untrusted.example/source",
          { raw: "ignored" },
        ],
      }],
    }),
    { state: "not_found", detail: null, reason: "No matching Inbox item was returned." },
  );

  assert.deepEqual(view.model.rule_findings[0]?.citations, [
    "RFC 5280",
    "NIST SP 800-52r2",
  ]);
});

test("keeps absent supported metrics explicit without dumping unknown JSON", () => {
  const secret = "raw-secret-should-not-be-exposed";
  const view = buildAnalysisDetailViewModel(
    record({
      ml_scores: { model: { secret } },
      explanations: { unknown_shape: { secret } },
      model_bundle: { id: secret },
      trigger_details: [{ unexpected: { secret } }],
    }),
    { state: "not_found", detail: null, reason: "No matching Inbox item was returned." },
  );

  assert.equal(view.model.evaluations.length, 0);
  assert.equal(view.model.risk_drivers.length, 0);
  assert.equal(view.model.rule_findings.length, 0);
  assert.equal(view.model.missing_fields.includes("ml_scores"), true);
  assert.equal(view.model.missing_fields.includes("explanations"), true);
  assert.equal(view.model.missing_fields.includes("trigger_details"), true);
  assert.equal(JSON.stringify(view).includes(secret), false);
  assert.equal(JSON.stringify(view).includes("model_bundle"), false);
});
