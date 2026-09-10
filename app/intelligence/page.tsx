import { ViewTransition } from "react";
import DashboardTopbar from "@/components/ui/dashboard-topbar";
import FooterWatermark from "@/components/ui/footer";
import IntelligenceView from "@/components/ui/intelligence-view";

export const metadata = {
  title: "Intelligence | SecureMailScope",
  description: "AI-assisted risk assessment and anomaly analysis for email packet captures.",
};

export default function IntelligencePage() {
  return (
    <ViewTransition enter="page-enter" exit="page-exit" default="none">
      <main
        className="h-full min-h-0 min-w-0 flex-1 overflow-y-auto bg-white dark-soc:bg-[#111111]"
        aria-label="Intelligence analysis"
      >
        <DashboardTopbar currentPage="Intelligence" showRefresh />
        <IntelligenceView />
        <FooterWatermark />
      </main>
    </ViewTransition>
  );
}
