import AnalysisWorkspace from "@/components/ui/analysis-workspace";
import DashboardTopbar from "@/components/ui/dashboard-topbar";
import {
  getAnalysisByRequestId,
  getDashboardApiData,
} from "@/lib/securemail-api";

type AnalyticsPageProps = {
  searchParams: Promise<{ requestId?: string | string[] }>;
};

export default async function AnalyticsPage({ searchParams }: AnalyticsPageProps) {
  const params = await searchParams;
  const requestId = Array.isArray(params.requestId) ? params.requestId[0] : params.requestId;
  const [dashboard, selected] = await Promise.all([
    getDashboardApiData(),
    requestId ? getAnalysisByRequestId(requestId) : Promise.resolve(null),
  ]);
  const selectedAnalysis = selected?.record ?? null;
  const analysis = requestId ? selectedAnalysis : dashboard.records[0] ?? null;
  const apiError = requestId ? selected?.error ?? null : dashboard.error;

  return (
    <main
      className="h-full min-h-0 min-w-0 flex-1 overflow-y-auto bg-white"
      aria-label="All Analysis page"
    >
      <DashboardTopbar currentPage="All Analysis" showRefresh />
      <AnalysisWorkspace analysis={analysis} apiError={apiError} />
    </main>
  );
}
