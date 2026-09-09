import {
  Activity,
  Archive,
  Gauge,
  ShieldAlert,
} from "lucide-react";
import DashboardTopbar from "@/components/ui/dashboard-topbar";
import OverviewCharts from "@/components/ui/overview-charts";
import RecentAnalysisTable, {
  type RecentAnalysis,
} from "@/components/ui/recent-analysis-table";
import FooterWatermark from "@/components/ui/footer";
import { MorphingText } from "@/components/ui/morphing-text";
import { getDashboardApiData } from "@/lib/securemail-api";

function formatNumber(value: number | null | undefined) {
  return value === null || value === undefined ? "Unavailable" : value.toLocaleString("en-US");
}

function formatRiskScore(value: number | null | undefined) {
  return value === null || value === undefined
    ? "Unavailable"
    : `${(value * 100).toFixed(1)}%`;
}

function formatVerdict(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export default async function HomePage({ range }: { range: "all" | "7d" | "30d" }) {
  const dashboard = await getDashboardApiData({
    range: range === "all" ? undefined : range,
  });
  const stats = dashboard.stats;
  const metrics = [
    {
      label: "Sessions analysed",
      value: formatNumber(stats?.total_analyses),
      description: "Persisted analysis records",
      icon: Activity,
      iconClassName: "text-zinc-500",
    },
    {
      label: "Flagged sessions",
      value: formatNumber(stats?.flagged_sessions),
      description: "Rule-backed or high/critical persisted analyses",
      icon: ShieldAlert,
      iconClassName: "text-red-600",
    },
    {
      label: "Average risk score",
      value: formatRiskScore(stats?.avg_risk_score),
      description: "API aggregate across analyses",
      icon: Gauge,
      iconClassName: "text-amber-600",
    },
    {
      label: "Evidence archived",
      value: formatNumber(stats?.evidence_archived),
      description: "Evidence references retained with analyses",
      icon: Archive,
      iconClassName: "text-zinc-500",
    },
  ];
  const recentAnalyses: RecentAnalysis[] = dashboard.records.map((record) => ({
    captureId: record.capture_id ?? record.client_id ?? record.session_id,
    sessionId: record.session_id,
    date: record.timestamp,
    protocols: record.protocol ? [record.protocol] : [],
    riskScore: record.risk_score,
    status: formatVerdict(record.final_verdict),
  }));
  const apiReturnedNoAnalyses = stats?.total_analyses === 0;

  return (
    <main
      className="h-full min-h-0 min-w-0 flex-1 overflow-y-auto bg-white"
      aria-label="Main content"
    >
      <DashboardTopbar currentPage="Overview" showDateRange showRefresh range={range} />

      <section aria-labelledby="metrics-heading" className="space-y-4 p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1
              id="metrics-heading"
              className="text-lg font-semibold tracking-tighter text-zinc-900"
            >
              Overview
            </h1>

          </div>
        </div>

        {dashboard.error || apiReturnedNoAnalyses ? (
          <div
            role="status"
            className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
          >
            {dashboard.error
              ? `${dashboard.error}. Values not returned by the API remain unavailable.`
              : "SecureMail API connected, but no analyses have been persisted yet."}
          </div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => {
            const Icon = metric.icon;

            return (
              <article
                key={metric.label}
                className="rounded-lg border-2 border-neutral-200 bg-white p-5 shadow-[inset_0px_0px_2px_2px_rgba(0,0,0,0.05)]"
              >
                <div className="flex items-start justify-between gap-4">
                  <p className="text-sm font-medium tracking-tighter text-zinc-600">
                    {metric.label}
                  </p>
                  <Icon
                    aria-hidden="true"
                    className={`size-4 shrink-0 ${metric.iconClassName}`}
                  />
                </div>
                <p
                  className={`mt-4 font-semibold tracking-tighter text-zinc-900 ${metric.value.length > 9 ? "text-xl" : "text-4xl"}`}
                >
                  <MorphingText>{metric.value}</MorphingText>
                </p>
                <p className="mt-1 text-xs tracking-tighter text-zinc-500">
                  {metric.description}
                </p>
              </article>
            );
          })}
        </div>
      </section>

      <OverviewCharts
        verdictDistribution={stats?.verdict_distribution ?? []}
        postureDistribution={stats?.cryptographic_posture_distribution ?? []}
      />
      <RecentAnalysisTable analyses={recentAnalyses} />
      <FooterWatermark />
    </main>
  );
}
