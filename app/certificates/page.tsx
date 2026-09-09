import { ViewTransition } from "react";
import DashboardTopbar from "@/components/ui/dashboard-topbar";
import CertificatesView from "@/components/ui/certificates-view";
import { getAnalysisHistory } from "@/lib/securemail-api";
import { fetchTmpVaultEmails } from "@/lib/tmpvault-api";

export const metadata = {
  title: "Certificates | SecureMailScope",
  description: "X.509 certificate inventory, expiration monitoring, and chain of trust validation.",
};

export default async function CertificatesPage() {
  const [history, tmpVaultEmails] = await Promise.all([
    getAnalysisHistory({ skip: 0, limit: 100 }),
    fetchTmpVaultEmails(),
  ]);

  return (
    <ViewTransition enter="page-enter" exit="page-exit" default="none">
      <main
        className="h-full min-h-0 min-w-0 flex-1 overflow-y-auto bg-white dark-soc:bg-[#111111]"
        aria-label="Certificates analysis"
      >
        <DashboardTopbar currentPage="Certificates" showRefresh />
        <CertificatesView records={history.records} tmpVaultEmails={tmpVaultEmails} />
      </main>
    </ViewTransition>
  );
}
