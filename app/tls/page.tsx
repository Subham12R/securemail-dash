import { ViewTransition } from "react";
import DashboardTopbar from "@/components/ui/dashboard-topbar";
import TlsView from "@/components/ui/tls-view";
import { getAnalysisHistory } from "@/lib/securemail-api";
import { fetchTmpVaultEmails } from "@/lib/tmpvault-api";

export const metadata = {
  title: "TLS Analysis | SecureMailScope",
  description: "Cryptographic assessment of TLS versions, cipher suites, forward secrecy, and key exchanges.",
};

export default async function TlsPage() {
  const [history, tmpVaultEmails] = await Promise.all([
    getAnalysisHistory({ skip: 0, limit: 100 }),
    fetchTmpVaultEmails(),
  ]);

  return (
    <ViewTransition enter="page-enter" exit="page-exit" default="none">
      <main
        className="h-full min-h-0 min-w-0 flex-1 overflow-y-auto bg-white dark-soc:bg-[#111111]"
        aria-label="TLS analysis"
      >
        <DashboardTopbar currentPage="TLS Analysis" showRefresh />
        <TlsView records={history.records} tmpVaultEmails={tmpVaultEmails} />
      </main>
    </ViewTransition>
  );
}
