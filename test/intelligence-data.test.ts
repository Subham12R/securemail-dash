import test from "node:test";
import assert from "node:assert/strict";
import { getIntelligenceSummary } from "../lib/intelligence-data.ts";

test("getIntelligenceSummary returns structured AI insights and anomaly assessments", () => {
  const summary = getIntelligenceSummary();
  assert.equal(summary.riskClassification, "MEDIUM");
  assert.equal(summary.modelConfidence, 91);
  assert.equal(summary.anomalousSessions, 4);
  assert.ok(summary.assessments.length >= 2);
  assert.equal(summary.assessments[0].title, "Overall Risk Classification");
  assert.ok(summary.assessments[0].contributingFactors.length > 0);
  assert.ok(summary.assessments[0].recommendation.length > 0);
});
