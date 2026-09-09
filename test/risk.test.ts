import test from "node:test";
import assert from "node:assert/strict";
import {
  riskScoreBarClass,
  riskBandForScore,
  riskScoreDistribution,
} from "../lib/risk.ts";

test("maps risk score bands to severity colors", () => {
  assert.equal(riskScoreBarClass(0.2), "bg-emerald-500");
  assert.equal(riskScoreBarClass(0.5), "bg-yellow-400");
  assert.equal(riskScoreBarClass(0.7), "bg-orange-500");
  assert.equal(riskScoreBarClass(0.9), "bg-red-600");
  assert.equal(riskScoreBarClass(null), "bg-zinc-300");
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
