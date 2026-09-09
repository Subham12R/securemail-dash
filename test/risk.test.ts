import test from "node:test";
import assert from "node:assert/strict";
import { riskScoreBarClass } from "../lib/risk.ts";

test("maps risk score bands to severity colors", () => {
  assert.equal(riskScoreBarClass(0.2), "bg-emerald-500");
  assert.equal(riskScoreBarClass(0.5), "bg-yellow-400");
  assert.equal(riskScoreBarClass(0.7), "bg-orange-500");
  assert.equal(riskScoreBarClass(0.9), "bg-red-600");
  assert.equal(riskScoreBarClass(null), "bg-zinc-300");
});
