import test from "node:test";
import assert from "node:assert/strict";
import { buildFindingsSummary } from "../lib/findings-data.ts";
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

test("buildFindingsSummary aggregates severity and counts correctly", () => {
  const records = [
    createMockRecord({ id: 1, posture: "deprecated", risk_score: 0.85 }),
    createMockRecord({ id: 2, posture: "weak", risk_score: 0.65 }),
    createMockRecord({ id: 3, final_verdict: "suspicious" }),
  ];

  const summary = buildFindingsSummary(records);
  assert.equal(summary.totalFindings, 6);
  assert.ok(summary.openCount > 0);
  assert.ok(summary.highCriticalCount > 0);

  const depTls = summary.findings.find(f => f.id === "find-dep-tls");
  assert.ok(depTls);
  assert.equal(depTls.severity, "HIGH");
  assert.ok(depTls.affectedSessionsCount > 0);
});
