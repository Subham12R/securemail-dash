export interface UsageMetric {
  id: string;
  label: string;
  used: number;
  limit: number | null; // null for unlimited or fixed duration
  unit?: string;
  displayValue?: string; // custom display like "7 days" or "Unlimited"
  details?: string;
}

export interface UsageSection {
  id: string;
  title: string;
  description: string;
  tierName: string;
  metrics: UsageMetric[];
}

export function calculateUsagePercentage(used: number, limit: number | null): number {
  if (limit === null || limit <= 0) {
    return 0;
  }
  const pct = (used / limit) * 100;
  return Math.min(100, Math.max(0, Math.round(pct * 10) / 10));
}

export function getUsageSeverity(percentage: number): "normal" | "warning" | "critical" {
  if (percentage >= 100) {
    return "critical";
  }
  if (percentage >= 80) {
    return "warning";
  }
  return "normal";
}

export const DEFAULT_USAGE_SECTIONS: UsageSection[] = [
  {
    id: "mail-analysis",
    title: "Mail Analysis",
    description: "Inspect SMTP, IMAP, and POP3 packet captures and session security.",
    tierName: "Free",
    metrics: [
      {
        id: "monthly-analysis",
        label: "Monthly limit",
        used: 388,
        limit: 1000,
        details: "388 of 1,000 email sessions analyzed this cycle. Usage counter resets in 18 days.",
      },
      {
        id: "daily-analysis",
        label: "Daily limit",
        used: 11,
        limit: 100,
        details: "11 of 100 daily analysis burst cap consumed. Resets at midnight UTC.",
      },
      {
        id: "concurrent-jobs",
        label: "Concurrent capture jobs",
        used: 1,
        limit: 2,
        details: "1 active server-side PCAP extraction job running.",
      },
    ],
  },
  {
    id: "ai-prediction",
    title: "AI Risk Prediction",
    description: "Advisory ML threat scoring, anomaly detection, and automated heuristic verdict evaluation.",
    tierName: "Free",
    metrics: [
      {
        id: "monthly-predictions",
        label: "Monthly predictions limit",
        used: 0,
        limit: 1000,
        details: "0 of 1,000 automated risk predictions generated this billing cycle.",
      },
      {
        id: "custom-rules",
        label: "Custom detection rules",
        used: 1,
        limit: 3,
        details: "1 of 3 custom security rules deployed in evaluation pipeline.",
      },
      {
        id: "evidence-retention",
        label: "Forensic evidence retention",
        used: 7,
        limit: null,
        displayValue: "7 days",
        details: "Forensic packet headers and certificate proofs retained for 7 days on Free tier.",
      },
    ],
  },
];
