import test from "node:test";
import assert from "node:assert/strict";
import { buildProtocolSummaries } from "../lib/protocols-data.ts";
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

test("buildProtocolSummaries correctly segments SMTP, IMAP, POP3", () => {
  const records: AnalysisRecord[] = [
    createMockRecord({ id: 1, protocol: "SMTP", posture: "modern" }),
    createMockRecord({ id: 2, protocol: "SMTP", posture: "deprecated" }),
    createMockRecord({ id: 3, protocol: "IMAP", posture: "adequate" }),
    createMockRecord({ id: 4, protocol: "POP3", posture: "weak" }),
  ];

  const summaries = buildProtocolSummaries(records);
  assert.equal(summaries.length, 3);

  const smtp = summaries.find(s => s.protocol === "SMTP");
  const imap = summaries.find(s => s.protocol === "IMAP");
  const pop3 = summaries.find(s => s.protocol === "POP3");

  assert.equal(smtp?.sessionCount, 2);
  assert.equal(smtp?.percentage, 50);
  assert.equal(imap?.sessionCount, 1);
  assert.equal(imap?.percentage, 25);
  assert.equal(pop3?.sessionCount, 1);
  assert.equal(pop3?.percentage, 25);
  assert.deepEqual(smtp?.standardPorts, [25, 587]);
  assert.deepEqual(smtp?.tlsPorts, [465]);
});
