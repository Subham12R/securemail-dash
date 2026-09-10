import test from "node:test";
import assert from "node:assert/strict";
import {
  PRICING_TIERS,
  getPricingTier,
  formatTierPrice,
} from "../lib/pricing-plans.ts";

test("Free tier has exactly 1,000 monthly analyses and 1,000 AI predictions", () => {
  const freeTier = getPricingTier("free");
  assert.equal(freeTier.name, "Free");
  assert.equal(freeTier.priceMonthly, 0);
  assert.equal(freeTier.limits.monthlyAnalyses, 1000);
  assert.equal(freeTier.limits.monthlyPredictions, 1000);
  assert.equal(freeTier.limits.dailyAnalyses, 100);
  assert.equal(freeTier.limits.retentionDays, 7);
});

test("Pro tier has 50,000 monthly limits and unlimited daily analyses", () => {
  const proTier = getPricingTier("pro");
  assert.equal(proTier.name, "Pro");
  assert.equal(proTier.priceMonthly, 49);
  assert.equal(proTier.priceAnnualMonthly, 39);
  assert.equal(proTier.limits.monthlyAnalyses, 50000);
  assert.equal(proTier.limits.monthlyPredictions, 50000);
  assert.equal(proTier.limits.dailyAnalyses, null);
  assert.equal(proTier.popular, true);
});

test("formatTierPrice handles monthly and annual billing intervals", () => {
  const freeTier = getPricingTier("free");
  const proTier = getPricingTier("pro");
  const enterpriseTier = getPricingTier("enterprise");

  assert.equal(formatTierPrice(freeTier, "monthly"), "$0");
  assert.equal(formatTierPrice(freeTier, "annual"), "$0");

  assert.equal(formatTierPrice(proTier, "monthly"), "$49");
  assert.equal(formatTierPrice(proTier, "annual"), "$39");

  assert.equal(formatTierPrice(enterpriseTier, "monthly"), "Custom");
  assert.equal(formatTierPrice(enterpriseTier, "annual"), "Custom");
});

test("fallback to free tier if unknown tier id is requested", () => {
  // @ts-expect-error testing invalid tier fallback
  const tier = getPricingTier("unknown");
  assert.equal(tier.id, "free");
});
