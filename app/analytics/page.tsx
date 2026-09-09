import AnalysisWorkspace from "@/components/ui/analysis-workspace";
import DashboardTopbar from "@/components/ui/dashboard-topbar";
import { getDashboardApiData } from "@/lib/securemail-api";

export default async function AnalyticsPage() {
  const dashboard = await getDashboardApiData();

  return (
    <main
      className="h-full min-h-0 min-w-0 flex-1 overflow-y-auto bg-white"
      aria-label="Analytics page"
    >
      <DashboardTopbar currentPage="Analytics" />
      <AnalysisWorkspace
        analysis={dashboard.records[0] ?? null}
        apiError={dashboard.error}
      />
    </main>
  );
}
