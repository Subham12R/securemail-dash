export type BillingInterval = "monthly" | "annual";

export type TierId = "free" | "pro" | "enterprise";

export interface PricingTierLimits {
  monthlyAnalyses: number | null; // null represents unlimited
  dailyAnalyses: number | null;
  monthlyPredictions: number | null;
  concurrentJobs: number;
  customRules: number | null;
  retentionDays: number;
}

export interface PricingTier {
  id: TierId;
  name: string;
  tagline: string;
  priceMonthly: number;
  priceAnnualMonthly: number;
  popular?: boolean;
  limits: PricingTierLimits;
  features: string[];
  ctaLabel: string;
}

export const PRICING_TIERS: PricingTier[] = [
  {
    id: "free",
    name: "Free",
    tagline: "For developers and individual security researchers.",
    priceMonthly: 0,
    priceAnnualMonthly: 0,
    limits: {
      monthlyAnalyses: 1000,
      dailyAnalyses: 100,
      monthlyPredictions: 1000,
      concurrentJobs: 2,
      customRules: 3,
      retentionDays: 7,
    },
    features: [
      "1,000 email analyses / month",
      "100 daily analysis burst cap",
      "1,000 AI risk predictions / month",
      "SMTP, IMAP, and POP3 protocol analysis",
      "7-day forensic evidence retention",
      "2 concurrent capture ingestion jobs",
      "1 team member",
    ],
    ctaLabel: "Current Plan",
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "For active SecOps engineers and growing security teams.",
    priceMonthly: 49,
    priceAnnualMonthly: 39,
    popular: true,
    limits: {
      monthlyAnalyses: 50000,
      dailyAnalyses: null,
      monthlyPredictions: 50000,
      concurrentJobs: 10,
      customRules: 25,
      retentionDays: 90,
    },
    features: [
      "50,000 email analyses / month",
      "Unlimited daily analyses",
      "50,000 AI risk predictions / month",
      "Full TLS 1.2/1.3 & cipher suite inspection",
      "90-day forensic evidence retention",
      "10 concurrent capture ingestion jobs",
      "Exportable PCAP stream & cert bundles",
      "Up to 25 custom rule overrides",
      "Priority worker processing queue",
      "Up to 5 team members",
    ],
    ctaLabel: "Upgrade to Pro",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    tagline: "For organizations requiring custom compliance and dedicated scale.",
    priceMonthly: 299,
    priceAnnualMonthly: 249,
    limits: {
      monthlyAnalyses: null,
      dailyAnalyses: null,
      monthlyPredictions: null,
      concurrentJobs: 50,
      customRules: null,
      retentionDays: 365,
    },
    features: [
      "Unlimited email analyses & AI predictions",
      "Dedicated capture worker cluster",
      "1-year+ retention or custom S3 export",
      "Custom RFC rules & fine-tuned LLM scoring",
      "Unlimited team seats + SSO/SAML",
      "SOC2 / HIPAA compliance audit trails",
      "99.9% uptime SLA & dedicated Slack",
    ],
    ctaLabel: "Contact Sales",
  },
];

export function getPricingTier(id: TierId): PricingTier {
  const found = PRICING_TIERS.find((t) => t.id === id);
  if (!found) {
    return PRICING_TIERS[0];
  }
  return found;
}

export function formatTierPrice(tier: PricingTier, interval: BillingInterval): string {
  if (tier.id === "enterprise") {
    return "Custom";
  }
  if (tier.priceMonthly === 0) {
    return "$0";
  }
  const amount = interval === "annual" ? tier.priceAnnualMonthly : tier.priceMonthly;
  return `$${amount}`;
}
