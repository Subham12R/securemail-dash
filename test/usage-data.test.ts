import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateUsagePercentage,
  getUsageSeverity,
  DEFAULT_USAGE_SECTIONS,
} from "../lib/usage-data.ts";

test("calculateUsagePercentage computes accurate percentages within bounds", () => {
  assert.equal(calculateUsagePercentage(388, 1000), 38.8);
  assert.equal(calculateUsagePercentage(0, 1000), 0);
  assert.equal(calculateUsagePercentage(1000, 1000), 100);
  assert.equal(calculateUsagePercentage(1200, 1000), 100); // capped at 100
  assert.equal(calculateUsagePercentage(10, null), 0); // null limit returns 0
  assert.equal(calculateUsagePercentage(10, 0), 0);
});

test("getUsageSeverity flags severity thresholds correctly", () => {
  assert.equal(getUsageSeverity(38.8), "normal");
  assert.equal(getUsageSeverity(79.9), "normal");
  assert.equal(getUsageSeverity(80.0), "warning");
  assert.equal(getUsageSeverity(95.0), "warning");
  assert.equal(getUsageSeverity(100.0), "critical");
  assert.equal(getUsageSeverity(110.0), "critical");
});

test("DEFAULT_USAGE_SECTIONS contains Mail Analysis and AI Risk Prediction sections", () => {
  assert.equal(DEFAULT_USAGE_SECTIONS.length, 2);

  const mailSection = DEFAULT_USAGE_SECTIONS.find((s) => s.id === "mail-analysis");
  assert.ok(mailSection);
  assert.equal(mailSection.title, "Mail Analysis");
  assert.equal(mailSection.tierName, "Free");

  const monthlyMetric = mailSection.metrics.find((m) => m.id === "monthly-analysis");
  assert.ok(monthlyMetric);
  assert.equal(monthlyMetric.used, 388);
  assert.equal(monthlyMetric.limit, 1000);

  const aiSection = DEFAULT_USAGE_SECTIONS.find((s) => s.id === "ai-prediction");
  assert.ok(aiSection);
  assert.equal(aiSection.title, "AI Risk Prediction");
  assert.equal(aiSection.tierName, "Free");
});
