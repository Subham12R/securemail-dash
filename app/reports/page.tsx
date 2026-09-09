import { ViewTransition } from "react";
import DashboardTopbar from "@/components/ui/dashboard-topbar";
import ReportsView from "@/components/ui/reports-view";

export const metadata = {
  title: "Reports | SecureMailScope",
  description: "Generated analysis reports, forensic exports, and executive audit documentation.",
};

export default function ReportsPage() {
  return (
    <ViewTransition enter="page-enter" exit="page-exit" default="none">
      <main
        className="h-full min-h-0 min-w-0 flex-1 overflow-y-auto bg-white dark-soc:bg-[#111111]"
        aria-label="Reports management"
      >
        <DashboardTopbar currentPage="Reports" showRefresh />
        <ReportsView />
      </main>
    </ViewTransition>
  );
}
