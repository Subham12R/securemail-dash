"use client";

import { useState } from "react";
import { Check, CreditCard, Download, ShieldCheck, Sparkles } from "lucide-react";
import {
  PRICING_TIERS,
  formatTierPrice,
  type BillingInterval,
  type PricingTier,
} from "@/lib/pricing-plans";

export function SettingsBillingTab() {
  const [interval, setInterval] = useState<BillingInterval>("monthly");
  const [activeTierId, setActiveTierId] = useState<string>("free");
  const [upgradingTo, setUpgradingTo] = useState<string | null>(null);

  const handleUpgrade = (tierId: string) => {
    if (tierId === "free") return;
    setUpgradingTo(tierId);
    setTimeout(() => {
      setActiveTierId(tierId);
      setUpgradingTo(null);
    }, 600);
  };

  return (
    <div className="space-y-10">
      {/* Active Subscription Summary */}
      <div className="rounded-lg border-2 border-neutral-200 bg-white p-5 shadow-[inset_0px_0px_2px_2px_rgba(0,0,0,0.05)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Current Plan
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Active
              </span>
            </div>
            <h3 className="mt-1 text-lg font-semibold tracking-tighter text-zinc-900">
              {activeTierId === "free"
                ? "Free Developer Tier"
                : activeTierId === "pro"
                ? "Pro Security Tier"
                : "Enterprise Tier"}
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              1,000 monthly email analyses & 1,000 AI risk predictions included.
              Billing cycle resets in 18 days.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500 font-medium">Billed:</span>
            <div className="inline-flex rounded-lg border border-zinc-200 p-0.5 bg-zinc-50 text-xs">
              <button
                type="button"
                onClick={() => setInterval("monthly")}
                className={`rounded-md px-2.5 py-1 font-medium transition-colors cursor-pointer ${
                  interval === "monthly"
                    ? "bg-white text-zinc-900 shadow-xs"
                    : "text-zinc-600 hover:text-zinc-900"
                }`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setInterval("annual")}
                className={`rounded-md px-2.5 py-1 font-medium transition-colors cursor-pointer ${
                  interval === "annual"
                    ? "bg-white text-zinc-900 shadow-xs"
                    : "text-zinc-600 hover:text-zinc-900"
                }`}
              >
                Annual <span className="text-emerald-600 font-semibold">-20%</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Plan Cards Grid */}
      <div>
        <div className="mb-4">
          <h2 className="text-base font-semibold tracking-tighter text-zinc-900">
            Available Plans
          </h2>
          <p className="text-sm text-zinc-500">
            Upgrade anytime to expand your monthly ingestion volume, custom rules, and retention.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 items-stretch">
          {PRICING_TIERS.map((tier: PricingTier) => {
            const isCurrent = activeTierId === tier.id;
            const isPro = tier.id === "pro";
            const isUpgrading = upgradingTo === tier.id;
            const priceDisplay = formatTierPrice(tier, interval);

            return (
              <div
                key={tier.id}
                className={`relative flex flex-col justify-between rounded-lg border-2 p-6 transition-all ${
                  isCurrent
                    ? "border-zinc-900 bg-white shadow-sm"
                    : isPro
                    ? "border-emerald-600/70 bg-gradient-to-b from-emerald-50/20 to-white shadow-xs"
                    : "border-neutral-200 bg-white shadow-[inset_0px_0px_2px_2px_rgba(0,0,0,0.05)]"
                }`}
              >
                {isPro && !isCurrent && (
                  <div className="absolute -top-3 left-6 inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-0.5 text-xs font-semibold text-white shadow-xs">
                    <Sparkles className="size-3" />
                    Recommended
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between">
                    <h4 className="text-base font-bold tracking-tighter text-zinc-900">
                      {tier.name}
                    </h4>
                    {isCurrent && (
                      <span className="rounded bg-zinc-100 px-2 py-0.5 text-xs font-semibold text-zinc-700">
                        Current
                      </span>
                    )}
                  </div>

                  <p className="mt-1 text-xs text-zinc-500 min-h-8">
                    {tier.tagline}
                  </p>

                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold tracking-tight text-zinc-900">
                      {priceDisplay}
                    </span>
                    {tier.priceMonthly > 0 && (
                      <span className="text-xs text-zinc-500 font-medium">
                        / month {interval === "annual" ? "billed annually" : ""}
                      </span>
                    )}
                  </div>

                  {/* Feature Checklist */}
                  <div className="mt-6 space-y-2.5 border-t border-zinc-100 pt-5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                      What's included:
                    </p>
                    <ul className="space-y-2 text-xs text-zinc-600">
                      {tier.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <Check className="size-3.5 shrink-0 text-emerald-600 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-8 pt-4">
                  <button
                    type="button"
                    disabled={isCurrent || isUpgrading}
                    onClick={() => handleUpgrade(tier.id)}
                    className={`w-full rounded-md py-2 text-xs font-semibold transition-all cursor-pointer ${
                      isCurrent
                        ? "border border-zinc-200 bg-zinc-100 text-zinc-400 cursor-default"
                        : isPro
                        ? "bg-zinc-900 text-white hover:bg-zinc-800 shadow-xs"
                        : "border border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-50"
                    }`}
                  >
                    {isCurrent
                      ? "Current Plan"
                      : isUpgrading
                      ? "Updating..."
                      : tier.ctaLabel}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Payment Method & Invoices Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-zinc-200">
        {/* Payment Method */}
        <div className="rounded-lg border-2 border-neutral-200 bg-white p-5 shadow-[inset_0px_0px_2px_2px_rgba(0,0,0,0.05)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="size-4 text-zinc-500" />
              <h3 className="text-sm font-semibold tracking-tighter text-zinc-900">
                Payment Method
              </h3>
            </div>
            <button
              type="button"
              className="text-xs font-medium text-emerald-600 hover:text-emerald-700 cursor-pointer"
            >
              Add Card
            </button>
          </div>
          <p className="mt-3 text-xs text-zinc-500">
            {activeTierId === "free"
              ? "No payment method required for the Free Developer tier."
              : "Visa ending in 4242 (Expires 12/28)"}
          </p>
        </div>

        {/* Invoices */}
        <div className="rounded-lg border-2 border-neutral-200 bg-white p-5 shadow-[inset_0px_0px_2px_2px_rgba(0,0,0,0.05)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-zinc-500" />
              <h3 className="text-sm font-semibold tracking-tighter text-zinc-900">
                Billing History
              </h3>
            </div>
            <span className="text-xs text-zinc-400">Past 30 days</span>
          </div>

          <div className="mt-3 divide-y divide-zinc-100 text-xs">
            <div className="flex items-center justify-between py-1.5">
              <div>
                <p className="font-medium text-zinc-800">Free Tier Activation</p>
                <p className="text-[11px] text-zinc-400">Aug 24, 2026</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">
                  Paid ($0.00)
                </span>
                <button
                  type="button"
                  title="Download receipt"
                  className="text-zinc-400 hover:text-zinc-700 cursor-pointer"
                >
                  <Download className="size-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
