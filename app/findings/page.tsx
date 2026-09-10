import { ViewTransition } from "react";
import DashboardTopbar from "@/components/ui/dashboard-topbar";
import FooterWatermark from "@/components/ui/footer";
import FindingsView from "@/components/ui/findings-view";
import { getAnalysisHistory } from "@/lib/securemail-api";
import { fetchTmpVaultEmails } from "@/lib/tmpvault-api";

export const metadata = {
  title: "Findings | SecureMailScope",
  description: "Centralized security findings, rule triggers, and triage remediation workflow.",
};

export default async function FindingsPage() {
  const [history, tmpVaultEmails] = await Promise.all([
    getAnalysisHistory({ skip: 0, limit: 100 }),
    fetchTmpVaultEmails(),
  ]);

  return (
    <ViewTransition enter="page-enter" exit="page-exit" default="none">
      <main
        className="h-full min-h-0 min-w-0 flex-1 overflow-y-auto bg-white dark-soc:bg-[#111111]"
        aria-label="Findings analysis"
      >
        <DashboardTopbar currentPage="Findings" showRefresh />
        <FindingsView records={history.records} tmpVaultEmails={tmpVaultEmails} />
        <FooterWatermark />
      </main>
    </ViewTransition>
  );
}
