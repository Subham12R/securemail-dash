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
import { getDashboardApiData } from "@/lib/securemail-api";
import { analysisStatusLabel } from "@/lib/risk";

import { ViewTransition } from "react";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { getCurrentUser } from "@/lib/auth-server";
import { redirect } from "next/navigation";

export default async function HomePage({ range }: { range: "all" | "7d" | "30d" }) {
  const dashboard = await getDashboardApiData({
    range: range === "all" ? undefined : range,
  });
  const stats = dashboard.stats;
  const metrics = [
    {
      label: "Sessions analysed",
      value: stats?.total_analyses ?? null,
      mode: "count" as const,
      description: "Persisted analysis records",
      icon: Activity,
      iconClassName: "text-zinc-500",
    },
    {
      label: "Flagged sessions",
      value: stats?.flagged_sessions ?? null,
      mode: "count" as const,
      description: "Rule-backed or high/critical persisted analyses",
      icon: ShieldAlert,
      iconClassName: "text-red-600",
    },
    {
      label: "Average risk score",
      value: stats?.avg_risk_score == null ? null : stats.avg_risk_score * 100,
      mode: "percent" as const,
      description: "API aggregate across analyses",
      icon: Gauge,
      iconClassName: "text-amber-600",
    },
    {
      label: "Evidence archived",
      value: stats?.evidence_archived ?? null,
      mode: "count" as const,
      description: "Evidence references retained with analyses",
      icon: Archive,
      iconClassName: "text-zinc-500",
    },
  ];
  const recentAnalyses: RecentAnalysis[] = dashboard.records.map((record) => ({
    requestId: record.request_id,
    captureId: record.capture_id ?? record.client_id ?? record.session_id,
    sessionId: record.session_id,
    date: record.timestamp,
    protocols: record.protocol ? [record.protocol] : [],
    riskScore: record.risk_score,
    status: analysisStatusLabel(record.final_verdict),
  }));
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return (
    <ViewTransition enter="page-enter" exit="page-exit" default="none">
      <main
        className="h-full min-h-0 min-w-0 flex-1 overflow-y-auto bg-white"
        aria-label="Main content"
      >
        <DashboardTopbar currentPage="Overview" showDateRange showRefresh range={range} />

      <section aria-labelledby="metrics-heading" className="space-y-4 p-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tighter text-zinc-900">Welcome back, <span className="text-amber-500 italic">{user.display_name}</span></h1>
          <p className="text-2xl font-bold tracking-tighter text-zinc-400">Here's a quick overview of your analysis activity. Don't worry we got you covered.</p>
        </div>
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


        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric, index) => {
            const Icon = metric.icon;

            return (
              <article
                key={metric.label}
                style={{ animationDelay: `${index * 60}ms` }}
                className="animate-reveal group rounded-lg border-2 border-neutral-200 bg-white  p-5 shadow-[inset_0px_0px_2px_2px_rgba(0,0,0,0.05)] transition-all duration-200 motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-4">
                  <p className="text-sm font-medium tracking-tighter text-zinc-600 transition-colors group-hover:text-zinc-900">
                    {metric.label}
                  </p>
                  <Icon
                    aria-hidden="true"
                    className={`size-4 shrink-0 transition-transform duration-200 group-hover:scale-110 ${metric.iconClassName}`}
                  />
                </div>
                <p className="mt-4 font-semibold tracking-tighter text-zinc-900 text-4xl">
                  <AnimatedNumber value={metric.value} mode={metric.mode} />
                </p>
                <p className="mt-1 text-xs tracking-tighter text-zinc-500">
                  {metric.description}
                </p>
              </article>
            );
          })}
        </div>
      </section>

        <div className="animate-reveal" style={{ animationDelay: "240ms" }}>
          <OverviewCharts
            riskDistribution={dashboard.risk_distribution ?? []}
            postureDistribution={stats?.cryptographic_posture_distribution ?? []}
          />
        </div>
        <div className="animate-reveal" style={{ animationDelay: "300ms" }}>
          <RecentAnalysisTable analyses={recentAnalyses} />
        </div>
        <FooterWatermark />
      </main>
    </ViewTransition>
  );
}
