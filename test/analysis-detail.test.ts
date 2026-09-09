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

test("bounds nested analysis values and records absent model values", () => {
  const secret = "raw-secret-should-be-bounded-".repeat(100);
  const view = buildAnalysisDetailViewModel(
    record({
      ml_scores: {
        model: {
          secret,
          deep: { one: { two: { three: { four: "too deep" } } } },
        },
      },
      explanations: {},
      model_bundle: {},
      trigger_details: [],
    }),
    { state: "not_found", detail: null, reason: "No matching Inbox item was returned." },
  );

  assert.equal(view.source, "analysed_pcap");
  assert.equal(view.model.missing_fields.includes("explanations"), true);
  assert.equal(view.model.missing_fields.includes("model_bundle"), true);
  assert.equal(JSON.stringify(view).includes(secret), false);
  assert.equal(view.model.scores.some((entry) => entry.value.length <= 512), true);
  assert.equal(view.model.scores.some((entry) => entry.path.includes("four")), false);
});
