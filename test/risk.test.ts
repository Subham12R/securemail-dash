import test from "node:test";
import assert from "node:assert/strict";
import {
  riskScoreBarClass,
  riskBandForScore,
  riskScoreDistribution,
  riskScoreSegmentCount,
  analysisStatusForVerdict,
  analysisStatusLabel,
} from "../lib/risk.ts";

test("maps risk score bands to severity colors", () => {
  assert.equal(riskScoreBarClass(0.2), "bg-emerald-500");
  assert.equal(riskScoreBarClass(0.5), "bg-yellow-400");
  assert.equal(riskScoreBarClass(0.7), "bg-orange-500");
  assert.equal(riskScoreBarClass(0.9), "bg-red-600");
  assert.equal(riskScoreBarClass(null), "bg-zinc-300");
});

test("maps backend verdicts to one detail status", () => {
  assert.equal(analysisStatusForVerdict("benign"), "healthy");
  assert.equal(analysisStatusForVerdict("informational"), "healthy");
  assert.equal(analysisStatusForVerdict("low"), "healthy");
  assert.equal(analysisStatusForVerdict("suspicious"), "medium");
  assert.equal(analysisStatusForVerdict("medium"), "medium");
  assert.equal(analysisStatusForVerdict("malicious"), "high");
  assert.equal(analysisStatusForVerdict("high"), "high");
  assert.equal(analysisStatusForVerdict("critical"), "critical");
  assert.equal(analysisStatusForVerdict("unknown"), "unknown");
  assert.equal(analysisStatusForVerdict(null), "unknown");
  assert.equal(analysisStatusLabel("benign"), "Healthy");
  assert.equal(analysisStatusLabel("suspicious"), "Medium");
  assert.equal(analysisStatusLabel("malicious"), "High");
  assert.equal(analysisStatusLabel("critical"), "Critical");
  assert.equal(analysisStatusLabel(null), "Not supplied");
});

test("maps normalized scores to risk bands at policy boundaries", () => {
  assert.equal(riskBandForScore(0), "informational");
  assert.equal(riskBandForScore(0.1249), "informational");
  assert.equal(riskBandForScore(0.125), "low");
  assert.equal(riskBandForScore(0.375), "medium");
  assert.equal(riskBandForScore(0.625), "high");
  assert.equal(riskBandForScore(0.875), "critical");
  assert.equal(riskBandForScore(null), null);
  assert.equal(riskBandForScore(1.1), null);
});

test("builds a complete score-band distribution", () => {
  assert.deepEqual(
    riskScoreDistribution([
      { risk_score: 0.2 },
      { risk_score: 0.43 },
      { risk_score: 0.7 },
      { risk_score: 0.9 },
    ]),
    [
      { band: "informational", count: 0 },
      { band: "low", count: 1 },
      { band: "medium", count: 1 },
      { band: "high", count: 1 },
      { band: "critical", count: 1 },
    ],
  );
});

test("maps normalized scores to segment count", () => {
  assert.equal(riskScoreSegmentCount(null), 0);
  assert.equal(riskScoreSegmentCount(Number.NaN), 0);
  assert.equal(riskScoreSegmentCount(-0.1), 0);
  assert.equal(riskScoreSegmentCount(0), 0);
  assert.equal(riskScoreSegmentCount(0.05), 1);
  assert.equal(riskScoreSegmentCount(0.1), 2);
  assert.equal(riskScoreSegmentCount(0.2), 4);
  assert.equal(riskScoreSegmentCount(0.5), 9);
  assert.equal(riskScoreSegmentCount(0.711), 13);
  assert.equal(riskScoreSegmentCount(0.875), 16);
  assert.equal(riskScoreSegmentCount(1.0), 18);
});

