import test from "node:test";
import assert from "node:assert/strict";
import { buildTlsAnalysis } from "../lib/tls-data.ts";
import type { AnalysisRecord } from "../lib/securemail-api.ts";

function createMockRecord(partial: Partial<AnalysisRecord>): AnalysisRecord {
  return {
    id: 1,
    request_id: "req-1",
    session_id: "ses-1",
    client_id: "client-1",
    capture_id: "cap-1",
    protocol: "SMTP",
    posture: "modern",
    timestamp: "2026-09-09T20:00:00Z",
    evidence_ref_count: 0,
    risk_score: 0.1,
    final_verdict: "benign",
    rule_score: null,
    rule_triggers_count: 0,
    trigger_details: [],
    ml_scores: {},
    explanations: {},
    model_bundle: {},
    is_synthetic: false,
    source_label: null,
    ...partial,
    record_count: partial.record_count ?? 1,
    tls_details: partial.tls_details ?? null,
    certificate_details: partial.certificate_details ?? null,
  };
}

test("buildTlsAnalysis aggregates version, PFS, and cipher metrics correctly", () => {
  const records: AnalysisRecord[] = [
    createMockRecord({ id: 1, posture: "modern" }),
    createMockRecord({ id: 2, posture: "adequate" }),
    createMockRecord({ id: 3, posture: "deprecated", trigger_details: ["TLS 1.0 negotiated"] }),
    createMockRecord({ id: 4, posture: "weak", risk_score: 0.8 }),
  ];

  const analysis = buildTlsAnalysis(records);
  assert.equal(analysis.tlsSessionsCount, 4);
  assert.ok(analysis.versions.length >= 2);

  const tls10 = analysis.versions.find(v => v.version === "TLS 1.0");
  assert.ok(tls10);
  assert.equal(tls10.isDeprecated, true);

  assert.ok(analysis.keyExchanges.length >= 2);
  const ecdhe = analysis.keyExchanges.find(k => k.name === "ECDHE");
  const rsa = analysis.keyExchanges.find(k => k.name === "RSA");
  assert.ok(ecdhe);
  assert.ok(rsa);
  assert.equal(ecdhe.status, "modern");
  assert.equal(rsa.status, "legacy");

  assert.ok(analysis.cipherSuites.length > 0);
  assert.ok(analysis.pfsCount > 0);
  assert.ok(analysis.noPfsCount > 0);
});
