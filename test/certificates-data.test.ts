import test from "node:test";
import assert from "node:assert/strict";
import { buildCertificatesSummary } from "../lib/certificates-data.ts";
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
  };
}

test("buildCertificatesSummary extracts status counts and certificate chains", () => {
  const records = [
    createMockRecord({ id: 1, trigger_details: ["Expired certificate observed"] }),
    createMockRecord({ id: 2 }),
  ];

  const summary = buildCertificatesSummary(records);
  assert.equal(summary.totalCertificates, 4);
  assert.equal(summary.validCount, 3);
  assert.equal(summary.expiredCount, 1);
  assert.equal(summary.expiringSoonCount, 0);
  assert.equal(summary.invalidCount, 0);

  const expiredCert = summary.certificates.find(c => c.status === "EXPIRED");
  assert.ok(expiredCert);
  assert.equal(expiredCert.isExpired, true);
  assert.ok(expiredCert.chain.length === 3);
  assert.equal(expiredCert.chain[0].level, "root");
  assert.equal(expiredCert.chain[1].level, "intermediate");
  assert.equal(expiredCert.chain[2].level, "leaf");
});
